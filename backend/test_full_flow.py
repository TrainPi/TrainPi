import requests
import json

# Test the career goals guidance endpoint
url = "http://127.0.0.1:8000/api/ai/career-goals-guidance"
headers = {
    "Content-Type": "application/json",
}

# You'll need to get a valid token first - let me create a test that logs in
login_url = "http://127.0.0.1:8000/api/auth/login"
login_data = {
    "username": "test@example.com",
    "password": "testpass123"
}

print("Testing full AI flow...")
print("\n1. Logging in...")
try:
    # Try to login
    response = requests.post(
        login_url,
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if response.status_code == 401:
        print("   User doesn't exist, registering...")
        # Register first
        register_url = "http://127.0.0.1:8000/api/auth/register"
        register_data = {
            "email": "test@example.com",
            "password": "testpass123",
            "full_name": "Test User"
        }
        reg_response = requests.post(register_url, json=register_data)
        print(f"   Registration: {reg_response.status_code}")
        
        # Try login again
        response = requests.post(
            login_url,
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
    
    token = response.json()["access_token"]
    print(f"   ✓ Logged in successfully")
    
    print("\n2. Testing AI career guidance...")
    headers["Authorization"] = f"Bearer {token}"
    
    ai_data = {
        "goal": "I want to learn Python programming"
    }
    
    ai_response = requests.post(url, json=ai_data, headers=headers)
    print(f"   Status: {ai_response.status_code}")
    
    if ai_response.status_code == 200:
        result = ai_response.json()
        print(f"   ✓ AI Response received!")
        print(f"   Steps: {len(result.get('steps', []))}")
        print(f"   Timeline: {result.get('estimated_timeline', 'N/A')}")
        print(f"\n   ✓✓✓ FULL FLOW WORKING! ✓✓✓")
    else:
        print(f"   ✗ Error: {ai_response.text}")
        
except Exception as e:
    print(f"   ✗ Error: {e}")
