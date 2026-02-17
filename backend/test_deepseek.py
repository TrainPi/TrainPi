#!/usr/bin/env python3
"""
Test DeepSeek API with the specified model
"""
import openai
import os
import sys

# DeepSeek configuration
DEEPSEEK_MODEL = "deepseek/deepseek-r1-0528:free"
DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"

def test_deepseek_model(model_name, api_key=None):
    """Test DeepSeek model via OpenAI-compatible API"""
    try:
        # DeepSeek often provides free access, but check if API key is needed
        if api_key:
            client = openai.OpenAI(
                api_key=api_key,
                base_url=DEEPSEEK_BASE_URL
            )
        else:
            # Try without API key for free tier
            print("🔍 Testing DeepSeek without API key (free tier)...")
            client = openai.OpenAI(
                api_key="dummy-key",  # Some services accept dummy keys for free tier
                base_url=DEEPSEEK_BASE_URL
            )
        
        print(f"🔍 Testing DeepSeek Model: {model_name}")
        print(f"🌐 Base URL: {DEEPSEEK_BASE_URL}")
        
        # Test with a simple completion
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say 'DeepSeek API is working!' if you can respond."}
            ],
            max_tokens=50,
            temperature=0
        )
        
        result = response.choices[0].message.content
        print(f"✅ SUCCESS: {result}")
        print(f"📊 Model: {response.model}")
        print(f"📈 Tokens used: {response.usage.total_tokens if hasattr(response, 'usage') else 'N/A'}")
        return True, result
        
    except openai.AuthenticationError as e:
        print(f"❌ AUTHENTICATION ERROR: {e}")
        print("💡 You might need a DeepSeek API key. Get one at: https://platform.deepseek.com/")
        return False, f"Authentication error: {e}"
    except openai.BadRequestError as e:
        print(f"❌ BAD REQUEST: {e}")
        print("💡 Model might not be available or name is incorrect")
        return False, str(e)
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False, str(e)

def test_alternative_endpoints():
    """Test alternative DeepSeek endpoints"""
    endpoints = [
        "https://api.deepseek.com/v1",
        "https://api.deepseek.com",
        "https://openai.deepseek.com/v1"
    ]
    
    for endpoint in endpoints:
        print(f"\n🔄 Trying endpoint: {endpoint}")
        try:
            client = openai.OpenAI(
                api_key="dummy-key",
                base_url=endpoint
            )
            
            response = client.chat.completions.create(
                model="deepseek-chat",  # Try simpler model name
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10
            )
            
            print(f"✅ SUCCESS with {endpoint}")
            return True, endpoint
        except Exception as e:
            print(f"❌ Failed: {e}")
    
    return False, "All endpoints failed"

if __name__ == "__main__":
    print("🚀 Testing DeepSeek AI Model")
    print("=" * 50)
    
    # Test the specific model
    success, message = test_deepseek_model(DEEPSEEK_MODEL)
    
    if not success and "authentication" in message.lower():
        print("\n🔄 Trying alternative configurations...")
        success, endpoint = test_alternative_endpoints()
    
    if success:
        print(f"\n🎉 DeepSeek Model '{DEEPSEEK_MODEL}' is WORKING! 🎉")
        print("\n💡 Next steps:")
        print("1. Add DeepSeek as backup AI service")
        print("2. Get DeepSeek API key if needed: https://platform.deepseek.com/")
    else:
        print(f"\n💥 DeepSeek Model FAILED: {message}")
        print("\n💡 Alternative options:")
        print("1. Get DeepSeek API key: https://platform.deepseek.com/")
        print("2. Try different model names: deepseek-chat, deepseek-coder")
        print("3. Check DeepSeek documentation for correct endpoints")