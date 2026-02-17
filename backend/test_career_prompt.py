#!/usr/bin/env python3
"""
Test the exact prompt that's failing in career goals guidance
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.ai_service import get_gemini_json_response

def test_career_goals_prompt():
    """Test the exact prompt from career-goals-guidance endpoint"""
    
    goal = "become a software developer"
    
    prompt = f"""The user's learning goal: "{goal}"
    
    Create a highly detailed, professional learning roadmap (like a full course) for this goal.
    The roadmap must follow a logical progression: Fundamentals -> Intermediate -> Advanced -> Job Readiness/Expertise.
    
    Return a strictly valid JSON object:
    {{
      "steps": [
        {{ 
          "step_number": 1, 
          "title": "Clear Step Title", 
          "description": "3-4 sentences explaining what to learn and why.", 
          "skills": ["skill1", "skill2"],
          "estimated_time": "e.g. 2 weeks",
          "resources": [
            {{ "name": "Resource Title (Source)", "url": "Actual URL if known (e.g. W3Schools, YouTube, MDN, React.dev) or a search link" }}
          ]
        }}
      ],
      "estimated_timeline": "Overall time to master",
      "key_skills": ["top 5 skills to gain"],
      "next_action": "First concrete step to take right now"
    }}
    
    Generate 7-9 steps. Be extremely specific."""
    
    print("🧪 Testing career goals guidance prompt...")
    print(f"Goal: {goal}")
    
    try:
        result = get_gemini_json_response(prompt)
        
        print(f"\n✅ Result type: {type(result)}")
        print(f"✅ Result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        
        if isinstance(result, dict):
            if "error" in result:
                print(f"❌ Error in result: {result['error']}")
                return False
            else:
                print(f"✅ Steps count: {len(result.get('steps', []))}")
                print(f"✅ Timeline: {result.get('estimated_timeline', 'N/A')}")
                print(f"✅ Key skills: {len(result.get('key_skills', []))}")
                print(f"✅ Next action: {result.get('next_action', 'N/A')[:50]}...")
                return True
        else:
            print(f"❌ Result is not a dict: {result}")
            return False
            
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        return False

if __name__ == "__main__":
    print("🔧 TESTING CAREER GOALS GUIDANCE PROMPT")
    print("=" * 50)
    
    success = test_career_goals_prompt()
    
    if success:
        print("\n🎉 CAREER GOALS PROMPT WORKING!")
        print("✅ The AI service can generate valid JSON for career guidance")
    else:
        print("\n❌ CAREER GOALS PROMPT FAILED!")
        print("❌ Need to debug the JSON response processing")