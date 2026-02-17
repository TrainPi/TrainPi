#!/usr/bin/env python3
"""
Direct Groq API call to see raw response without processing
"""
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

def test_raw_groq_response():
    """Make direct Groq API call to see unprocessed response"""
    
    # Get API key
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("❌ No GROQ_API_KEY found in .env")
        return
    
    print(f"🔑 Using Groq API key: {api_key[:20]}...")
    
    # Initialize client
    client = OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=api_key
    )
    
    prompt = """The user's learning goal: "become a software developer"
    
    Create a highly detailed, professional learning roadmap (like a full course) for this goal.
    The roadmap must follow a logical progression: Fundamentals -> Intermediate -> Advanced -> Job Readiness/Expertise.
    
    Return a strictly valid JSON object:
    {
      "steps": [
        { 
          "step_number": 1, 
          "title": "Clear Step Title", 
          "description": "3-4 sentences explaining what to learn and why.", 
          "skills": ["skill1", "skill2"],
          "estimated_time": "e.g. 2 weeks",
          "resources": [
            { "name": "Resource Title (Source)", "url": "Actual URL if known" }
          ]
        }
      ],
      "estimated_timeline": "Overall time to master",
      "key_skills": ["top 5 skills to gain"],
      "next_action": "First concrete step to take right now"
    }
    
    Generate 7-9 steps. Be extremely specific.
    
    IMPORTANT: Return ONLY valid JSON. No markdown formatting."""
    
    try:
        print("🚀 Making direct Groq API call...")
        
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",  # Use the current supported model
            messages=[
                {"role": "system", "content": "You are a helpful assistant that returns only valid JSON responses."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=8000,
            temperature=0.1
        )
        
        raw_content = response.choices[0].message.content
        
        print(f"✅ Got response!")
        print(f"📏 Response length: {len(raw_content)}")
        print(f"🔤 Response type: {type(raw_content)}")
        
        print("\n" + "="*80)
        print("RAW GROQ RESPONSE:")
        print("="*80)
        print(raw_content)
        print("="*80)
        
        # Character analysis
        print(f"\n🔍 ANALYSIS:")
        print(f"First 20 chars: {repr(raw_content[:20])}")
        print(f"Last 20 chars: {repr(raw_content[-20:])}")
        print(f"Contains \\n: {raw_content.count(chr(10))}")
        print(f"Contains \\r: {raw_content.count(chr(13))}")
        print(f"Starts with {{: {raw_content.strip().startswith('{')}")
        print(f"Ends with }}: {raw_content.strip().endswith('}')}")
        
        # Try parsing
        print(f"\n🧪 JSON PARSING TEST:")
        try:
            parsed = json.loads(raw_content)
            print("✅ JSON parsing SUCCESS!")
            print(f"Keys: {list(parsed.keys())}")
            print(f"Steps count: {len(parsed.get('steps', []))}")
            return True
        except json.JSONDecodeError as e:
            print(f"❌ JSON parsing failed: {e}")
            print(f"Error position: {e.pos}")
            if e.pos < len(raw_content):
                start = max(0, e.pos - 50)
                end = min(len(raw_content), e.pos + 50)
                print(f"Context around error:")
                print(f"'{raw_content[start:end]}'")
            
            # Try with stripped content
            try:
                parsed = json.loads(raw_content.strip())
                print("✅ JSON parsing SUCCESS after strip!")
                return True
            except json.JSONDecodeError as e2:
                print(f"❌ Even stripped parsing failed: {e2}")
            
            return False
        
    except Exception as e:
        print(f"❌ Groq API error: {e}")
        return False

if __name__ == "__main__":
    print("🔧 DIRECT GROQ API TEST")
    print("=" * 50)
    
    success = test_raw_groq_response()
    
    if success:
        print(f"\n🎉 GROQ JSON IS VALID!")
        print("The issue is in our parsing logic, not Groq's response")
    else:
        print(f"\n❌ GROQ JSON IS INVALID!")
        print("Need to fix the prompt or handle malformed JSON")