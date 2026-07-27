"""
Per-user request rate limiting — independent of the credits system.

Credits limit how much AI usage a user can afford; this limits how FAST they
can fire requests, which credits alone don't prevent (e.g. spamming a free
action, or exploiting the refund-on-AI-failure path in a tight loop).

Two backends:
- Redis (via cache.py / Upstash), when configured: a true cross-instance
  fixed-window counter (INCR + EXPIRE) — this is the real global limiter.
- In-memory sliding window fallback, scoped per-process, when Redis isn't
  configured. On Vercel serverless each function instance has its own
  memory, so this only rate-limits within a single warm instance. Still
  meaningfully slows down a single abusive client hitting one instance,
  but isn't a global guarantee — hence the Redis upgrade path above.
"""
import time
from collections import defaultdict, deque
from fastapi import Depends, HTTPException, status

from app.models import User
from app.auth import get_current_user
from app.cache import cache_incr, is_redis_configured

# In-memory fallback: user_id -> endpoint_key -> deque of request timestamps
_requests: dict[tuple[int, str], deque] = defaultdict(deque)


def _check_in_memory(user_id: int, endpoint_key: str, max_requests: int, window_seconds: int) -> int | None:
    """Sliding window. Returns retry_after seconds if blocked, else None."""
    now = time.time()
    key = (user_id, endpoint_key)
    q = _requests[key]

    while q and now - q[0] > window_seconds:
        q.popleft()

    if len(q) >= max_requests:
        return int(window_seconds - (now - q[0])) + 1

    q.append(now)
    return None


def _check_redis(user_id: int, endpoint_key: str, max_requests: int, window_seconds: int) -> int | None:
    """Fixed window via Redis INCR+EXPIRE. Returns retry_after seconds if blocked, else None."""
    # Bucket by window so the counter resets cleanly rather than growing forever.
    window_id = int(time.time() // window_seconds)
    key = f"ratelimit:{endpoint_key}:{user_id}:{window_id}"
    count = cache_incr(key, window_seconds)
    if count > max_requests:
        retry_after = window_seconds - int(time.time() % window_seconds)
        return max(retry_after, 1)
    return None


def _check_and_record(user_id: int, endpoint_key: str, max_requests: int, window_seconds: int) -> None:
    if is_redis_configured():
        retry_after = _check_redis(user_id, endpoint_key, max_requests, window_seconds)
    else:
        retry_after = _check_in_memory(user_id, endpoint_key, max_requests, window_seconds)

    if retry_after is not None:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many requests. Please wait {retry_after} seconds and try again.",
            headers={"Retry-After": str(retry_after)},
        )


def rate_limit(endpoint_key: str, max_requests: int, window_seconds: int):
    """
    FastAPI dependency factory. Usage:

        @router.post("/analyze", dependencies=[Depends(rate_limit("workforce_analyze", 5, 60))])

    Limits each user to `max_requests` calls to this endpoint per `window_seconds`.
    """
    def _dependency(current_user: User = Depends(get_current_user)):
        _check_and_record(current_user.id, endpoint_key, max_requests, window_seconds)

    return _dependency
