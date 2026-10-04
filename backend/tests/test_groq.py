import json
import httpx
from test_chat import session
from app import main


def test_provider_routing(session, monkeypatch):
    client, headers, _ = session
    monkeypatch.setenv('GROQ_API_KEY','test-only')
    monkeypatch.setenv('GEMINI_API_KEY','test-only')
    assert main.chat_provider() == 'groq'
    assert main.chat_provider('pdf') == 'gemini'
    calls=[]
    def fake(question, history):
        calls.append(question)
        yield 'A stack uses LIFO.'
    monkeypatch.setattr(main,'stream_groq',fake)
    assert client.post('/api/chat',headers=headers,json={'question':'What is a stack?'}).json()['answer'] == 'A stack uses LIFO.'
    events=client.post('/api/chat/stream',headers=headers,json={'question':'What is a stack?'}).text
    assert 'A stack uses LIFO.' in events
    assert client.get('/api/chat/status').json()['provider']=='groq'
    assert len(calls)==2


def test_groq_stream_payload(monkeypatch):
    monkeypatch.setenv('GROQ_API_KEY','test-only')
    captured={}
    original=httpx.Client
    def handler(request):
        captured.update(json.loads(request.content))
        return httpx.Response(200,text='data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: [DONE]\n\n')
    monkeypatch.setattr(main.httpx,'Client',lambda **kw:original(transport=httpx.MockTransport(handler),**kw))
    assert ''.join(main.stream_groq('Hi',[]))=='Hello'
    assert captured['model']=='openai/gpt-oss-120b'
    assert captured['messages'][-1]['content']=='Hi'
    assert captured['stream'] is True
