"""
Shared caching layer — Upstash Redis (REST-based, fits Vercel serverless
since it needs no persistent TCP connection, unlike traditional redis-py).

Falls back to a per-process in-memory dict when Redis isn't configured,
so existing callers (video.py, jobs.py) keep working before UPSTASH_* env
vars are set — this makes Redis an upgrade, not a hard requirement.

Also the basis for rate_limit.py's cross-instance limiting: it uses
cache_incr() to get a true global count when Redis is configured, falling
back to its own per-process in-memory sliding window otherwise.
"""
import os
import json
import time
import logging
from typing import Any

logger = logging.getLogger(__name__)

_redis_client = None
_redis_checked = False


def _get_redis():
    """Lazily construct the Upstash Redis client. Returns None if not configured."""
    global _redis_client, _redis_checked
    if _redis_checked:
        return _redis_client
    _redis_checked = True

    url = os.getenv("UPSTASH_REDIS_REST_URL", "").strip()
    token = os.getenv("UPSTASH_REDIS_REST_TOKEN", "").strip()
    if not url or not token:
        logger.info("Upstash Redis not configured (UPSTASH_REDIS_REST_URL/TOKEN missing) - using in-memory cache fallback")
        return None

    try:
        from upstash_redis import Redis
        _redis_client = Redis(url=url, token=token)
        return _redis_client
    except Exception as e:
        logger.warning("Failed to initialize Upstash Redis client: %s", e)
        return None


# In-memory fallback store: key -> {value, expires_at}
_memory_store: dict[str, dict] = {}


def cache_get(key: str) -> Any | None:
    """Get a cached value (JSON-decoded). Returns None on miss or if expired."""
    client = _get_redis()
    if client is not None:
        try:
            raw = client.get(key)
            return json.loads(raw) if raw else None
        except Exception as e:
            logger.warning("Redis get failed for key %s: %s", key, e)
            return None

    entry = _memory_store.get(key)
    if entry and time.time() < entry["expires_at"]:
        return entry["value"]
    if entry:
        del _memory_store[key]
    return None


def cache_set(key: str, value: Any, ttl_seconds: int) -> None:
    """Set a cached value with a TTL, JSON-encoded."""
    client = _get_redis()
    if client is not None:
        try:
            client.set(key, json.dumps(value), ex=ttl_seconds)
            return
        except Exception as e:
            logger.warning("Redis set failed for key %s: %s", key, e)
            # fall through to memory store so the cache still works this request

    _memory_store[key] = {"value": value, "expires_at": time.time() + ttl_seconds}


def cache_incr(key: str, ttl_seconds: int) -> int:
    """Increment a counter (creating it with the given TTL if new). Returns the new count.
    Used by the rate limiter for a true cross-instance count once Redis is configured."""
    client = _get_redis()
    if client is not None:
        try:
            count = client.incr(key)
            if count == 1:
                client.expire(key, ttl_seconds)
            return count
        except Exception as e:
            logger.warning("Redis incr failed for key %s: %s", key, e)

    entry = _memory_store.get(key)
    now = time.time()
    if entry and now < entry["expires_at"]:
        entry["value"] += 1
        return entry["value"]
    _memory_store[key] = {"value": 1, "expires_at": now + ttl_seconds}
    return 1


def is_redis_configured() -> bool:
    return _get_redis() is not None
