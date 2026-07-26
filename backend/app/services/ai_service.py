import google.generativeai as genai
import os
from dotenv import load_dotenv
import json
import re
import logging
from typing import Any

load_dotenv()
logger = logging.getLogger(__name__)


def _strip_code_fences(text: str) -> str:
    stripped = (text or "").strip().replace("﻿", "")
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
    normalized = normalized.replace("“", '"').replace("”", '"')
    normalized = normalized.replace("‘", "'").replace("’", "'")
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

DEFAULT_MODEL = "gemini-2.5-flash"

def _is_quota_error(e: Exception) -> bool:
    """Detect rate limit / quota exceeded from Gemini API."""
    msg = str(e).lower()
    return (
        "quota" in msg or "resource exhausted" in msg or "rate limit" in msg
        or "429" in msg or "too many requests" in msg
    )

def _generate_with_keys(prompt: str, model_name: str, is_json: bool = False):
    """Try each configured Gemini API key in order until one succeeds."""
    json_prompt = prompt + "\n\nIMPORTANT: Return ONLY valid JSON. No markdown formatting." if is_json else prompt
    last_error = None
    quota_hit = False
    keys = _refresh_google_keys()

    for i, api_key in enumerate(keys):
        genai.configure(api_key=api_key)
        try:
            generation_config = {"temperature": 0.1 if is_json else 0.7}
            if is_json:
                generation_config["response_mime_type"] = "application/json"
            model = genai.GenerativeModel(model_name, generation_config=generation_config)
            response = model.generate_content(json_prompt)
            if not response or not response.text:
                continue

            text = response.text
            if is_json:
                parsed_json = _parse_json_dict(text)
                if parsed_json is not None:
                    return parsed_json, None
                logger.warning("JSON parse error with %s: unable to parse response", model_name)
                last_error = ValueError("JSON parsing failed")
                continue
            return text, None
        except TimeoutError as e:
            logger.warning("Gemini timeout with key %d: %s", i + 1, e)
            last_error = e
        except Exception as e:
            last_error = e
            msg = str(e).lower()
            if _is_quota_error(e):
                quota_hit = True
            elif "404" in msg or "not found" in msg:
                logger.warning("Model %s not found", model_name)
            elif "timeout" in msg or "deadline" in msg:
                logger.warning("Gemini timeout with key %d: %s", i + 1, e)
            else:
                logger.warning("Gemini key %d error (%s): %s", i + 1, model_name, e)

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
            return None, ValueError("JSON parsing failed")
        return text, None
    except Exception as e:
        return (None if is_json else ""), e


def get_gemini_response(prompt: str, image_url: str = None, model_name: str = DEFAULT_MODEL, user_api_key: str | None = None) -> str:
    """
    Get a response from Gemini. If user_api_key is set, use only that (no credits).
    Otherwise use app keys (caller should deduct credits).
    """
    if user_api_key and user_api_key.strip():
        result, err = _generate_with_key(prompt, model_name, user_api_key.strip(), is_json=False)
        if err is not None:
            return str(err)
        return result

    fresh_keys = _refresh_google_keys()
    if not fresh_keys:
        logger.error("No Google API keys configured")
        return "AI is not configured. Please add GOOGLE_API_KEY to the server environment."

    result, err = _generate_with_keys(prompt, model_name, is_json=False)
    if err is not None:
        return str(err)
    return result


def get_gemini_json_response(prompt: str, model_name: str = DEFAULT_MODEL, user_api_key: str | None = None) -> dict:
    """
    Get a JSON response from Gemini. If user_api_key is set, use only that (no credits).
    """
    if user_api_key and user_api_key.strip():
        result, err = _generate_with_key(prompt, model_name, user_api_key.strip(), is_json=True)
        if err is not None:
            logger.warning("Gemini JSON error (user key): %s", err)
            return {"error": str(err)}
        return result if isinstance(result, dict) else {}

    fresh_keys = _refresh_google_keys()
    if not fresh_keys:
        logger.error("No Google API keys configured")
        return {"error": "AI is not configured. Please add GOOGLE_API_KEY to the server environment."}

    result, err = _generate_with_keys(prompt, model_name, is_json=True)
    if err is not None:
        logger.warning("Gemini JSON error: %s", err)
        return {"error": str(err)}
    return result if isinstance(result, dict) else {}
