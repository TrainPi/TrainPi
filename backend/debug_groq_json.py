#!/usr/bin/env python3
"""
Debug the exact Groq JSON response to see why parsing fails
"""
import sys
import os
import json
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.ai_service import _get_groq_response

def debug_groq_json():
    """Get raw Groq response and debug JSON parsing step by step"""
    
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
            { "name": "Resource Title (Source)", "url": "Actual URL if known (e.g. W3Schools, YouTube, MDN, React.dev) or a search link" }
          ]
        }
      ],
      "estimated_timeline": "Overall time to master",
      "key_skills": ["top 5 skills to gain"],
      "next_action": "First concrete step to take right now"
    }
    
    Generate 7-9 steps. Be extremely specific."""
    
    print("🔵 Getting raw Groq response...")
    
    result, error = _get_groq_response(prompt, is_json=True)
    
    if error:
        print(f"❌ Groq API error: {error}")
        return
    
    if isinstance(result, dict):
        print(f"⚠️ Got dict result (error response): {result}")
        return
        
    print(f"📄 Raw response type: {type(result)}")
    print(f"📏 Raw response length: {len(result)}")
    print("\n" + "="*60)
    print("RAW RESPONSE:")
    print("="*60)
    print(result)
    print("="*60)
    
    # Try manual JSON parsing
    print("\n🧪 Manual JSON parsing attempts:")
    
    # Test 1: Direct parsing
    try:
        parsed = json.loads(result)
        print("✅ Direct parsing SUCCESS!")
        print(f"Keys: {list(parsed.keys())}")
        return parsed
    except json.JSONDecodeError as e:
        print(f"❌ Direct parsing failed: {e}")
        print(f"Error at position: {e.pos}")
        if e.pos < len(result):
            print(f"Error context: ...{result[max(0, e.pos-20):e.pos+20]}...")
    
    # Test 2: Strip and parse
    try:
        parsed = json.loads(result.strip())
        print("✅ Strip and parse SUCCESS!")
        return parsed
    except json.JSONDecodeError as e:
        print(f"❌ Strip and parse failed: {e}")
    
    # Test 3: Character by character analysis
    print(f"\n🔍 Character analysis:")
    print(f"First 10 chars: {repr(result[:10])}")
    print(f"Last 10 chars: {repr(result[-10:])}")
    print(f"Contains newlines: {'\\n' in result}")
    print(f"Contains carriage returns: {'\\r' in result}")
    
    # Test 4: Line by line check
    lines = result.split('\n')
    print(f"Number of lines: {len(lines)}")
    print(f"First line: {repr(lines[0])}")
    print(f"Last line: {repr(lines[-1])}")
    
    return None

if __name__ == "__main__":
    print("🔧 DEBUGGING GROQ JSON RESPONSE")
    print("=" * 50)
    
    result = debug_groq_json()
    
    if result:
        print(f"\n🎉 Successfully parsed JSON!")
        print(f"Steps: {len(result.get('steps', []))}")
    else:
        print(f"\n❌ JSON parsing still failing")