"""
Enhanced AI service with Groq integration (no rate limiting!)
Add this to extend your current ai_service.py
"""
import openai
import os
from dotenv import load_dotenv
import json

load_dotenv()

def get_groq_response(prompt: str, model_name: str = "llama-3.1-70b-versatile") -> str:
    """
    Get response from Groq API - 30k tokens/day free, extremely fast!
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return "Groq API key not configured. Get free key at: https://console.groq.com/keys"
    
    try:
        client = openai.OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1"
        )
        
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant for TrainPI, a learning platform."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.7
        )
        
        return response.choices[0].message.content
        
    except openai.RateLimitError:
        return "Groq daily limit reached (30k tokens). Resets at midnight PST."
    except Exception as e:
        if "authentication" in str(e).lower():
            return "Invalid Groq API key. Get new key at: https://console.groq.com/keys"
        return f"Groq error: {str(e)}"

def get_groq_json_response(prompt: str, model_name: str = "llama-3.1-70b-versatile") -> dict:
    """
    Get JSON response from Groq API
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return {"error": "Groq API key not configured. Get free key at: https://console.groq.com/keys"}
    
    try:
        client = openai.OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1"
        )
        
        json_prompt = prompt + "\n\nIMPORTANT: Return ONLY valid JSON. No markdown formatting."
        
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a helpful assistant. Always respond with valid JSON only - no explanations or markdown formatting."},
                {"role": "user", "content": json_prompt}
            ],
            max_tokens=1500,
            temperature=0.3
        )
        
        result = response.choices[0].message.content
        
        # Clean up response if it has markdown
        if "```json" in result:
            result = result.split("```json")[1].split("```")[0]
        elif "```" in result:
            result = result.split("```")[1]
        
        return json.loads(result.strip())
        
    except json.JSONDecodeError:
        return {"error": f"Invalid JSON response: {result[:200]}..."}
    except openai.RateLimitError:
        return {"error": "Groq daily limit reached (30k tokens). Resets at midnight PST."}
    except Exception as e:
        if "authentication" in str(e).lower():
            return {"error": "Invalid Groq API key. Get new key at: https://console.groq.com/keys"}
        return {"error": f"Groq error: {str(e)}"}

def get_ai_response_ultimate_fallback(prompt: str) -> str:
    """
    Ultimate AI response with multiple fallbacks:
    1. Try Google/Gemini first
    2. Try Groq if Gemini quota exceeded (30k tokens/day free!)
    3. Try OpenRouter if available
    4. Return helpful error message
    """
    
    # First try existing Google service
    try:
        from app.services.ai_service import get_gemini_response
        result = get_gemini_response(prompt)
        
        # If Google quota exceeded, try Groq (best fallback!)
        if "quota" in result.lower() or "temporarily used" in result.lower():
            print("Google quota exceeded, trying Groq (30k tokens/day free)...")
            groq_result = get_groq_response(prompt)
            
            if "Groq API key not configured" not in groq_result:
                return groq_result
            
            # If Groq not set up, try OpenRouter
            print("Groq not configured, trying OpenRouter...")
            from ai_fallback_service import get_openrouter_response
            return get_openrouter_response(prompt)
            
        return result
        
    except ImportError:
        # If Google service not available, go directly to Groq
        print("Google service not available, trying Groq...")
        return get_groq_response(prompt)
    except Exception as e:
        print(f"Google service failed: {e}, trying Groq...")
        return get_groq_response(prompt)

def get_ai_json_ultimate_fallback(prompt: str) -> dict:
    """
    Ultimate JSON AI response with fallbacks
    """
    
    # Try Google first
    try:
        from app.services.ai_service import get_gemini_json_response
        result = get_gemini_json_response(prompt)
        
        if "error" in result and ("quota" in str(result).lower() or "temporarily used" in str(result).lower()):
            print("Google quota exceeded, trying Groq JSON...")
            return get_groq_json_response(prompt)
            
        return result
        
    except ImportError:
        return get_groq_json_response(prompt)
    except Exception as e:
        print(f"Google service failed: {e}, trying Groq JSON...")
        return get_groq_json_response(prompt)

# Test the ultimate fallback system
def test_ultimate_fallback():
    """Test the enhanced fallback system"""
    print("🧪 Testing Ultimate AI Fallback System...")
    
    # Test text response
    print("\n1️⃣ Testing text response...")
    text_result = get_ai_response_ultimate_fallback("Say 'Ultimate AI system working!' if you can respond.")
    print(f"Result: {text_result[:100]}...")
    
    # Test JSON response  
    print("\n2️⃣ Testing JSON response...")
    json_result = get_ai_json_ultimate_fallback('''
    Create a simple response: {"status": "success", "message": "JSON system working", "service": "your_service_name"}
    ''')
    print(f"JSON Result: {json_result}")
    
    # Check if at least one worked
    text_working = "working" in text_result.lower()
    json_working = isinstance(json_result, dict) and "error" not in json_result
    
    if text_working or json_working:
        print("\n✅ Ultimate fallback system is working!")
        return True
    else:
        print("\n❌ Ultimate fallback needs API keys")
        print("💡 Set up Groq for best results: https://console.groq.com/keys")
        return False

if __name__ == "__main__":
    print("🚀 TESTING ULTIMATE AI FALLBACK SYSTEM")
    print("=" * 50)
    print("This system tries:")
    print("1. 🔵 Google/Gemini (if quota available)")
    print("2. 🟢 Groq API (30k tokens/day FREE)")
    print("3. 🟠 OpenRouter (if configured)")
    print("=" * 50)
    
    test_ultimate_fallback()
    
    print(f"\n💡 TO ELIMINATE RATE LIMITING:")
    print(f"🎯 Get Groq API key: https://console.groq.com/keys")
    print(f"📝 Add to .env: GROQ_API_KEY='your_key_here'")
    print(f"🚀 Enjoy 30,000 tokens/day FREE with ultra-fast inference!")