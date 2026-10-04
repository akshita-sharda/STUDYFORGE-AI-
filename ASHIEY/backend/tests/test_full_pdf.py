from types import SimpleNamespace
import fitz
from test_chat import session
from app import main


def sample_pdf(scanned=False):
    with fitz.open() as pdf:
        page = pdf.new_page()
        page.insert_text((72, 72), 'Question 1: What is 12 + 30?')
        if not scanned:
            return pdf.tobytes()
        image = page.get_pixmap().tobytes('png')
    with fitz.open() as pdf:
        page = pdf.new_page()
        page.insert_image(page.rect, stream=image)
        return pdf.tobytes()


def test_scanned_upload_and_full_pdf_payload(session, monkeypatch, tmp_path):
    client, headers, _ = session
    monkeypatch.setattr(main, 'UPLOAD_DIR', tmp_path)
    monkeypatch.setenv('GEMINI_API_KEY', 'test-only')
    body = sample_pdf(scanned=True)
    upload = client.post('/api/documents/upload', headers=headers, files={'file':('scan.pdf',body,'application/pdf')})
    assert upload.status_code == 200
    assert upload.json()['scanned'] is True
    assert upload.json()['pages'] == 1
    captured = {}
    class FakeClient:
        def __init__(self, **kwargs):
            self.models = self
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def generate_content(self, **kwargs):
            captured.update(kwargs)
            return SimpleNamespace(text='12 + 30 = 42. [Page 1]')
    monkeypatch.setattr(main.genai, 'Client', FakeClient)
    response = client.post('/api/chat', headers=headers, json={'question':'Solve question 1', 'study_mode':'solve', 'document_id':upload.json()['document_id']})
    assert response.status_code == 200
    assert response.json()['document_reading'] == 'full-pdf'
    assert response.json()['sources'][0]['page'] == 1
    part = captured['contents'][-1].parts[0].inline_data
    assert part.mime_type == 'application/pdf'
    assert part.data == body
    assert 'complete attached PDF' in captured['config'].system_instruction


def test_missing_file_and_invalid_pdf(session, monkeypatch, tmp_path):
    client, headers, user_id = session
    monkeypatch.setattr(main, 'UPLOAD_DIR', tmp_path)
    monkeypatch.setenv('GEMINI_API_KEY', 'test-only')
    with main.db_connection() as db:
        db.execute("INSERT INTO documents(id,filename,user_id) VALUES('missing','missing.pdf',?)",(user_id,))
    assert client.post('/api/chat', headers=headers, json={'question':'read this', 'document_id':'missing'}).status_code == 404
    assert client.post('/api/documents/upload', headers=headers, files={'file':('bad.pdf',b'not a PDF','application/pdf')}).status_code == 400
    with fitz.open() as pdf:
        for _ in range(201):
            pdf.new_page()
        oversized = pdf.tobytes()
    assert client.post('/api/documents/upload', headers=headers, files={'file':('long.pdf',oversized,'application/pdf')}).status_code == 400


def test_busy_provider_error_is_safe(session, monkeypatch):
    client, headers, _ = session
    class Busy(Exception):
        code = 503
    def fail(*args):
        raise Busy('provider detail with secret')
    monkeypatch.setattr(main,'ask_gemini',fail)
    response=client.post('/api/chat',headers=headers,json={'question':'hi'})
    assert response.status_code == 503
    assert 'busy' in response.json()['detail']
    assert 'secret' not in response.text
