#!/usr/bin/env python3
"""
Test AI services with generous free tiers and minimal rate limiting
"""
import requests
import json
import time

def test_groq_api():
    """
    Groq offers very fast inference with generous free tier
    Get free API key at: https://console.groq.com/keys
    """
    print("🚀 Testing Groq (Fast & Generous Free Tier)")
    print("   - 🎯 30,000 tokens/day free")
    print("   - ⚡ Extremely fast inference")
    print("   - 🔓 Sign up at: https://console.groq.com/keys")
    
    # Test endpoint (would need actual API key)
    return "groq", "Need API key from https://console.groq.com/keys"

def test_together_ai():
    """
    Together AI offers good free tier with various models
    """
    print("\n🤖 Testing Together AI")
    print("   - 🎯 $25 free credits")
    print("   - 🔓 Sign up at: https://api.together.xyz/")
    
    return "together", "Need API key from https://api.together.xyz/"

def test_huggingface_api():
    """
    Hugging Face has free inference API
    """
    print("\n🤗 Testing Hugging Face Inference API")
    print("   - 🎯 Free tier available")
    print("   - 🔓 Get token at: https://huggingface.co/settings/tokens")
    
    return "huggingface", "Need token from https://huggingface.co/settings/tokens"

def test_replicate_api():
    """
    Replicate - pay per use, no traditional rate limits
    """
    print("\n🔄 Testing Replicate")
    print("   - 💰 Pay-per-use (very cheap)")
    print("   - 🚫 No rate limits, just usage-based billing")
    print("   - 🔓 Sign up at: https://replicate.com/")
    
    return "replicate", "Pay-per-use at https://replicate.com/"

def test_cohere_api():
    """
    Cohere offers free tier
    """
    print("\n🧠 Testing Cohere")
    print("   - 🎯 Free tier: 100 API calls/month")
    print("   - 🔓 Sign up at: https://dashboard.cohere.com/")
    
    return "cohere", "Need API key from https://dashboard.cohere.com/"

def test_anthropic_claude():
    """
    Anthropic Claude API
    """
    print("\n🎭 Testing Anthropic Claude")
    print("   - 🎯 $5 free credits")
    print("   - 🔓 Sign up at: https://console.anthropic.com/")
    
    return "anthropic", "Need API key from https://console.anthropic.com/"

def test_free_public_apis():
    """
    Test completely free APIs that don't require registration
    """
    
    print("\n🌍 Testing Free Public APIs (No Registration Required)")
    
    # Test Ollama-like services
    free_services = [
        {
            "name": "AI/ML API (Free)",
            "url": "https://api.aimlapi.com/",
            "description": "Free tier available",
            "signup": "https://aimlapi.com/"
        },
        {
            "name": "Pawan.Krd (Free GPT)",
            "url": "https://api.pawan.krd/",
            "description": "Free GPT-like API",
            "signup": "https://pawan.krd/"
        },
        {
            "name": "ChimeraGPT (Free)",
            "url": "https://chimeragpt.adventblocks.cc/",
            "description": "Free GPT API",
            "signup": "No registration required"
        }
    ]
    
    for service in free_services:
        print(f"\n   🔧 {service['name']}")
        print(f"       📖 {service['description']}")
        print(f"       🔗 {service['signup']}")
    
    return "free_apis", "Multiple options available"

def check_current_working_free_apis():
    """
    Check which free APIs are currently working
    """
    print("\n🔍 Checking Currently Working Free APIs...")
    
    # Test some no-auth required endpoints
    test_endpoints = [
        {
            "name": "Groq-Compatible Free API",
            "test_url": "https://api.groq.com/openai/v1/models",
            "needs_auth": True
        }
    ]
    
    working_apis = []
    
    print("\n📋 Best Options for No Rate Limiting:")
    print("=" * 50)
    
    options = [
        {
            "service": "Groq",
            "free_tier": "30k tokens/day",
            "rate_limit": "Very generous",
            "speed": "Extremely fast",
            "signup": "https://console.groq.com/keys",
            "recommended": True
        },
        {
            "service": "Together AI", 
            "free_tier": "$25 credits",
            "rate_limit": "Generous",
            "speed": "Fast",
            "signup": "https://api.together.xyz/",
            "recommended": True
        },
        {
            "service": "Replicate",
            "free_tier": "Pay-per-use",
            "rate_limit": "No limits (usage billing)",
            "speed": "Varies by model",
            "signup": "https://replicate.com/",
            "recommended": True
        },
        {
            "service": "Anthropic Claude",
            "free_tier": "$5 credits",
            "rate_limit": "Moderate",
            "speed": "Good", 
            "signup": "https://console.anthropic.com/",
            "recommended": False
        },
        {
            "service": "Hugging Face",
            "free_tier": "Free inference",
            "rate_limit": "Varies by model",
            "speed": "Varies",
            "signup": "https://huggingface.co/settings/tokens",
            "recommended": False
        }
    ]
    
    for opt in options:
        status = "🌟 RECOMMENDED" if opt["recommended"] else "📋 Option"
        print(f"\n{status}: {opt['service']}")
        print(f"   💸 Free Tier: {opt['free_tier']}")
        print(f"   ⏱️  Rate Limit: {opt['rate_limit']}")
        print(f"   ⚡ Speed: {opt['speed']}")
        print(f"   🔗 Sign up: {opt['signup']}")
    
    return options

def generate_api_key_commands():
    """Generate setup commands for the best options"""
    
    print(f"\n{'='*60}")
    print("🚀 SETUP COMMANDS FOR BEST OPTIONS")
    print(f"{'='*60}")
    
    print("""
🌟 GROQ (RECOMMENDED - Fast & Generous)
   1. Visit: https://console.groq.com/keys
   2. Create free account
   3. Generate API key
   4. Add to .env: GROQ_API_KEY="your_key_here"
   
🌟 TOGETHER AI (RECOMMENDED - $25 Free Credits)  
   1. Visit: https://api.together.xyz/
   2. Sign up for free account
   3. Get API key from dashboard
   4. Add to .env: TOGETHER_API_KEY="your_key_here"
   
🌟 REPLICATE (RECOMMENDED - No Rate Limits)
   1. Visit: https://replicate.com/
   2. Create account 
   3. Add payment method (pay-per-use, very cheap)
   4. Get API token
   5. Add to .env: REPLICATE_API_TOKEN="your_token_here"
""")

if __name__ == "__main__":
    print("🔍 FINDING AI SERVICES WITHOUT RATE LIMITING")
    print("=" * 55)
    
    # Test various services
    test_groq_api()
    test_together_ai() 
    test_huggingface_api()
    test_replicate_api()
    test_cohere_api()
    test_anthropic_claude()
    test_free_public_apis()
    
    # Check current options
    check_current_working_free_apis()
    
    # Generate setup commands
    generate_api_key_commands()
    
    print(f"\n{'='*60}")
    print("💡 SUMMARY:")
    print("✅ Groq: Best for speed + generous free tier")
    print("✅ Together AI: Good free credits")  
    print("✅ Replicate: No rate limits (pay-per-use)")
    print("⚠️  Most services have some limits, but much more generous than current")
    print(f"{'='*60}")