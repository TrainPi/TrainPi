#!/usr/bin/env python3
"""
Test and validate the quality of AI-generated courses
"""
import sys
import os
import json
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.ai_service import get_gemini_json_response

def test_course_quality(goal: str):
    """Test course generation for a specific goal"""
    
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
    
    Generate 7-9 steps. Be extremely specific and practical."""
    
    print(f"\n📚 Testing course generation for: {goal}")
    print("=" * 70)
    
    try:
        result = get_gemini_json_response(prompt)
        
        if isinstance(result, dict) and "error" in result:
            print(f"❌ Error: {result['error']}")
            return False
        
        # Quality checks
        checks = {
            "Has steps": len(result.get('steps', [])) >= 7,
            "Has timeline": bool(result.get('estimated_timeline')),
            "Has key_skills": len(result.get('key_skills', [])) >= 3,
            "Has next_action": bool(result.get('next_action')),
            "Steps have titles": all(s.get('title') for s in result.get('steps', [])),
            "Steps have descriptions": all(len(s.get('description', '')) > 20 for s in result.get('steps', [])),
            "Steps have skills": all(len(s.get('skills', [])) > 0 for s in result.get('steps', [])),
            "Steps have resources": all(len(s.get('resources', [])) > 0 for s in result.get('steps', [])),
        }
        
        print("\n✅ QUALITY CHECKS:")
        for check, passed in checks.items():
            status = "✅" if passed else "❌"
            print(f"  {status} {check}")
        
        all_passed = all(checks.values())
        
        if all_passed:
            print(f"\n📊 COURSE STATISTICS:")
            print(f"  Steps: {len(result['steps'])}")
            print(f"  Timeline: {result['estimated_timeline']}")
            print(f"  Key Skills: {len(result['key_skills'])}")
            print(f"  Total resources: {sum(len(s.get('resources', [])) for s in result['steps'])}")
            
            print(f"\n📖 COURSE PREVIEW:")
            for i, step in enumerate(result['steps'][:3], 1):
                print(f"\n  Step {i}: {step['title']}")
                print(f"  ⏱️ Time: {step.get('estimated_time', 'N/A')}")
                print(f"  📚 Resources: {len(step.get('resources', []))} items")
                print(f"  🎯 Skills: {', '.join(step.get('skills', [])[:2])}...")
            
            print(f"\n🎯 NEXT ACTION:")
            print(f"  {result['next_action']}")
            
            return True
        else:
            print("\n❌ Some quality checks failed!")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def main():
    """Test multiple course goals"""
    print("🧪 COURSE QUALITY TESTING")
    print("=" * 70)
    
    test_goals = [
        "become a software developer",
        "learn web development with React",
        "master machine learning and AI",
        "become a full-stack developer",
        "learn cloud computing with AWS"
    ]
    
    results = {}
    for goal in test_goals:
        results[goal] = test_course_quality(goal)
    
    print(f"\n\n{'='*70}")
    print("📊 OVERALL RESULTS:")
    print("=" * 70)
    
    for goal, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {goal}")
    
    success_rate = sum(results.values()) / len(results) * 100
    print(f"\n🎯 Success Rate: {success_rate:.0f}%")
    
    if success_rate == 100:
        print("\n🎉 ALL COURSES ARE HIGH QUALITY!")
        return True
    else:
        print(f"\n⚠️ Some courses need improvement")
        return False

if __name__ == "__main__":
    import time
    
    start = time.time()
    success = main()
    elapsed = time.time() - start
    
    print(f"\n⏱️ Total time: {elapsed:.1f}s")
    
    sys.exit(0 if success else 1)