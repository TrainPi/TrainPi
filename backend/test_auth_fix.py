#!/usr/bin/env python3
"""
Quick registration and login helper for testing
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def register_test_user():
    """Register a test user for development"""
    test_user = {
        "email": "test@trainpi.dev",
        "password": "testpass123", 
        "full_name": "Test User"
    }
    
    print("🔧 Registering test user...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=test_user
        )
        
        if response.status_code == 200:
            print("✅ Test user registered successfully!")
            return test_user
        else:
            print(f"ℹ️ Registration response: {response.status_code}")
            # User might already exist, try login
            return test_user
            
    except Exception as e:
        print(f"❌ Registration failed: {e}")
        return test_user

def login_test_user(user):
    """Login and get auth token"""
    print("🔑 Logging in test user...")
    
    try:
        # FastAPI auth expects form data
        login_data = {
            "username": user["email"],
            "password": user["password"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            token_data = response.json()
            token = token_data["access_token"]
            print("✅ Login successful!")
            print(f"🎫 Token: {token[:20]}...")
            return token
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_authenticated_ai_endpoint(token):
    """Test the AI endpoint with authentication"""
    print("🧪 Testing AI endpoint with authentication...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "goal": "become a software developer"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ai/career-goals-guidance",
            json=payload,
            headers=headers
        )
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ AI endpoint working with authentication!")
            print(f"📝 Steps generated: {len(result.get('steps', []))}")
            print(f"⏱️ Timeline: {result.get('estimated_timeline', 'N/A')}")
            return True
        else:
            print(f"❌ AI endpoint failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ AI endpoint error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 FIXING AUTHENTICATION FOR AI ENDPOINTS")
    print("=" * 50)
    
    # Step 1: Register test user
    user = register_test_user()
    
    # Step 2: Login and get token  
    token = login_test_user(user)
    
    if token:
        # Step 3: Test AI endpoint
        success = test_authenticated_ai_endpoint(token)
        
        if success:
            print("\n🎉 AUTHENTICATION + AI INTEGRATION WORKING!")
            print("=" * 50)
            print("✅ Backend is fully operational")
            print("✅ Groq AI integration active") 
            print("✅ Authentication system working")
            print("✅ AI endpoints accessible")
            
            print(f"\n🔧 FRONTEND SOLUTION:")
            print(f"1. Make sure user is logged in on frontend")
            print(f"2. Check auth token is being sent in requests")
            print(f"3. Verify token is valid and not expired")
            
            print(f"\n🧪 TEST CREDENTIALS:")
            print(f"Email: {user['email']}")
            print(f"Password: {user['password']}")
            
        else:
            print(f"\n❌ AI endpoint still has issues")
    else:
        print(f"\n❌ Could not complete authentication test")