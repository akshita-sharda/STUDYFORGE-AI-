from test_chat import session
from app import main


def test_avatar_and_planner_persist(session):
    c,h,uid=session
    payload={'gender':'non-binary','avatar':{'hair':'braids','skin':'dark','hair_color':'silver','headwear':'cap','clothing':'cardigan','face':'round','brows':'arched','expression':'confident','beard':'goatee','glasses':True,'eyewear':'rect','presentation':'neutral','makeup':'soft','lips':'plum','earrings':'hoops'}}
    assert c.put('/api/profile/avatar',json=payload).status_code==401
    assert c.put('/api/profile/avatar',headers=h,json=payload).status_code==200
    saved=c.get('/api/auth/me',headers=h).json()['user']
    assert saved['gender']=='non-binary'
    assert saved['avatar']['headwear']=='cap'
    assert saved['avatar']['presentation']=='neutral'
    assert saved['avatar']['earrings']=='hoops'
    assert c.put('/api/profile/avatar',headers=h,json={'avatar':{'hair':'invalid'}}).status_code==422
    task={'title':'Build compiler','kind':'project','subject':'Compilers','priority':'high','notes':'Lexer first','due_date':'2026-10-03'}
    response=c.post('/api/study/tasks',headers=h,json=task)
    assert response.status_code==200
    task_id=response.json()['id']
    assert c.get('/api/study/tasks',headers=h).json()[0]['notes']=='Lexer first'
    assert c.put('/api/study/tasks/'+task_id,headers=h,json={**task,'status':'done'}).status_code==200
    assert c.get('/api/study/summary',headers=h).json()['tasks'][0]['status']=='done'


def test_study_tool_ownership_and_scores(session,monkeypatch):
    c,h,uid=session
    with main.db_connection() as db:
        db.execute("INSERT INTO documents(id,filename,user_id) VALUES('owned','notes.pdf',?)",(uid,))
        db.execute("INSERT INTO documents(id,filename,user_id) VALUES('other','private.pdf','someone-else')")
    for endpoint in ['flashcards','quizzes']:
        assert c.post('/api/'+endpoint+'/generate',json={'document_id':'owned'}).status_code==401
        assert c.post('/api/'+endpoint+'/generate',headers=h,json={'document_id':'other'}).status_code==404
    monkeypatch.setattr(main,'ask_gemini_quiz',lambda *a:[{'id':'1','question':'2+2?','options':['3','4'],'answer':'4','explanation':'Two pairs.'}])
    response=c.post('/api/quizzes/generate',headers=h,json={'document_id':'owned'}).json()
    assert 'answer' not in response['questions'][0]
    route='/api/quizzes/'+response['quiz_id']+'/submit'
    assert c.post(route,headers=h,json={'answers':{}}).status_code==422
    for _ in range(2):
        assert c.post(route,headers=h,json={'answers':{'1':'4'}}).json()['score']==1
    assert c.get('/api/progress',headers=h).json()['quizzes_completed']==1
    assert c.delete('/api/study/documents/other',headers=h).status_code==404
    assert c.delete('/api/study/documents/owned',headers=h).status_code==200
    assert c.post(route,headers=h,json={'answers':{'1':'4'}}).status_code==404
