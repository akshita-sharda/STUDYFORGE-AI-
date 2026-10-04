from test_chat import session


def test_health(session):
    client,headers,_=session
    assert client.get('/health').json()['assistant']=='ASHIEY'


def test_progress_starts_with_expected_fields(session):
    client,headers,_=session
    assert client.get('/api/progress').status_code==401
    response=client.get('/api/progress',headers=headers)
    assert response.status_code==200
    assert response.json()['quizzes_completed']==0


def test_student_can_signup_and_save_preferences(session):
    client,headers,_=session
    response=client.put('/api/profile/preferences',headers=headers,json={'subjects':['Data Science'],'study_goal':'Pass my exam'})
    assert response.status_code==200
    assert response.json()['user']['subjects']==['Data Science']
