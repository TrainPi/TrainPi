#!/usr/bin/env python3
"""
Test improved Groq JSON handling
"""
from app.services.ai_service import get_gemini_json_response

print("🧪 Testing Improved Groq JSON Handling")
print("=" * 40)

# Test career goals guidance (the failing endpoint)
print("1️⃣ Testing career goals guidance...")
career_result = get_gemini_json_response("""
Create career goals guidance for someone wanting to become a software developer:
{
  "career_path": "Software Developer",
  "goals": [
    {"goal": "Learn programming fundamentals", "timeline": "3 months", "priority": "high"},
    {"goal": "Build portfolio projects", "timeline": "6 months", "priority": "high"}
  ],
  "recommended_skills": ["Python", "JavaScript", "Git"],
  "next_steps": ["Start with online tutorials", "Practice coding daily"],
  "resources": ["FreeCodeCamp", "GitHub"],
  "estimated_timeline": "6-12 months"
}
""")

print(f"✅ Career Result: {career_result}")
print(f"Type: {type(career_result)}")

# Test roadmap generation  
print("\n2️⃣ Testing roadmap generation...")
roadmap_result = get_gemini_json_response("""
Create a learning roadmap for Python:
{
  "title": "Python Learning Path",
  "steps": [
    {"step": 1, "topic": "Variables and Data Types", "duration": "1 week"},
    {"step": 2, "topic": "Control Structures", "duration": "1 week"}
  ],
  "total_duration": "2 weeks",
  "difficulty": "beginner"
}
""")

print(f"✅ Roadmap Result: {roadmap_result}")

# Check if both are valid
career_valid = isinstance(career_result, dict) and "error" not in career_result
roadmap_valid = isinstance(roadmap_result, dict) and "error" not in roadmap_result

print(f"\n📊 Results:")
print(f"   Career Guidance JSON: {'✅ Valid' if career_valid else '❌ Invalid'}")
print(f"   Roadmap JSON: {'✅ Valid' if roadmap_valid else '❌ Invalid'}")

if career_valid and roadmap_valid:
    print(f"\n🎉 JSON HANDLING FIXED!")
    print(f"✅ Ready for API endpoints")
else:
    print(f"\n⚠️ Some JSON issues remain")
    if not career_valid:
        print(f"   Career issue: {career_result}")
    if not roadmap_valid:
        print(f"   Roadmap issue: {roadmap_result}")