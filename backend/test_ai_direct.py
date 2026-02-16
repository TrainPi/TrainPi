"""
Simple test to verify AI is working with the new key
"""
from app.services.ai_service import get_gemini_json_response

print("Testing AI service directly...")
print("\nGenerating a simple roadmap...")

try:
    result = get_gemini_json_response(
        """Create a simple learning roadmap for Python. 
        Return JSON with:
        {
          "steps": [
            {"step_number": 1, "title": "...", "description": "...", "estimated_time": "..."}
          ],
          "estimated_timeline": "...",
          "key_skills": ["..."],
          "next_action": "..."
        }
        Keep it to 3 steps only."""
    )
    
    if "error" in result:
        print(f"✗ Error: {result['error']}")
    else:
        print(f"✓ Success!")
        print(f"  Steps: {len(result.get('steps', []))}")
        print(f"  Timeline: {result.get('estimated_timeline')}")
        print(f"\n✓✓✓ AI IS WORKING PERFECTLY! ✓✓✓")
        
except Exception as e:
    print(f"✗ Exception: {e}")
