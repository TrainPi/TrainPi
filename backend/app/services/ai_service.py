import google.generativeai as genai
import openai
import os
from dotenv import load_dotenv
import json
import re
import logging
from typing import Any

load_dotenv()
logger = logging.getLogger(__name__)


def _strip_code_fences(text: str) -> str:
    stripped = (text or "").strip().replace("\ufeff", "")
    if stripped.startswith("```"):
        lines = stripped.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        stripped = "\n".join(lines).strip()
    if stripped.lower().startswith("json\n"):
        stripped = stripped[5:].strip()
    return stripped


def _extract_balanced_json_object(text: str) -> str | None:
    source = text or ""
    start = source.find("{")
    if start == -1:
        return None

    depth = 0
    in_string = False
    escaped = False
    begin = None

    for index in range(start, len(source)):
        char = source[index]

        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
        elif char == "{":
            if depth == 0:
                begin = index
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0 and begin is not None:
                return source[begin:index + 1]

    return None


def _normalize_json_candidate(text: str) -> str:
    normalized = (text or "").strip()
    normalized = normalized.replace("\u201c", '"').replace("\u201d", '"')
    normalized = normalized.replace("\u2018", "'").replace("\u2019", "'")
    normalized = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", normalized)
    normalized = re.sub(r",(\s*[}\]])", r"\1", normalized)
    return normalized.strip()


def _parse_json_dict(raw_text: str) -> dict[str, Any] | None:
    candidates: list[str] = []
    base = (raw_text or "").strip()
    if not base:
        return None

    stripped = _strip_code_fences(base)
    extracted = _extract_balanced_json_object(stripped) or _extract_balanced_json_object(base)

    for candidate in (base, stripped, extracted):
        if candidate and candidate not in candidates:
            candidates.append(candidate)

    for candidate in candidates:
        cleaned = _normalize_json_candidate(candidate)
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            continue

    return None


def _groq_chat_completion(messages: list[dict[str, str]], max_tokens: int, temperature: float, is_json: bool):
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    if not groq_key:
        raise RuntimeError("Groq API key not configured")

    client = openai.OpenAI(
        api_key=groq_key,
        base_url="https://api.groq.com/openai/v1"
    )

    request_kwargs = {
        "model": GROQ_MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    if is_json:
        request_kwargs["response_format"] = {"type": "json_object"}

    try:
        return client.chat.completions.create(**request_kwargs)
    except Exception as exc:
        if is_json and "response_format" in str(exc).lower():
            request_kwargs.pop("response_format", None)
            return client.chat.completions.create(**request_kwargs)
        raise


def _repair_json_with_groq(raw_text: str) -> tuple[dict[str, Any] | None, Exception | None]:
    try:
        response = _groq_chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": "Repair malformed JSON. Return exactly one valid JSON object with no markdown or commentary.",
                },
                {
                    "role": "user",
                    "content": f"Convert the following content into valid JSON without changing its meaning:\n\n{raw_text}",
                },
            ],
            max_tokens=2200,
            temperature=0,
            is_json=True,
        )
        content = (response.choices[0].message.content or "").strip()
        parsed = _parse_json_dict(content)
        if parsed is not None:
            return parsed, None
        return None, ValueError("Groq repair returned unparsable JSON")
    except Exception as exc:
        return None, exc

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
        if is_json:
            json_prompt = f"{prompt}\n\nIMPORTANT: Return ONLY valid JSON without any markdown formatting, explanations, or extra text. Just the JSON object."
            system_msg = "You are a helpful assistant. Always respond with valid JSON only - no markdown, no explanations, no extra text, just pure JSON."
        else:
            json_prompt = prompt
            system_msg = "You are a helpful AI assistant for TrainPI, a learning platform. Be concise and helpful."

        response = _groq_chat_completion(
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": json_prompt}
            ],
            max_tokens=max_tokens,
            temperature=0.7 if not is_json else 0.1,
            is_json=is_json,
        )
        
        result = response.choices[0].message.content.strip()
        
        if is_json:
            parsed_json = _parse_json_dict(result)
            if parsed_json is not None:
                print(f"[OK] Groq JSON parsed - {len(parsed_json.get('steps', []))} steps")
                return parsed_json, None

            repaired_json, repair_error = _repair_json_with_groq(result)
            if repaired_json is not None:
                print(f"[OK] Groq JSON repaired - {len(repaired_json.get('steps', []))} steps")
                return repaired_json, None

            print(f"❌ Groq JSON parsing failed - response length: {len(result.strip())}")
            return (None, repair_error or ValueError("JSON parsing failed after multiple attempts"))
        
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
                generation_config = {"temperature": 0.1 if is_json else 0.7}
                if is_json:
                    generation_config["response_mime_type"] = "application/json"
                model = genai.GenerativeModel(current_model, generation_config=generation_config)
                response = model.generate_content(json_prompt)
                if not response or not response.text:
                    continue
                    
                text = response.text
                if is_json:
                    parsed_json = _parse_json_dict(text)
                    if parsed_json is not None:
                        return parsed_json, None

                    repaired_json, repair_error = _repair_json_with_groq(text)
                    if repaired_json is not None:
                        return repaired_json, None

                    print(f"JSON Parse Error with {current_model}: unable to parse or repair response")
                    last_error = repair_error or ValueError("JSON parsing failed after multiple attempts")
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

def _generate_with_key(prompt: str, model_name: str, api_key: str, is_json: bool = False):
    """Use a single API key (e.g. user's own key). Returns (result, error)."""
    json_prompt = prompt + "\n\nIMPORTANT: Return ONLY valid JSON. No markdown formatting." if is_json else prompt
    try:
        genai.configure(api_key=api_key)
        generation_config = {"temperature": 0.1 if is_json else 0.7}
        if is_json:
            generation_config["response_mime_type"] = "application/json"
        model = genai.GenerativeModel(model_name, generation_config=generation_config)
        response = model.generate_content(json_prompt)
        text = response.text
        if is_json:
            parsed_json = _parse_json_dict(text)
            if parsed_json is not None:
                return parsed_json, None
            repaired_json, repair_error = _repair_json_with_groq(text)
            if repaired_json is not None:
                return repaired_json, None
            return None, repair_error or ValueError("JSON parsing failed after multiple attempts")
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
            if "quota" in err_lower or "404" in err_lower or "not found" in err_lower or "models/" in err_lower or "json parsing" in err_lower or "unparsable json" in err_lower:
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
        if "quota" in err_lower or "temporarily used" in err_lower or "404" in err_lower or "not found" in err_lower or "models/" in err_lower or "json parsing" in err_lower or "unparsable json" in err_lower:
            print("Gemini unavailable, switching to Groq JSON...")
            groq_result, groq_err = _get_groq_response(prompt, is_json=True)
            if groq_err is None:
                return groq_result if isinstance(groq_result, dict) else {}
            logger.error(f"Gemini failed and Groq JSON fallback failed: {groq_err}")
            return {"error": f"Gemini failed and Groq fallback failed: {str(groq_err)}"}
        return {"error": str(err)}
    return result if isinstance(result, dict) else {}
