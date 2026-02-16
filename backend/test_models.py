import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=api_key)

print("Available models:")
for model in genai.list_models():
    if 'generateContent' in model.supported_generation_methods:
        print(f"  - {model.name}")

print("\nTesting gemini-2.0-flash-exp...")
try:
    model = genai.GenerativeModel("gemini-2.0-flash-exp")
    response = model.generate_content("Say 'Hello, I am working!'")
    print(f"✓ Success: {response.text}")
except Exception as e:
    print(f"✗ Error: {e}")
