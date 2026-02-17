#!/usr/bin/env python3
"""
Test OpenAI API key functionality
"""
import openai
import os
import sys

# Test API key
test_key = "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"

def test_openai_key(api_key):
    """Test if OpenAI API key is working"""
    try:
        client = openai.OpenAI(api_key=api_key)
        
        print("🔍 Testing OpenAI API Key...")
        print(f"🔑 Key: {api_key[:20]}...")
        
        # Test with a simple completion
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say 'OpenAI API is working!' if you can respond."}
            ],
            max_tokens=10,
            temperature=0
        )
        
        result = response.choices[0].message.content
        print(f"✅ SUCCESS: {result}")
        print(f"📊 Model: {response.model}")
        print(f"📈 Tokens used: {response.usage.total_tokens}")
        return True, result
        
    except openai.AuthenticationError:
        print("❌ AUTHENTICATION ERROR: Invalid API key")
        return False, "Invalid API key"
    except openai.RateLimitError:
        print("❌ RATE LIMIT ERROR: Quota exceeded")  
        return False, "Rate limit exceeded"
    except openai.BadRequestError as e:
        print(f"❌ BAD REQUEST: {e}")
        return False, str(e)
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False, str(e)

if __name__ == "__main__":
    success, message = test_openai_key(test_key)
    if success:
        print("\n🎉 OpenAI API Key is WORKING! 🎉")
    else:
        print(f"\n💥 OpenAI API Key FAILED: {message}")