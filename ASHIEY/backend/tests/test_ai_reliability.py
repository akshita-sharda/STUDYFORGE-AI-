import json
import httpx
import pytest
from types import SimpleNamespace
from app import main
from test_chat import session
from test_full_pdf import sample_pdf


def test_reconnect_before_text_only(monkeypatch):
    calls=[]
    def stream(*args):
        calls.append(1)
        if len(calls)==1:
            raise httpx.RemoteProtocolError('reset')
        yield 'Complete answer'
    monkeypatch.setattr(main,'_stream_groq_once',stream)
    assert ''.join(main.stream_groq('Hi',[]))=='Complete answer'
    assert len(calls)==2
    calls.clear()
    def partial(*args):
        calls.append(1)
        yield 'Partial'
        raise httpx.RemoteProtocolError('reset')
    monkeypatch.setattr(main,'_stream_groq_once',partial)
    iterator=main.stream_groq('Hi',[])
    assert next(iterator)=='Partial'
    with pytest.raises(httpx.RemoteProtocolError): next(iterator)
    assert len(calls)==1


def test_long_reply_keeps_followup_context(monkeypatch):
    monkeypatch.setenv('GROQ_API_KEY','test-only')
    original=httpx.Client
    captured={}
    def handler(request):
        captured.update(json.loads(request.content))
        return httpx.Response(200,text='data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n')
    monkeypatch.setattr(main.httpx,'Client',lambda **kw:original(transport=httpx.MockTransport(handler),**kw))
    history=[main.ChatMessage(role='user',content='Explain merge sort'),main.ChatMessage(role='assistant',content='x'*12000)]
    assert ''.join(main.stream_groq('Explain its complexity',history))=='ok'
    assert any(m['content']=='Explain merge sort' for m in captured['messages'])
    assert captured['max_completion_tokens']==4096


@pytest.mark.parametrize('quiz',[False,True])
def test_scanned_generation_and_malformed_results(session,monkeypatch,tmp_path,quiz):
    client,headers,_=session
    monkeypatch.setattr(main,'UPLOAD_DIR',tmp_path)
    monkeypatch.setenv('GEMINI_API_KEY','test-only')
    pdf=sample_pdf(scanned=True)
    upload=client.post('/api/documents/upload',headers=headers,files={'file':('scan.pdf',pdf,'application/pdf')})
    document_id=upload.json()['document_id']
    item={'question':'What is 12 + 30?','answer':'42','source_page':1}
    if quiz:item.update(options=['42','30','12','24'],correct_answer='42',explanation='12 plus 30 equals 42.')
    captured={}
    class Fake:
        def __enter__(self):self.models=self;return self
        def __exit__(self,*args):pass
        def generate_content(self,**kw):
            captured.update(kw)
            return SimpleNamespace(text=json.dumps([item]))
    monkeypatch.setattr(main,'gemini_client',Fake)
    route='/api/quizzes/generate' if quiz else '/api/flashcards/generate'
    response=client.post(route,headers=headers,json={'document_id':document_id,'count':3})
    assert response.status_code==200,response.text
    assert captured['contents'][0].inline_data.data==pdf
    item['source_page']=900
    response=client.post(route,headers=headers,json={'document_id':document_id,'count':3})
    assert response.status_code==502
    assert 'incomplete study material' in response.json()['detail']


def test_gemini_incomplete_finish_is_not_success():
    from fastapi import HTTPException
    for reason in ("MAX_TOKENS", "SAFETY"):
        with pytest.raises(HTTPException) as failure:
            main.check_gemini_finish(SimpleNamespace(candidates=[SimpleNamespace(finish_reason=reason)]))
        assert failure.value.status_code == 502
    main.check_gemini_finish(SimpleNamespace(candidates=[SimpleNamespace(finish_reason="STOP")]))


def test_gemini_busy_fallback_is_bounded(monkeypatch):
    monkeypatch.setenv("GEMINI_FALLBACK_MODEL", "secondary")
    class Busy(Exception): code = 503
    calls=[]
    class Fake:
        def generate_content(self,**payload):
            calls.append(payload["model"])
            if payload["model"] == "primary": raise Busy()
            return SimpleNamespace(text="complete")
    client=SimpleNamespace(models=Fake())
    assert main.generate_gemini_content(client,model="primary").text == "complete"
    assert calls == ["primary", "secondary"]
    calls.clear()
    class Limited(Exception): code = 429
    def limited(**payload):calls.append(payload["model"]);raise Limited()
    client.models.generate_content=limited
    with pytest.raises(Limited):main.generate_gemini_content(client,model="primary")
    assert calls == ["primary"]


def test_study_items_keep_distinct_concepts_and_add_focus():
    items = [
        {"question": "What is virtual memory?", "answer": "It maps virtual addresses to physical memory."},
        {"question": "Explain the meaning of virtual memory.", "answer": "It maps virtual addresses to physical memory."},
        {"question": "How does a page fault change program execution?", "answer": "The operating system loads the required page before continuing."},
    ]
    kept = main.keep_distinct_study_items(items, 3, quiz=False)
    assert len(kept) == 2
    assert kept[0]["focus"]
    assert kept[1]["question"].startswith("How does a page fault")


def test_quiz_items_keep_distinct_concepts_after_storage_formatting():
    items = [
        {"question": "What is a process?", "answer": "A running program.", "options": ["A running program", "A compiler", "A file", "A thread"], "explanation": "A process is a program in execution."},
        {"question": "Define a process in an operating system.", "answer": "A running program.", "options": ["A running program", "A compiler", "A file", "A thread"], "explanation": "A process is a program in execution."},
        {"question": "What is the purpose of a scheduler?", "answer": "It selects the next process to run.", "options": ["It selects the next process to run.", "It writes source code", "It stores files", "It encrypts memory"], "explanation": "Scheduling allocates CPU time."},
    ]
    kept = main.keep_distinct_study_items(items, 3, quiz=True)
    assert len(kept) == 2
    assert all(item["focus"] for item in kept)
