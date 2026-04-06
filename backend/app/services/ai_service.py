import google.generativeai as genai
import openai
import os
from dotenv import load_dotenv
import json
import re
import logging
import httpx
from typing import Optional
import signal

load_dotenv()
logger = logging.getLogger(__name__)

# Request timeout for AI API calls (in seconds)
AI_REQUEST_TIMEOUT = 45  # Leave 5-15 seconds buffer before Vercel timeout

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

def _refresh_google_keys():
    """Re-read keys on every call so Vercel env vars are always picked up."""
    keys = _get_api_keys()
    if keys:
        genai.configure(api_key=keys[0])
    return keys

GOOGLE_API_KEYS = _refresh_google_keys()

# Groq Configuration for fallback
GROQ_MODEL = "llama-3.1-8b-instant"

def _get_groq_response(prompt: str, is_json: bool = False, max_tokens: int = 1200):
    """Get response from Groq API as fallback — reads key fresh each call so Vercel env vars are always picked up."""
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    if not groq_key:
        return (None if is_json else ""), Exception("Groq API key not configured")
    
    try:
        client = openai.OpenAI(
            api_key=groq_key,
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
                    print(f"[OK] Groq JSON parsed - {len(parsed_json.get('steps', []))} steps")
                    return parsed_json, None
            except json.JSONDecodeError as e:
                # Fallback: Extract JSON with regex
                try:
                    json_match = re.search(r'\{.*\}', cleaned_result, re.DOTALL)
                    if json_match:
                        parsed_json = json.loads(json_match.group())
                        if isinstance(parsed_json, dict):
                            print("[OK] Groq JSON parsed with regex")
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
                            print("[OK] Groq JSON parsed")
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
    keys = _refresh_google_keys()
    
    # Use only the primary model - no fallbacks to avoid 404 errors
    fallbacks = [model_name]

    for i, api_key in enumerate(keys):
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
            except TimeoutError as e:
                print(f"Gemini timeout with key {i + 1}: {e}")
                last_error = e
                break  # Timeout - try next key, but prefer fallback to Groq
            except Exception as e:
                last_error = e
                msg = str(e).lower()
                if _is_quota_error(e):
                    quota_hit = True
                    break # Try next key for quota errors
                elif "404" in msg or "not found" in msg:
                    print(f"Model {current_model} not found, trying fallback...")
                    continue # Try next fallback model
                elif "timeout" in msg or "deadline" in msg:
                    print(f"Gemini timeout with key {i + 1}: {e}")
                    break  # Timeout detected - try next key or fallback to Groq
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


def get_gemini_response(prompt: str, image_url: str = None, model_name: str = "gemini-2.0-flash", user_api_key: str | None = None) -> str:
    """
    Get a response from Gemini. If user_api_key is set, use only that (no credits).
    Otherwise use app keys (caller should deduct credits).
    Falls back to Groq if quota exceeded.
    """
    if user_api_key and user_api_key.strip():
        result, err = _generate_with_key(prompt, model_name, user_api_key.strip(), is_json=False)
        if err is not None:
            # If user's key fails (quota, 404 model not found), try Groq fallback
            err_lower = str(err).lower()
            if "quota" in err_lower or "404" in err_lower or "not found" in err_lower or "models/" in err_lower:
                print("Gemini failed, trying Groq fallback...")
                groq_result, groq_err = _get_groq_response(prompt, is_json=False)
                if groq_err is None:
                    return groq_result
            return str(err)
        return result
    
    fresh_keys = _refresh_google_keys()
    if not fresh_keys:
        # No Google keys, try Groq directly
        print("No Google API keys, using Groq...")
        groq_result, groq_err = _get_groq_response(prompt, is_json=False)
        if groq_err is None:
            return groq_result
        logger.error(f"Groq fallback failed for text response: {groq_err}")
        return f"Groq fallback failed: {groq_err}"

    if image_url:
        pass

    result, err = _generate_with_keys(prompt, model_name, is_json=False)
    if err is not None:
        err_lower = str(err).lower()
        # Try Groq fallback on quota, 404 model not found, or other Gemini errors
        if "quota" in err_lower or "temporarily used" in err_lower or "404" in err_lower or "not found" in err_lower or "models/" in err_lower:
            print("Gemini unavailable, switching to Groq...")
            groq_result, groq_err = _get_groq_response(prompt, is_json=False)
            if groq_err is None:
                return groq_result
            else:
                return f"Google quota exceeded and Groq fallback failed: {str(groq_err)}"
        return str(err)
    return result


def get_gemini_json_response(prompt: str, model_name: str = "gemini-2.0-flash", user_api_key: str | None = None) -> dict:
    """
    Get a JSON response from Gemini. If user_api_key is set, use only that (no credits).
    Falls back to Groq if quota exceeded.
    """
    if user_api_key and user_api_key.strip():
        result, err = _generate_with_key(prompt, model_name, user_api_key.strip(), is_json=True)
        if err is not None:
            print(f"Gemini JSON Error (user key): {err}")
            err_lower = str(err).lower()
            if "quota" in err_lower or "404" in err_lower or "not found" in err_lower or "models/" in err_lower:
                print("Gemini failed, trying Groq JSON fallback...")
                groq_result, groq_err = _get_groq_response(prompt, is_json=True)
                if groq_err is None:
                    return groq_result if isinstance(groq_result, dict) else {}
            return {"error": str(err)}
        return result if isinstance(result, dict) else {}
    
    fresh_keys = _refresh_google_keys()
    if not fresh_keys:
        # No Google keys, try Groq directly
        print("No Google API keys, using Groq for JSON...")
        groq_result, groq_err = _get_groq_response(prompt, is_json=True)
        if groq_err is None:
            return groq_result if isinstance(groq_result, dict) else {}
        logger.error(f"Groq JSON fallback failed: {groq_err}")
        return {"error": f"Groq fallback failed: {groq_err}"}

    result, err = _generate_with_keys(prompt, model_name, is_json=True)
    if err is not None:
        print(f"Gemini JSON Error: {err}")
        err_lower = str(err).lower()
        if "quota" in err_lower or "temporarily used" in err_lower or "404" in err_lower or "not found" in err_lower or "models/" in err_lower:
            print("Gemini unavailable, switching to Groq JSON...")
            groq_result, groq_err = _get_groq_response(prompt, is_json=True)
            if groq_err is None:
                return groq_result if isinstance(groq_result, dict) else {}
            logger.error(f"Gemini failed and Groq JSON fallback failed: {groq_err}")
            return {"error": f"Gemini failed and Groq fallback failed: {str(groq_err)}"}
        return {"error": str(err)}
    return result if isinstance(result, dict) else {}
