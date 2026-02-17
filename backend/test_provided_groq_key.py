#!/usr/bin/env python3
"""
Test the provided Groq API key
"""
import openai
import json

# Get your key from https://groq.com
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

def test_groq_key():
    """Test the provided Groq API key"""
    try:
        client = openai.OpenAI(
            api_key=GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1"
        )
        
        print("🔍 Testing Groq API Key...")
        print(f"🔑 Key: {GROQ_API_KEY[:20]}...")
        
        # Test with Llama model
        response = client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say 'Groq API is working perfectly!' if you can respond."}
            ],
            max_tokens=50,
            temperature=0
        )
        
        result = response.choices[0].message.content
        print(f"✅ SUCCESS: {result}")
        
        if hasattr(response, 'usage'):
            usage = response.usage
            print(f"📊 Tokens used: {usage.total_tokens}")
            print(f"💰 Daily limit: 30,000 tokens (remaining: ~{30000 - usage.total_tokens})")
        
        return True, result
        
    except openai.AuthenticationError:
        print("❌ AUTHENTICATION ERROR: Invalid API key")
        return False, "Invalid key"
    except openai.RateLimitError:
        print("❌ RATE LIMIT: Daily limit reached")
        return False, "Rate limited"
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False, str(e)

if __name__ == "__main__":
    print("🚀 TESTING PROVIDED GROQ API KEY")
    print("=" * 40)
    
    success, message = test_groq_key()
    
    if success:
        print(f"\n🎉 GROQ API KEY IS WORKING! 🎉")
        print(f"✅ You now have 30,000 tokens/day FREE")
        print(f"⚡ Ultra-fast AI responses")
        print(f"🚫 No more rate limiting!")
    else:
        print(f"\n💥 Key test failed: {message}")