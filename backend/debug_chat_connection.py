
import os
import openai
from dotenv import load_dotenv

# Load env variables
load_dotenv(".env")

api_key = os.getenv("OPENAI_API_KEY")
base_url = os.getenv("OPENAI_BASE_URL", "https://openrouter.ai/api/v1")

print(f"API Key present: {bool(api_key)}")
print(f"Base URL: {base_url}")

client = openai.OpenAI(
    api_key=api_key,
    base_url=base_url
)

def test_chat(model):
    print(f"\nTesting model: {model}...")
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "user", "content": "Hello, are you working?"}
            ],
            extra_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "TrainPi Debug"
            }
        )
        print("Success!")
        print(f"Response: {response.choices[0].message.content}")
        return True
    except Exception as e:
        print(f"FAILED: {e}")
        return False

# Test both models used in the code
test_chat("openai/gpt-3.5-turbo")
test_chat("openai/gpt-4o")
