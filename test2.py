import requests
login_res = requests.post('http://localhost:8000/api/v1/auth/login', data={'username': 'aryan.k@srm.edu', 'password': 'password123'})
token = login_res.json()['access_token']

from backend.app.auth import get_current_user, SECRET_KEY, ALGORITHM
from jose import jwt
print(jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM]))
