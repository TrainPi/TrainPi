#!/usr/bin/env python3
"""
Test Groq API key with current models
"""
import openai
import json

GROQ_API_KEY = "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"

def list_groq_models():
    """List available Groq models"""
    try:
        client = openai.OpenAI(
            api_key=GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1"
        )
        
        print("📋 Available Groq Models:")
        models = client.models.list()
        
        available_models = []
        for model in models.data[:10]:  # Show first 10
            print(f"   🤖 {model.id}")
            available_models.append(model.id)
        
        return available_models
        
    except Exception as e:
        print(f"❌ Could not list models: {e}")
        return []

def test_groq_with_current_models():
    """Test with currently available models"""
    
    # Common current Groq models (as of 2026)
    test_models = [
        "llama-3.2-90b-text-preview",
        "llama-3.2-11b-text-preview", 
        "llama-3.2-3b-preview",
        "llama-3.2-1b-preview",
        "mixtral-8x7b-32768",
        "llama3-70b-8192",
        "llama3-8b-8192",
        "gemma-7b-it"
    ]
    
    client = openai.OpenAI(
        api_key=GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1"
    )
    
    print("\n🧪 Testing current models...")
    
    for model_name in test_models:
        try:
            print(f"\n🤖 Testing: {model_name}")
            
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": "Say 'Working!' if you can respond. Be brief."}
                ],
                max_tokens=20,
                temperature=0
            )
            
            result = response.choices[0].message.content
            print(f"✅ SUCCESS: {result}")
            
            if hasattr(response, 'usage'):
                print(f"📊 Tokens: {response.usage.total_tokens}")
            
            # Return the first working model
            return model_name, result
            
        except Exception as e:
            if "decommissioned" in str(e):
                print(f"❌ Model decommissioned")
            elif "not found" in str(e):
                print(f"❌ Model not found")
            else:
                print(f"❌ Error: {e}")
    
    return None, "No working models found"

def test_json_capability(working_model):
    """Test JSON responses with working model"""
    
    client = openai.OpenAI(
        api_key=GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1"
    )
    
    print(f"\n🧪 Testing JSON capability with {working_model}...")
    
    try:
        response = client.chat.completions.create(
            model=working_model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant. Always respond with valid JSON only."},
                {"role": "user", "content": 'Return this JSON: {"status": "success", "message": "Groq JSON working", "model": "' + working_model + '"}'}
            ],
            max_tokens=100,
            temperature=0
        )
        
        result = response.choices[0].message.content
        print(f"✅ JSON Response: {result}")
        
        # Try to parse as JSON
        try:
            json_data = json.loads(result)
            print(f"✅ Valid JSON parsed successfully")
            return True, json_data
        except json.JSONDecodeError:
            print(f"⚠️ Response received but not valid JSON")
            return False, result
            
    except Exception as e:
        print(f"❌ JSON test failed: {e}")
        return False, str(e)

if __name__ == "__main__":
    print("🚀 TESTING GROQ API WITH CURRENT MODELS")
    print("=" * 45)
    
    # List available models
    available = list_groq_models()
    
    # Test with current models
    working_model, message = test_groq_with_current_models()
    
    if working_model:
        print(f"\n🎉 FOUND WORKING MODEL: {working_model}")
        
        # Test JSON capability
        json_success, json_result = test_json_capability(working_model)
        
        if json_success:
            print(f"\n✅ GROQ IS FULLY OPERATIONAL!")
            print(f"🤖 Working Model: {working_model}")
            print(f"📝 JSON Support: ✅")
            print(f"💰 Daily Limit: 30,000 tokens")
            print(f"⚡ Speed: Ultra-fast")
            
        print(f"\n🔧 READY TO ADD TO YOUR APP!")
        
    else:
        print(f"\n💥 No current models working: {message}")
        print("💡 Check Groq documentation for current model names")