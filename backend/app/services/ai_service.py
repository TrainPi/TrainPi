import google.generativeai as genai
import os
from dotenv import load_dotenv
import json

load_dotenv()

def _get_api_keys():
    """Collect all configured Gemini API keys (primary + fallbacks).
    In Vercel: set GOOGLE_API_KEY (or GEMINI_API_KEY) in Project Settings → Environment Variables.
    """
    keys = []
    primary = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if primary and primary.strip():
        keys.append(primary.strip())
    for i in range(2, 11):
        k = os.getenv(f"GOOGLE_API_KEY_{i}")
        if k and k.strip():
            keys.append(k.strip())
    return keys

GOOGLE_API_KEYS = _get_api_keys()
if GOOGLE_API_KEYS:
    genai.configure(api_key=GOOGLE_API_KEYS[0])

def _is_quota_error(e: Exception) -> bool:
    """Detect rate limit / quota exceeded from Gemini API."""
    msg = str(e).lower()
    return (
        "quota" in msg or "resource exhausted" in msg or "rate limit" in msg
        or "429" in msg or "too many requests" in msg
    )

def _generate_with_keys(prompt: str, model_name: str, is_json: bool = False):
    """Try each API key in order until one succeeds. Includes model fallbacks."""
    json_prompt = prompt + "\n\nIMPORTANT: Return ONLY valid JSON. No markdown formatting." if is_json else prompt
    last_error = None
    quota_hit = False
    
    # Use only the primary model - no fallbacks to avoid 404 errors
    fallbacks = [model_name]

    for i, api_key in enumerate(GOOGLE_API_KEYS):
        genai.configure(api_key=api_key)
        for current_model in fallbacks:
            try:
                model = genai.GenerativeModel(current_model)
                response = model.generate_content(json_prompt)
                if not response or not response.text:
                    continue
                    
                text = response.text
                if is_json:
                    try:
                        if "```json" in text:
                            text = text.split("```json")[1].split("```")[0]
                        elif "```" in text:
                            text = text.split("```")[1]
                        text = text.strip()
                        return json.loads(text), None
                    except json.JSONDecodeError as je:
                        print(f"JSON Parse Error with {current_model}: {je}")
                        last_error = je
                        continue
                return text, None
            except Exception as e:
                last_error = e
                msg = str(e).lower()
                if _is_quota_error(e):
                    quota_hit = True
                    break # Try next key for quota errors
                elif "404" in msg or "not found" in msg:
                    print(f"Model {current_model} not found, trying fallback...")
                    continue # Try next fallback model
                else:
                    print(f"Gemini key {i + 1} error ({current_model}): {e}")
                    break # Try next key for other errors
    
    # If we tried all keys and last failure was quota, return a friendly message
    if quota_hit and last_error:
        class QuotaExceeded(Exception):
            pass
        last_error = QuotaExceeded(
            "All AI quota is temporarily used. Please try again in a few minutes, or contact support if this keeps happening."
        )
    return (None if is_json else ""), last_error
    # If we tried all keys and last failure was quota, return a friendly message
    if quota_hit and last_error:
        class QuotaExceeded(Exception):
            pass
        last_error = QuotaExceeded(
            "All AI quota is temporarily used. Please try again in a few minutes, or contact support if this keeps happening."
        )
    return (None if is_json else ""), last_error

def _generate_with_key(prompt: str, model_name: str, api_key: str, is_json: bool = False):
    """Use a single API key (e.g. user's own key). Returns (result, error)."""
    json_prompt = prompt + "\n\nIMPORTANT: Return ONLY valid JSON. No markdown formatting." if is_json else prompt
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(json_prompt)
        text = response.text
        if is_json:
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1]
            return json.loads(text), None
        return text, None
    except Exception as e:
        return (None if is_json else ""), e


def get_gemini_response(prompt: str, image_url: str = None, model_name: str = "gemini-exp-1206", user_api_key: str | None = None) -> str:
    """
    Get a response from Gemini. If user_api_key is set, use only that (no credits).
    Otherwise use app keys (caller should deduct credits).
    """
    if user_api_key and user_api_key.strip():
        result, err = _generate_with_key(prompt, model_name, user_api_key.strip(), is_json=False)
        if err is not None:
            return str(err)
        return result
    if not GOOGLE_API_KEYS:
        return "To enable AI responses, add GOOGLE_API_KEY to your backend .env or add your own key at Manage Credits. Get a free key at https://aistudio.google.com/apikey"

    if image_url:
        pass

    result, err = _generate_with_keys(prompt, model_name, is_json=False)
    if err is not None:
        return str(err)
    return result


def get_gemini_json_response(prompt: str, model_name: str = "gemini-exp-1206", user_api_key: str | None = None) -> dict:
    """
    Get a JSON response from Gemini. If user_api_key is set, use only that (no credits).
    """
    if user_api_key and user_api_key.strip():
        result, err = _generate_with_key(prompt, model_name, user_api_key.strip(), is_json=True)
        if err is not None:
            # Surface the actual error so callers can show a useful message
            print(f"Gemini JSON Error (user key): {err}")
            return {"error": str(err)}
        return result if isinstance(result, dict) else {}
    if not GOOGLE_API_KEYS:
        return {"error": "Add GOOGLE_API_KEY to backend .env or add your own key at Manage Credits. Get a key at https://aistudio.google.com/apikey"}

    result, err = _generate_with_keys(prompt, model_name, is_json=True)
    if err is not None:
        # Return the Gemini error so API responses can include it
        print(f"Gemini JSON Error: {err}")
        return {"error": str(err)}
    return result if isinstance(result, dict) else {}
