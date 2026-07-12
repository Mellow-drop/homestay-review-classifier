import urllib.request
import urllib.error
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def make_request(method, endpoint, data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f"Bearer {token}"
        
    req = urllib.request.Request(url, headers=headers, method=method)
    
    if data:
        req.data = json.dumps(data).encode('utf-8')
        
    try:
        response = urllib.request.urlopen(req)
        body = response.read().decode('utf-8')
        return response.status, json.loads(body) if body else None
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        return e.code, json.loads(body) if body else body
    except Exception as e:
        return 500, str(e)

print("="*50)
print("🚀 SentiNest API Test Script (Postman Alternative)")
print("="*50)

# 1. Register User
print("\n[1] Testing POST /api/auth/register...")
email = f"test_{int(time.time())}@example.com"
password = "securepassword123"
status, res = make_request("POST", "/api/auth/register", {"email": email, "password": password})
print(f"Status: {status}")
print(f"Response: {json.dumps(res, indent=2)}")

# 2. Login User
print("\n[2] Testing POST /api/auth/login...")
status, res = make_request("POST", "/api/auth/login", {"email": email, "password": password})
print(f"Status: {status}")
print(f"Response: {json.dumps(res, indent=2)}")

jwt_token = res.get('access_token') if isinstance(res, dict) else None

if jwt_token:
    print("\n✅ Successfully retrieved JWT Token!")
    
    # 3. Access Protected Route (Sessions)
    print("\n[3] Testing Protected GET /api/sessions...")
    status, sessions = make_request("GET", "/api/sessions", token=jwt_token)
    print(f"Status: {status}")
    print(f"Response: {json.dumps(sessions, indent=2)}")

    # 4. Access Protected Route (Search)
    print("\n[4] Testing Protected GET /api/reviews/search...")
    status, search_res = make_request("GET", "/api/reviews/search?sentiment=positive", token=jwt_token)
    print(f"Status: {status}")
    print(f"Response: {json.dumps(search_res, indent=2)}")
    
else:
    print("\n❌ Failed to get JWT Token, cannot test protected routes.")

print("\n" + "="*50)
print("Test Complete! You can take a screenshot of this terminal output.")
print("="*50)
