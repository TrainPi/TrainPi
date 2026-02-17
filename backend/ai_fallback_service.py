"""
Enhanced AI service with OpenRouter fallback support
Add this to your ai_service.py or as a separate service
"""
import openai
import os
from dotenv import load_dotenv
import json

load_dotenv()

def get_openrouter_response(prompt: str, model_name: str = "meta-llama/llama-3.2-3b-instruct:free") -> str:
    """
    Get response from OpenRouter API as fallback when Google quota is exhausted
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return "OpenRouter API key not configured"
    
    try:
        client = openai.OpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1"
        )
        
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7,
            extra_headers={
                "HTTP-Referer": "https://trainpi.com",
                "X-Title": "TrainPI AI Service"
            }
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        if "429" in str(e):
            return "OpenRouter rate limit reached. Please try again later."
        elif "402" in str(e):
            return "OpenRouter spending limit reached. Consider upgrading or waiting for reset."
        return f"OpenRouter error: {str(e)}"

def get_ai_response_with_fallback(prompt: str) -> str:
    """
    Enhanced AI response with multiple fallbacks:
    1. Try Google/Gemini first
    2. Fall back to OpenRouter if quota exceeded
    3. Return helpful error message if all fail
    """
    
    # First try your existing Google service
    try:
        from app.services.ai_service import get_gemini_response
        result = get_gemini_response(prompt)
        
        # If Google quota exceeded, try OpenRouter
        if "quota" in result.lower() or "temporarily used" in result.lower():
            print("Google quota exceeded, trying OpenRouter fallback...")
            return get_openrouter_response(prompt)
            
        return result
        
    except ImportError:
        # If ai_service not available, go directly to OpenRouter
        return get_openrouter_response(prompt)
    except Exception as e:
        # If Google service fails, try OpenRouter
        print(f"Google service failed: {e}, trying OpenRouter...")
        return get_openrouter_response(prompt)

# Test function
def test_ai_fallback():
    """Test the fallback AI system"""
    test_prompt = "Say 'AI fallback system is working!' if you can respond."
    
    print("Testing AI fallback system...")
    response = get_ai_response_with_fallback(test_prompt)
    print(f"Response: {response}")
    
    return "working" in response.lower() or "success" in response.lower()

if __name__ == "__main__":
    # Quick test
    success = test_ai_fallback()
    if success:
        print("✅ AI Fallback system is working!")
    else:
        print("❌ AI Fallback system needs attention")
        print("\n💡 Solutions:")
        print("1. Wait for API quotas to reset")
        print("2. Get additional API keys")
        print("3. Check network connectivity")