import google.generativeai as genai
import openai
import os
from dotenv import load_dotenv
import json
import re

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

# Groq Configuration for fallback
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.1-8b-instant"

def _get_groq_response(prompt: str, is_json: bool = False, max_tokens: int = 8000):
    """Get response from Groq API as fallback"""
    if not GROQ_API_KEY:
        return (None if is_json else ""), Exception("Groq API key not configured")
    
    try:
        client = openai.OpenAI(
            api_key=GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1"
        )
        
        if is_json:
            json_prompt = f"{prompt}\n\nIMPORTANT: Return ONLY valid JSON without any markdown formatting, explanations, or extra text. Just the JSON object."
            system_msg = "You are a helpful assistant. Always respond with valid JSON only - no markdown, no explanations, no extra text, just pure JSON."
        else:
            json_prompt = prompt
            system_msg = "You are a helpful AI assistant for TrainPI, a learning platform. Be concise and helpful."
        
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": json_prompt}
            ],
            max_tokens=max_tokens,
            temperature=0.7 if not is_json else 0.1
        )
        
        result = response.choices[0].message.content.strip()
        
        if is_json:
            # Enhanced JSON parsing with better error handling
            cleaned_result = result.strip()
            
            # Remove markdown formatting if present
            if "```json" in cleaned_result:
                cleaned_result = cleaned_result.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned_result and cleaned_result.count("```") >= 2:
                cleaned_result = cleaned_result.split("```")[1].strip()
            
            # Remove common prefixes that might interfere
            if cleaned_result.startswith("Here's") or cleaned_result.startswith("Here is"):
                lines = cleaned_result.split('\n')
                for i, line in enumerate(lines):
                    if line.strip().startswith('{'):
                        cleaned_result = '\n'.join(lines[i:]).strip()
                        break
            
            # Primary parsing attempt (this should work for valid JSON)
            try:
                parsed_json = json.loads(cleaned_result)
                if isinstance(parsed_json, dict):
                    print(f"✅ Groq JSON parsed successfully - {len(parsed_json.get('steps', []))} steps generated")
                    return parsed_json, None
            except json.JSONDecodeError as e:
                # Fallback: Extract JSON with regex
                try:
                    json_match = re.search(r'\{.*\}', cleaned_result, re.DOTALL)
                    if json_match:
                        parsed_json = json.loads(json_match.group())
                        if isinstance(parsed_json, dict):
                            print("✅ Groq JSON parsed with regex extraction")
                            return parsed_json, None
                except (json.JSONDecodeError, AttributeError):
                    pass
                
                # Fallback: Find JSON boundaries manually
                try:
                    start_idx = cleaned_result.find('{')
                    end_idx = cleaned_result.rfind('}') + 1
                    if start_idx != -1 and end_idx > start_idx:
                        json_str = cleaned_result[start_idx:end_idx]
                        parsed_json = json.loads(json_str)
                        if isinstance(parsed_json, dict):
                            print("✅ Groq JSON parsed with manual boundary detection")
                            return parsed_json, None
                except json.JSONDecodeError:
                    pass
            
            # If we reach here, all parsing failed
            print(f"❌ Groq JSON parsing failed - response length: {len(cleaned_result)}")
            return {
                "error": "JSON parsing failed after multiple attempts", 
                "raw_preview": result[:200] if len(result) > 200 else result,
                "status": "parsing_failed",
                "message": "AI returned response but JSON parsing failed with all methods"
            }, None
        
        return result, None
        
    except Exception as e:
        print(f"Groq API error: {e}")
        return (None if is_json else ""), e

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
    Falls back to Groq if quota exceeded.
    """
    if user_api_key and user_api_key.strip():
        result, err = _generate_with_key(prompt, model_name, user_api_key.strip(), is_json=False)
        if err is not None:
            # If user's key fails, try Groq fallback
            if "quota" in str(err).lower():
                print("User's Gemini quota exceeded, trying Groq fallback...")
                groq_result, groq_err = _get_groq_response(prompt, is_json=False)
                if groq_err is None:
                    return groq_result
            return str(err)
        return result
    
    if not GOOGLE_API_KEYS:
        # No Google keys, try Groq directly
        print("No Google API keys, using Groq...")
        groq_result, groq_err = _get_groq_response(prompt, is_json=False)
        if groq_err is None:
            return groq_result
        return "To enable AI responses, add GOOGLE_API_KEY to your backend .env or add your own key at Manage Credits. Get a free key at https://aistudio.google.com/apikey"

    if image_url:
        pass

    result, err = _generate_with_keys(prompt, model_name, is_json=False)
    if err is not None:
        # Check if it's a quota error and try Groq fallback
        if "quota" in str(err).lower() or "temporarily used" in str(err).lower():
            print("Google quota exhausted, switching to Groq (30k tokens/day free)...")
            groq_result, groq_err = _get_groq_response(prompt, is_json=False)
            if groq_err is None:
                return groq_result
            else:
                return f"Google quota exceeded and Groq fallback failed: {str(groq_err)}"
        return str(err)
    return result


def get_gemini_json_response(prompt: str, model_name: str = "gemini-exp-1206", user_api_key: str | None = None) -> dict:
    """
    Get a JSON response from Gemini. If user_api_key is set, use only that (no credits).
    Falls back to Groq if quota exceeded.
    """
    if user_api_key and user_api_key.strip():
        result, err = _generate_with_key(prompt, model_name, user_api_key.strip(), is_json=True)
        if err is not None:
            # Surface the actual error so callers can show a useful message
            print(f"Gemini JSON Error (user key): {err}")
            # Try Groq fallback for user key quota issues
            if "quota" in str(err).lower():
                print("User's Gemini quota exceeded, trying Groq JSON fallback...")
                groq_result, groq_err = _get_groq_response(prompt, is_json=True)
                if groq_err is None:
                    return groq_result if isinstance(groq_result, dict) else {}
            return {"error": str(err)}
        return result if isinstance(result, dict) else {}
    
    if not GOOGLE_API_KEYS:
        # No Google keys, try Groq directly
        print("No Google API keys, using Groq for JSON...")
        groq_result, groq_err = _get_groq_response(prompt, is_json=True)
        if groq_err is None:
            return groq_result if isinstance(groq_result, dict) else {}
        return {"error": "Add GOOGLE_API_KEY to backend .env or add your own key at Manage Credits. Get a key at https://aistudio.google.com/apikey"}

    result, err = _generate_with_keys(prompt, model_name, is_json=True)
    if err is not None:
        # Return the Gemini error so API responses can include it
        print(f"Gemini JSON Error: {err}")
        
        # Check if it's a quota error and try Groq fallback
        if "quota" in str(err).lower() or "temporarily used" in str(err).lower():
            print("Google JSON quota exhausted, switching to Groq JSON...")
            groq_result, groq_err = _get_groq_response(prompt, is_json=True)
            if groq_err is None:
                return groq_result if isinstance(groq_result, dict) else {}
            else:
                return {"error": f"Google quota exceeded and Groq JSON fallback failed: {str(groq_err)}"}
        
        return {"error": str(err)}
    return result if isinstance(result, dict) else {}
