#!/usr/bin/env python3
"""
Test and validate the quality of AI-generated courses with scoring
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.ai_service import get_gemini_json_response
from app.services.course_validator import CourseValidator

def test_course_quality(goal: str):
    """Test course generation for a specific goal"""
    
    prompt = f"""The user's learning goal: "{goal}"

Create a comprehensive, actionable learning roadmap for this goal that learners can follow step-by-step.

CRITICAL REQUIREMENTS:
1. Progress logically: Fundamentals → Intermediate → Advanced → Job Readiness
2. Each step should build on previous knowledge
3. Include realistic time estimates 
4. Provide ONLY high-quality, verified resources
5. Make descriptions practical and motivating
6. Include 2-3 resources per step minimum
7. Ensure skills progress from basic to expert level

Return ONLY this valid JSON:
{{
  "steps": [
    {{
      "step_number": 1,
      "title": "Step Title",
      "description": "3-4 sentences: What you'll learn, why it matters",
      "skills": ["skill 1", "skill 2", "skill 3"],
      "estimated_time": "Time with note",
      "resources": [
        {{"name": "Resource Title - Creator", "url": "REAL URL"}},
        {{"name": "Resource 2", "url": "REAL URL"}},
        {{"name": "Practice Project", "url": "URL"}}
      ]
    }}
  ],
  "estimated_timeline": "Total time",
  "key_skills": ["Top 5-7 skills"],
  "next_action": "First specific step",
  "prerequisites": ["Needed knowledge"],
  "common_challenges": ["Common pitfalls"],
  "project_ideas": ["Real projects"],
  "job_titles": ["Relevant jobs"]
}}

Generate 7-9 detailed steps."""
    
    print(f"\n📚 {goal}")
    print("=" * 70)
    
    try:
        result = get_gemini_json_response(prompt)
        
        if isinstance(result, dict) and "error" in result:
            print(f"❌ Error: {result['error']}")
            return False, 0
        
        # Validate and score
        is_valid, issues = CourseValidator.validate_course(result)
        quality_score, suggestions = CourseValidator.get_quality_score(result)
        
        print(f"✅ Quality Score: {quality_score}/100")
        print(f"✅ Valid: {is_valid}")
        print(f"✅ Steps: {len(result.get('steps', []))}")
        print(f"✅ Resources: {sum(len(s.get('resources', [])) for s in result.get('steps', []))}")
        
        if issues:
            print(f"📋 Issues: {len(issues)}")
            for issue in issues[:3]:
                print(f"  {issue}")
        
        if suggestions:
            print(f"💡 Tips: {', '.join(suggestions[:2])}")
        
        return quality_score >= 75, quality_score
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False, 0

def main():
    print("🎓 AI COURSE QUALITY TEST")
    print("=" * 70)
    
    goals = [
        "become a software developer",
        "master full-stack web development",
        "learn machine learning"
    ]
    
    results = {}
    for goal in goals:
        passed, score = test_course_quality(goal)
        results[goal] = (passed, score)
    
    print(f"\n{'='*70}")
    print("📊 RESULTS:")
    print("=" * 70)
    
    for goal, (passed, score) in results.items():
        status = "✅" if passed else "⚠️"
        print(f"{status} {score}/100 - {goal}")
    
    avg = sum(s for _, s in results.values()) / len(results)
    print(f"\n🎯 Average Quality: {avg:.0f}/100")
    
    if avg >= 75:
        print("\n🎉 COURSES ARE HIGH QUALITY!")
        return True
    return False

if __name__ == "__main__":
    import time
    start = time.time()
    success = main()
    elapsed = time.time() - start
    print(f"⏱️ Time: {elapsed:.1f}s")
    sys.exit(0 if success else 1)