from test_chat import session
from app import main


def test_library_assignment_and_ownership(session):
    client, headers, user_id = session
    subject = client.post('/api/study/subjects', headers=headers, json={'name':'DSA'}).json()
    with main.db_connection() as db:
        db.execute("INSERT INTO documents (id, filename, user_id) VALUES ('mine', 'notes.pdf', ?)", (user_id,))
        db.execute("INSERT INTO documents (id, filename, user_id) VALUES ('theirs', 'private.pdf', 'another-user')")
    assert client.put('/api/study/documents/mine/subject', headers=headers, json={'subject_id':subject['id']}).status_code == 200
    library = client.get('/api/study/library', headers=headers).json()
    assert len(library['documents']) == 1
    assert library['documents'][0]['subject_id'] == subject['id']
    assert client.put('/api/study/documents/theirs/subject', headers=headers, json={'subject_id':subject['id']}).status_code == 404
    assert client.post('/api/study/subjects', headers=headers, json={'name':'DSA'}).status_code == 409


def test_saved_conversation_roundtrip_and_privacy(session):
    client, headers, user_id = session
    payload = {'title':'SQL revision', 'study_mode':'hint', 'messages':[{'role':'user','content':'Explain joins'}, {'role':'assistant','content':'```sql\nSELECT 1;\n```','sources':[{'page':1,'excerpt':'SQL notes'}]}]}
    assert client.put('/api/study/conversations/example', headers=headers, json=payload).status_code == 200
    saved = client.get('/api/study/conversations/example', headers=headers).json()
    assert saved['study_mode'] == 'hint'
    assert saved['messages'][1]['content'] == payload['messages'][1]['content']
    other_headers = {'Authorization':'Bearer ' + main.create_token('other')}
    with main.db_connection() as db:
        db.execute("INSERT INTO users (id, name, email, password_hash) VALUES ('other', 'Other', 'other@example.test', 'unused')")
    assert client.get('/api/study/conversations/example', headers=other_headers).status_code == 404
    assert client.put('/api/study/conversations/example', headers=other_headers, json=payload).status_code == 404
    assert client.get('/api/study/conversations', headers=other_headers).json() == []
    assert client.delete('/api/study/conversations/example', headers=headers).status_code == 200
    assert client.get('/api/study/conversations/example', headers=headers).status_code == 404


def test_revision_status_persistence(session):
    client, headers, _ = session
    subject = client.post('/api/study/subjects', headers=headers, json={'name':'OS'}).json()
    topic = client.post('/api/study/topics', headers=headers, json={'subject_id':subject['id'],'name':'Deadlocks'}).json()
    assert topic['status'] == 'learning'
    assert client.patch('/api/study/topics/'+topic['id'], headers=headers, json={'status':'revision'}).status_code == 200
    assert client.get('/api/study/topics', headers=headers).json()[0]['status'] == 'revision'
    assert client.patch('/api/study/topics/'+topic['id'], headers=headers, json={'status':'invalid'}).status_code == 422
    assert client.delete('/api/study/topics/'+topic['id'], headers=headers).status_code == 200
    assert client.get('/api/study/topics', headers=headers).json() == []


def test_study_modes_reach_generation(session, monkeypatch):
    client, headers, _ = session
    prompts = []
    monkeypatch.setattr(main, 'ask_gemini', lambda question, *args: prompts.append(question) or 'A study response')
    for mode, expected in [('hint','without revealing'), ('debug','minimal correction'), ('viva','one question at a time'), ('explain','small example')]:
        response = client.post('/api/chat', headers=headers, json={'question':'Help me', 'study_mode':mode})
        assert response.status_code == 200
        assert expected in prompts[-1]
    assert client.post('/api/chat', headers=headers, json={'question':'Help me', 'study_mode':'invalid'}).status_code == 422


def test_study_routes_require_login(session):
    client, _, _ = session
    for path in ['library','topics','conversations']:
        assert client.get('/api/study/'+path).status_code == 401
