from test_chat import session
from app import main


def test_task_lifecycle(session):
    client, headers, _ = session
    payload = {'title':'Finish SQL assignment', 'kind':'assignment', 'due_date':'2026-10-10'}
    response = client.post('/api/study/tasks', headers=headers, json=payload)
    assert response.status_code == 200
    task = response.json()
    assert task['status'] == 'pending'
    assert client.get('/api/study/tasks', headers=headers).json()[0]['due_date'] == '2026-10-10'
    payload.update(title='Practise SQL joins', status='done')
    assert client.put('/api/study/tasks/'+task['id'], headers=headers, json=payload).status_code == 200
    assert client.get('/api/study/tasks', headers=headers).json()[0]['status'] == 'done'
    payload['status'] = 'pending'
    client.put('/api/study/tasks/'+task['id'], headers=headers, json=payload)
    assert client.get('/api/study/tasks', headers=headers).json()[0]['title'] == 'Practise SQL joins'
    assert client.delete('/api/study/tasks/'+task['id'], headers=headers).status_code == 200
    assert client.get('/api/study/tasks', headers=headers).json() == []


def test_task_validation_and_privacy(session):
    client, headers, _ = session
    assert client.get('/api/study/tasks').status_code == 401
    for body in [{'title':'   '}, {'title':'Task','due_date':'not-a-date'}, {'title':'Task','status':'other'}]:
        assert client.post('/api/study/tasks', headers=headers, json=body).status_code == 422
    with main.db_connection() as db:
        db.execute("INSERT INTO student_tasks (id,user_id,title,kind,status) VALUES ('private','other','Secret task','exam','pending')")
    assert client.get('/api/study/tasks', headers=headers).json() == []
    assert client.put('/api/study/tasks/private', headers=headers, json={'title':'Overwrite'}).status_code == 404
    assert client.delete('/api/study/tasks/private', headers=headers).status_code == 404


def test_solve_and_plan_modes(session, monkeypatch):
    client, headers, _ = session
    prompts = []
    monkeypatch.setattr(main, 'ask_gemini', lambda question, *args: prompts.append(question) or 'Test response')
    for mode, phrase in [('solve','final result'), ('plan','available study hours')]:
        assert client.post('/api/chat', headers=headers, json={'question':'Help me study', 'study_mode':mode}).status_code == 200
        assert phrase in prompts[-1]
        assert client.put('/api/study/conversations/'+mode, headers=headers, json={'title':mode, 'study_mode':mode,'messages':[]}).status_code == 200
        assert client.get('/api/study/conversations/'+mode, headers=headers).json()['study_mode'] == mode
