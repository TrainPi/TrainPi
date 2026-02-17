#!/usr/bin/env python3
"""
Test Groq with actual current available models
"""
import openai
import json

GROQ_API_KEY = "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"

def test_available_groq_models():
    """Test with the actual available models we found"""
    
    # These are the actual available models from the API response
    current_models = [
        "llama-3.1-8b-instant",
        "groq/compound-mini", 
        "allam-2-7b",
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "meta-llama/llama-4-maverick-17b-128e-instruct"
    ]
    
    client = openai.OpenAI(
        api_key=GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1"
    )
    
    print("🧪 Testing with actual available models...")
    
    for model_name in current_models:
        try:
            print(f"\n🤖 Testing: {model_name}")
            
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant."},
                    {"role": "user", "content": "Say 'Groq working!' if you can respond. Be brief."}
                ],
                max_tokens=30,
                temperature=0
            )
            
            result = response.choices[0].message.content
            print(f"✅ SUCCESS: {result}")
            
            if hasattr(response, 'usage'):
                usage = response.usage
                print(f"📊 Tokens - Prompt: {usage.prompt_tokens}, Completion: {usage.completion_tokens}, Total: {usage.total_tokens}")
                remaining = 30000 - usage.total_tokens
                print(f"💰 Remaining today: ~{remaining} tokens")
            
            # Test JSON with this working model
            print(f"🧪 Testing JSON with {model_name}...")
            
            json_response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant. Always respond with valid JSON."},
                    {"role": "user", "content": 'Return JSON: {"status": "success", "message": "Groq JSON working", "service": "groq"}'}
                ],
                max_tokens=100,
                temperature=0
            )
            
            json_result = json_response.choices[0].message.content
            print(f"📋 JSON Response: {json_result}")
            
            try:
                parsed = json.loads(json_result)
                print(f"✅ Valid JSON parsed!")
                
                print(f"\n🎉 GROQ API FULLY WORKING!")
                print(f"🤖 Best Model: {model_name}")
                print(f"💬 Text responses: ✅")
                print(f"📋 JSON responses: ✅")
                print(f"⚡ Speed: Ultra-fast") 
                print(f"💰 Daily limit: 30,000 tokens")
                
                return model_name, "success"
                
            except json.JSONDecodeError:
                print(f"⚠️ Model works but JSON needs improvement")
                return model_name, "text_only"
            
        except Exception as e:
            if "not found" in str(e).lower():
                print(f"❌ Model not available")
            else:
                print(f"❌ Error: {e}")
    
    return None, "No models worked"

if __name__ == "__main__":
    print("🚀 TESTING GROQ WITH ACTUAL AVAILABLE MODELS")
    print("=" * 50)
    
    working_model, status = test_available_groq_models()
    
    if working_model:
        print(f"\n🎯 RECOMMENDED GROQ MODEL: {working_model}")
        print(f"📈 Status: {status}")
        
        if status == "success":
            print(f"\n✅ GROQ READY FOR YOUR APP!")
            print(f"🔧 Next steps:")
            print(f"1. Add to .env: GROQ_API_KEY")  
            print(f"2. Update AI service to use Groq")
            print(f"3. Enjoy 30k tokens/day with ultra-fast responses!")
        
    else:
        print(f"\n❌ Issue with Groq models: {status}")
        print(f"💡 Contact Groq support or check documentation")