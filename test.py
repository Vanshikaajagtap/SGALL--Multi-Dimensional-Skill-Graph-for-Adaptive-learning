import requests

login_res = requests.post('http://localhost:8000/api/v1/auth/login', data={'username': 'aryan.k@srm.edu', 'password': 'password123'})
print('Login:', login_res.status_code, login_res.text)

if login_res.status_code == 200:
    token = login_res.json()['access_token']
    auth = {'Authorization': f'Bearer {token}'}
    
    dash_res = requests.get('http://localhost:8000/api/v1/students/me/dashboard', headers=auth)
    print('/me/dashboard:', dash_res.status_code)
    
    dash_res2 = requests.get('http://localhost:8000/api/v1/students/1/dashboard', headers=auth)
    print('/1/dashboard:', dash_res2.status_code)
