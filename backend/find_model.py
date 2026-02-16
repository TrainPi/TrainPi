import os
import httpx
from dotenv import load_dotenv

load_dotenv()

def find_best_model():
    key = os.getenv("GOOGLE_API_KEY")
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
    r = httpx.get(url)
    models = r.json().get('models', [])
    
    # Priority list
    priority = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-pro"]
    
    available = [m['name'].replace('models/', '') for m in models]
    print(f"Available models: {available}")
    
    for p in priority:
        if p in available:
            print(f"RECOMMENDED_MODEL: {p}")
            return
    
    if available:
        print(f"RECOMMENDED_MODEL: {available[0]}")

find_best_model()
