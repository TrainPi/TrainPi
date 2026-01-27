
import google.generativeai as genai
import os
from dotenv import load_dotenv
import json

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

def get_gemini_response(prompt: str, image_url: str = None, model_name: str = "gemini-1.5-flash") -> str:
    """
    Get a response from Google's Gemini model.
    """
    if not GOOGLE_API_KEY:
         return "Error: GOOGLE_API_KEY not found in environment variables."

    try:
        model = genai.GenerativeModel(model_name)
        
        if image_url:
            # Note: For real URL processing, we might need to fetch the image data 
            # or pass the URL if the library supports it (it usually expects PIL Image or raw data).
            # For now, we'll just treat it as text-based context if not implementing full vision download logic here.
            # In a real app, you'd download requests.get(image_url).content
            pass

        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini Error: {e}")
        return f"Error generating response: {str(e)}"

def get_gemini_json_response(prompt: str, model_name: str = "gemini-1.5-flash") -> dict:
    """
    Get a JSON response from Google's Gemini model.
    """
    if not GOOGLE_API_KEY:
         return {"error": "GOOGLE_API_KEY not found"}

    try:
        model = genai.GenerativeModel(model_name)
        # Enforce JSON in prompt
        json_prompt = prompt + "\n\nIMPORTANT: Return ONLY valid JSON. No markdown formatting."
        
        response = model.generate_content(json_prompt)
        text = response.text
        
        # Clean up markdown if present
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1]
            
        return json.loads(text)
    except Exception as e:
        print(f"Gemini JSON Error: {e}")
        return {}
