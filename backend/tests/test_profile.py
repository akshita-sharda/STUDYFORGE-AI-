from test_chat import session


def test_profile_persists_and_validates(session):
    client, headers, _ = session
    payload = dict(name='Ada Student', college='CS College', branch='Computer Science', semester=5,
                   subjects=['DSA', ' DBMS ', 'DSA'], study_goal='Exams',
                   avatar=dict(color='mint', hair='curly', skin='deep', glasses=True))
    assert client.put('/api/profile', json=payload).status_code == 401
    response = client.put('/api/profile', json=payload, headers=headers)
    assert response.status_code == 200
    saved = client.get('/api/auth/me', headers=headers).json()['user']
    assert saved['name'] == 'Ada Student'
    assert saved['college'] == 'CS College'
    assert all(saved['avatar'][key] == value for key,value in payload['avatar'].items())
    assert saved['subjects'] == ['DSA', 'DBMS']
    assert saved['semester'] == 5
    for changes in [dict(name='  '), dict(branch=' '), dict(semester=9), dict(subjects=[]), dict(avatar=dict(color='bad'))]:
        assert client.put('/api/profile', json={**payload, **changes}, headers=headers).status_code == 422
    assert client.get('/api/auth/me', headers=headers).json()['user']['name'] == 'Ada Student'
