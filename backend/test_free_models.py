#!/usr/bin/env python3
"""
Test multiple free models on OpenRouter to find working alternatives
"""
import openai
import time

OPENROUTER_API_KEY = "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"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# List of free models to test
FREE_MODELS = [
    "nousresearch/hermes-3-llama-3.1-405b:free",
    "microsoft/phi-3-medium-128k-instruct:free",
    "microsoft/phi-3-mini-128k-instruct:free", 
    "meta-llama/llama-3.2-3b-instruct:free",
    "meta-llama/llama-3.2-1b-instruct:free",
    "google/gemma-2-9b-it:free",
    "huggingface/zephyr-7b-beta:free",
    "openchat/openchat-7b:free",
    "gryphe/mythomist-7b:free"
]

def test_model(model_name):
    """Test a specific model"""
    try:
        client = openai.OpenAI(
            api_key=OPENROUTER_API_KEY,
            base_url=OPENROUTER_BASE_URL
        )
        
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "user", "content": "Say 'Working!' if you can respond. Be brief."}
            ],
            max_tokens=10,
            temperature=0,
            timeout=10  # Quick timeout for testing
        )
        
        result = response.choices[0].message.content.strip()
        return True, result
        
    except openai.BadRequestError as e:
        if "not found" in str(e).lower():
            return False, "Model not available"
        return False, f"Bad request: {e}"
    except Exception as e:
        if "429" in str(e):
            return False, "Rate limited"
        elif "timeout" in str(e).lower():
            return False, "Timeout"
        return False, f"Error: {e}"

def find_working_free_model():
    """Test multiple free models to find one that works"""
    print("🔍 Testing free models on OpenRouter...")
    print("=" * 50)
    
    working_models = []
    
    for model in FREE_MODELS:
        print(f"\n🤖 Testing: {model}")
        success, message = test_model(model)
        
        if success:
            print(f"✅ WORKING: {message}")
            working_models.append(model)
        else:
            print(f"❌ Failed: {message}")
        
        # Small delay between requests
        time.sleep(1)
    
    print(f"\n{'='*50}")
    if working_models:
        print(f"🎉 Found {len(working_models)} working free model(s):")
        for model in working_models:
            print(f"  ✅ {model}")
        
        # Test the first working model more thoroughly
        best_model = working_models[0]
        print(f"\n🧪 Testing {best_model} more thoroughly...")
        
        try:
            client = openai.OpenAI(
                api_key=OPENROUTER_API_KEY,
                base_url=OPENROUTER_BASE_URL
            )
            
            response = client.chat.completions.create(
                model=best_model,
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant."},
                    {"role": "user", "content": "Create a JSON response with: {'status': 'success', 'message': 'AI is working', 'model': 'your_model_name'}"}
                ],
                max_tokens=100,
                temperature=0
            )
            
            result = response.choices[0].message.content
            print(f"✅ Full test result: {result}")
            
            return best_model, result
            
        except Exception as e:
            print(f"❌ Full test failed: {e}")
            return best_model, "Model works but full test failed"
    
    else:
        print("❌ No free models are currently working")
        print("\n💡 Alternatives:")
        print("1. Wait for rate limits to reset")
        print("2. Add your own API keys to OpenRouter")
        print("3. Try different AI providers")
        
        return None, "No working models found"

if __name__ == "__main__":
    working_model, response = find_working_free_model()
    
    if working_model:
        print(f"\n🎯 RECOMMENDED MODEL: {working_model}")
        print(f"📝 Add to your AI service as fallback option")
    else:
        print(f"\n💥 All models failed - try again later")