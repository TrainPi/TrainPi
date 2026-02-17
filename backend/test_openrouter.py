#!/usr/bin/env python3
"""
Test OpenRouter API with Hermes 3 405B Instruct (free)
"""
import openai
import os
import sys

# OpenRouter configuration
OPENROUTER_API_KEY = "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"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
HERMES_MODEL = "nousresearch/hermes-3-llama-3.1-405b:free"

def test_openrouter_api(api_key, model_name):
    """Test OpenRouter API with the free Hermes model"""
    try:
        client = openai.OpenAI(
            api_key=api_key,
            base_url=OPENROUTER_BASE_URL
        )
        
        print("🔍 Testing OpenRouter API...")
        print(f"🔑 Key: {api_key[:20]}...")
        print(f"🤖 Model: {model_name}")
        print(f"🌐 Base URL: {OPENROUTER_BASE_URL}")
        
        # Test with a simple completion
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say 'OpenRouter with Hermes 3 is working perfectly!' if you can respond."}
            ],
            max_tokens=30,
            temperature=0,
            # OpenRouter specific headers (optional but recommended)
            extra_headers={
                "HTTP-Referer": "https://trainpi.com",
                "X-Title": "TrainPI AI Service Test"
            }
        )
        
        result = response.choices[0].message.content
        print(f"✅ SUCCESS: {result}")
        print(f"📊 Model Response: {response.model}")
        
        # Check usage stats
        if hasattr(response, 'usage') and response.usage:
            print(f"📈 Prompt tokens: {response.usage.prompt_tokens}")
            print(f"📈 Completion tokens: {response.usage.completion_tokens}")
            print(f"📈 Total tokens: {response.usage.total_tokens}")
        
        return True, result
        
    except openai.AuthenticationError as e:
        print(f"❌ AUTHENTICATION ERROR: {e}")
        return False, f"Authentication failed: {e}"
    except openai.BadRequestError as e:
        print(f"❌ BAD REQUEST: {e}")
        return False, str(e)
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False, str(e)

def test_json_response(api_key, model_name):
    """Test JSON structured output capability"""
    try:
        client = openai.OpenAI(
            api_key=api_key,
            base_url=OPENROUTER_BASE_URL
        )
        
        print("\n🧪 Testing JSON Response...")
        
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a helpful assistant. Always respond in valid JSON format."},
                {"role": "user", "content": """Create a simple learning roadmap for Python. Return JSON with:
                {
                  "steps": [{"step_number": 1, "title": "...", "description": "..."}],
                  "estimated_timeline": "...",
                  "status": "success"
                }
                Keep it to 2 steps only."""}
            ],
            max_tokens=200,
            temperature=0
        )
        
        result = response.choices[0].message.content
        print(f"✅ JSON Response: {result[:200]}...")
        
        # Try to parse as JSON
        import json
        try:
            json_data = json.loads(result)
            print(f"✅ Valid JSON with {len(json_data.get('steps', []))} steps")
            return True, json_data
        except json.JSONDecodeError:
            print("⚠️ Response received but not valid JSON")
            return True, result
        
    except Exception as e:
        print(f"❌ JSON Test Error: {e}")
        return False, str(e)

if __name__ == "__main__":
    print("🚀 Testing OpenRouter with Hermes 3 405B (FREE)")
    print("=" * 60)
    
    # Test basic functionality
    success, message = test_openrouter_api(OPENROUTER_API_KEY, HERMES_MODEL)
    
    if success:
        print(f"\n🎉 OpenRouter API is WORKING! 🎉")
        
        # Test JSON capability
        json_success, json_result = test_json_response(OPENROUTER_API_KEY, HERMES_MODEL)
        
        if json_success:
            print(f"\n🎯 JSON responses also working!")
            print("\n💡 Next steps:")
            print("1. ✅ Add OpenRouter to your .env file")
            print("2. ✅ Update AI service to use OpenRouter as primary")
            print("3. ✅ This is a FREE model - no quota concerns!")
        
    else:
        print(f"\n💥 OpenRouter Test FAILED: {message}")
        print("\n🔧 Troubleshooting:")
        print("1. Check API key validity")
        print("2. Verify network connection") 
        print("3. Check OpenRouter status")