#!/usr/bin/env python3
"""
Test Groq API - Known for extremely fast inference with generous free tier
Get your free API key at: https://console.groq.com/keys
"""
import openai
import os

def test_groq_api(api_key):
    """
    Test Groq API with various models
    Groq offers 30,000 tokens/day free with very fast inference
    """
    
    if not api_key:
        print("❌ No Groq API key provided")
        print("🔗 Get free key at: https://console.groq.com/keys")
        return False, "No API key"
        
    try:
        # Groq uses OpenAI-compatible API
        client = openai.OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1"
        )
        
        print("🚀 Testing Groq API...")
        print(f"🔑 Key: {api_key[:20]}...")
        
        # List available models
        print("\n📋 Available Groq Models:")
        try:
            models = client.models.list()
            for model in models.data[:5]:  # Show first 5 models
                print(f"   🤖 {model.id}")
        except Exception as e:
            print(f"   ❌ Could not list models: {e}")
        
        # Test with Llama model (very fast on Groq)
        model_name = "llama-3.1-70b-versatile"  # Popular Groq model
        
        print(f"\n🧪 Testing {model_name}...")
        
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a helpful assistant. Be concise."},
                {"role": "user", "content": "Say 'Groq API is working perfectly!' if you can respond."}
            ],
            max_tokens=50,
            temperature=0
        )
        
        result = response.choices[0].message.content
        print(f"✅ SUCCESS: {result}")
        
        # Show usage stats
        if hasattr(response, 'usage'):
            usage = response.usage
            print(f"📊 Tokens - Prompt: {usage.prompt_tokens}, Completion: {usage.completion_tokens}, Total: {usage.total_tokens}")
            print(f"💰 Daily limit: 30,000 tokens (you used {usage.total_tokens})")
        
        return True, result
        
    except openai.AuthenticationError:
        print("❌ AUTHENTICATION ERROR: Invalid Groq API key")
        print("🔗 Get new key at: https://console.groq.com/keys")
        return False, "Invalid API key"
    except openai.RateLimitError:
        print("❌ RATE LIMIT: Daily 30k token limit reached")
        print("⏰ Resets at midnight PST")
        return False, "Rate limit"
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False, str(e)

def setup_groq_in_env(api_key):
    """
    Add Groq API key to your .env file
    """
    env_path = "../.env"
    
    print(f"\n🔧 Adding Groq API key to .env...")
    
    try:
        # Read current .env
        with open(env_path, 'r') as f:
            lines = f.readlines()
        
        # Add Groq key
        groq_line = f'GROQ_API_KEY="{api_key}"\n'
        
        # Check if GROQ_API_KEY already exists
        found = False
        for i, line in enumerate(lines):
            if line.startswith('GROQ_API_KEY='):
                lines[i] = groq_line
                found = True
                break
        
        if not found:
            lines.append(groq_line)
        
        # Write back to .env
        with open(env_path, 'w') as f:
            f.writelines(lines)
            
        print("✅ Groq API key added to .env file")
        return True
        
    except Exception as e:
        print(f"❌ Could not update .env: {e}")
        print("💡 Manually add this line to your .env file:")
        print(f'GROQ_API_KEY="{api_key}"')
        return False

if __name__ == "__main__":
    print("🚀 GROQ API TESTER")
    print("=" * 40)
    print("Groq offers:")
    print("✅ 30,000 tokens/day FREE")
    print("✅ Extremely fast inference")
    print("✅ Multiple models (Llama, Mixtral, etc.)")
    print("✅ OpenAI-compatible API")
    print("=" * 40)
    
    # You would replace this with your actual Groq API key
    test_key = input("🔑 Enter your Groq API key (or press Enter to skip): ").strip()
    
    if test_key:
        success, message = test_groq_api(test_key)
        
        if success:
            print(f"\n🎉 GROQ API WORKING PERFECTLY! 🎉")
            
            # Offer to add to .env
            add_to_env = input("\n💾 Add this key to your .env file? (y/n): ").lower().strip()
            if add_to_env == 'y':
                setup_groq_in_env(test_key)
            
            print(f"\n🔧 Integration Steps:")
            print(f"1. ✅ API key is working")
            print(f"2. 📝 Add Groq support to your AI service")
            print(f"3. 🚀 Use as primary or fallback AI provider")
            
        else:
            print(f"\n💥 Groq test failed: {message}")
    else:
        print("\n💡 To test Groq:")
        print("1. Visit: https://console.groq.com/keys")
        print("2. Create free account (30k tokens/day)")
        print("3. Get API key")
        print("4. Run this script again with your key")
        
        print(f"\n📋 Alternative Fast Options:")
        print(f"🔥 Groq: 30k tokens/day, extremely fast")
        print(f"💰 Together AI: $25 free credits")
        print(f"♾️  Replicate: Pay-per-use, no rate limits")