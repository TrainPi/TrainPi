
import os
import json
import openai
from dotenv import load_dotenv

# Load env variables
load_dotenv(".env")

api_key = os.getenv("OPENAI_API_KEY")
base_url = os.getenv("OPENAI_BASE_URL", "https://openrouter.ai/api/v1")

client = openai.OpenAI(
    api_key=api_key,
    base_url=base_url
)

def test_roadmap_generation():
    career_path = "Full Stack Developer"
    print(f"Testing Roadmap Generation for: {career_path}")

    prompt = f"""Create a comprehensive, expert-level learning roadmap for a career in {career_path}, strictly modeling the depth and structure of 'roadmap.sh'.
    User Context: Skills: JavaScript, React. Interests: Web Development.
    
    Return a strictly valid JSON object with a single 'steps' key containing a list of steps. 
    Each step must be actionable and project-based.
    
    Structure each step with:
    - 'step_number' (int)
    - 'title' (str): Professional milestone title.
    - 'description' (str): detailed explanation and mini-project.
    - 'skills' (list of str): 4-6 specific technologies.
    - 'certifications' (list of str): Relevant certs.
    - 'estimated_time' (str): Realistic timeframe.
    - 'resources' (list of dicts): 3-4 specific resources.
    
    Generate 8-10 detailed steps. Ensure valid JSON."""

    try:
        print("Sending request to OpenAI (gpt-3.5-turbo)...")
        response = client.chat.completions.create(
            model="openai/gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a senior technical career advisor. Output strictly valid JSON."},
                {"role": "user", "content": prompt}
            ],
            extra_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "TrainPi Debug"
            },
            temperature=0.7,
            max_tokens=4000
        )
        
        content = response.choices[0].message.content
        print("\n--- Raw Response Content ---")
        print(content[:500] + "..." if len(content) > 500 else content)
        print("----------------------------\n")

        # Parsing logic from router
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1]
            
        data = json.loads(content)
        print("Successfully parsed JSON!")
        print(f"Number of steps: {len(data.get('steps', []))}")
        return True

    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

test_roadmap_generation()
