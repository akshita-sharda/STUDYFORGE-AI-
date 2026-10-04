import json
from types import SimpleNamespace
from test_chat import session
from test_full_pdf import sample_pdf
from app import main


def test_stream_full_pdf_and_citations(session, monkeypatch, tmp_path):
    client, headers, _ = session
    monkeypatch.setattr(main, 'UPLOAD_DIR', tmp_path)
    monkeypatch.setenv('GEMINI_API_KEY', 'test-only')
    pdf = sample_pdf(scanned=True)
    upload = client.post('/api/documents/upload', headers=headers, files={'file':('scan.pdf',pdf,'application/pdf')}).json()
    captured = {}
    class FakeClient:
        def __init__(self, **kwargs):
            captured['http'] = kwargs['http_options']
            self.models = self
        def __enter__(self): return self
        def __exit__(self, *args): captured['closed'] = True
        def generate_content_stream(self, **kwargs):
            captured.update(kwargs)
            yield SimpleNamespace(text='42. ')
            yield SimpleNamespace(text='[Page 1]')
    monkeypatch.setattr(main.genai, 'Client', FakeClient)
    response = client.post('/api/chat/stream', headers=headers, json={'question':'Solve question 1', 'document_id':upload['document_id']})
    events = [json.loads(line) for line in response.text.splitlines()]
    assert [e['type'] for e in events] == ['status','delta','delta','done']
    assert events[-1]['answer'] == '42. [Page 1]'
    assert events[-1]['sources'][0]['page'] == 1
    assert captured['contents'][-1].parts[0].inline_data.data == pdf
    assert captured['http'].retry_options.attempts == 1
    assert captured['http'].timeout == 45000
    assert captured['closed']


def test_stream_error_and_access(session, monkeypatch):
    client, headers, _ = session
    class Busy(Exception): code = 503
    def fail(args):
        yield 'Partial answer'
        raise Busy('sensitive provider details')
    monkeypatch.setattr(main, 'stream_gemini', fail)
    assert client.post('/api/chat/stream',json={'question':'Hi'}).status_code == 401
    assert client.post('/api/chat/stream',headers=headers,json={'question':'Hi','document_id':'someone-else'}).status_code == 404
    result = client.post('/api/chat/stream',headers=headers,json={'question':'Hi'})
    events = [json.loads(line) for line in result.text.splitlines()]
    assert events[-1]['type'] == 'error'
    assert 'busy' in events[-1]['message']
    assert 'sensitive' not in result.text
    assert not any(e['type'] == 'done' for e in events)
