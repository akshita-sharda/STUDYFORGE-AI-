import pytest
from fastapi.testclient import TestClient
from app import main

@pytest.fixture
def session(tmp_path, monkeypatch):
    monkeypatch.setattr(main, 'DATABASE_PATH', tmp_path / 'test.db')
    main.initialize_database()
    client = TestClient(main.app)
    result = client.post('/api/auth/signup', json={'name':'Chat Tester','email':'chat@example.com','password':'test-password-123'}).json()
    return client, {'Authorization': 'Bearer ' + result['token']}, result['user']['id']

def test_chat_requires_login(session):
    client, _, _ = session
    assert client.post('/api/chat', json={'question':'hello'}).status_code == 401

def test_history_reaches_model(session, monkeypatch):
    client, headers, _ = session
    def answer(question, context, history, document_mode):
        assert history[0].content == 'Explain loops'
        assert not document_mode and context == ''
        return 'Here is another loop example.'
    monkeypatch.setattr(main, 'ask_gemini', answer)
    r = client.post('/api/chat', headers=headers, json={'question':'another example?', 'history':[{'role':'user','content':'Explain loops'}]})
    assert r.status_code == 200
    assert r.json()['mode'] == 'ai'
    assert r.json()['sources'] == []

def test_rejects_foreign_document(session):
    client, headers, _ = session
    with main.db_connection() as db:
        db.execute("INSERT INTO documents (id, filename, user_id) VALUES ('private', 'private.pdf', 'someone-else')")
    assert client.post('/api/chat', headers=headers, json={'question':'tell me', 'document_id':'private'}).status_code == 404
    assert client.get('/api/documents', headers=headers).json() == []

def test_source_only_mode(session, monkeypatch):
    client, headers, user_id = session
    monkeypatch.delenv('GEMINI_API_KEY', raising=False)
    monkeypatch.setattr(main, 'ask_gemini', lambda *args: None)
    with main.db_connection() as db:
        db.execute("INSERT INTO documents (id, filename, user_id) VALUES ('notes', 'notes.pdf', ?)", (user_id,))
        db.execute("INSERT INTO chunks (document_id, page, text) VALUES ('notes', 2, 'Python loops repeat instructions.')")
    r = client.post('/api/chat', headers=headers, json={'question':'Python loops', 'document_id':'notes'})
    assert r.json()['mode'] == 'source-only'
    assert r.json()['sources'][0]['page'] == 2

def test_provider_failure_is_retryable(session, monkeypatch):
    client, headers, _ = session
    def fail(*args):
        raise RuntimeError('sensitive provider details')
    monkeypatch.setattr(main, 'ask_gemini', fail)
    r = client.post('/api/chat', headers=headers, json={'question':'hello'})
    assert r.status_code == 503
    assert 'sensitive' not in r.text

def test_blank_question(session):
    client, headers, _ = session
    assert client.post('/api/chat', headers=headers, json={'question':'   '}).status_code == 422

def test_btech_profile_persists(session):
    client, headers, _ = session
    response = client.put('/api/profile/preferences', headers=headers, json={
        'branch': 'Mechanical Engineering', 'semester': 4,
        'subjects': ['Thermodynamics'], 'study_goal': 'Prepare for viva',
    })
    assert response.status_code == 200
    profile = client.get('/api/auth/me', headers=headers).json()['user']
    assert profile['branch'] == 'Mechanical Engineering'
    assert profile['semester'] == 4
    assert profile['subjects'] == ['Thermodynamics']

def test_btech_semester_is_validated(session):
    client, headers, _ = session
    assert client.put('/api/profile/preferences', headers=headers, json={'semester': 9}).status_code == 422

def test_profile_migration_is_repeatable(session):
    main.initialize_database()
    main.initialize_database()
    client, headers, _ = session
    assert client.get('/api/auth/me', headers=headers).json()['user']['semester'] == 1
