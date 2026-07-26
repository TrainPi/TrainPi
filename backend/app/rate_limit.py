"""
Per-user request rate limiting — independent of the credits system.

Credits limit how much AI usage a user can afford; this limits how FAST they
can fire requests, which credits alone don't prevent (e.g. spamming a free
action, or exploiting the refund-on-AI-failure path in a tight loop).

In-memory sliding window, scoped per-process. This is a placeholder until
Redis is introduced — on Vercel serverless, each function instance has its
own memory, so this only rate-limits within a single warm instance, not
globally across all instances. Documented limitation, not a bug: it still
meaningfully slows down a single abusive client hitting a single instance,
and becomes a real global limiter once Redis is added (see requirements doc,
Section 11.4).
"""
import time
from collections import defaultdict, deque
from fastapi import Depends, HTTPException, status

from app.models import User
from app.auth import get_current_user

# user_id -> endpoint_key -> deque of request timestamps
_requests: dict[tuple[int, str], deque] = defaultdict(deque)


def _check_and_record(user_id: int, endpoint_key: str, max_requests: int, window_seconds: int) -> None:
    now = time.time()
    key = (user_id, endpoint_key)
    q = _requests[key]

    while q and now - q[0] > window_seconds:
        q.popleft()

    if len(q) >= max_requests:
        retry_after = int(window_seconds - (now - q[0])) + 1
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many requests. Please wait {retry_after} seconds and try again.",
            headers={"Retry-After": str(retry_after)},
        )

    q.append(now)


def rate_limit(endpoint_key: str, max_requests: int, window_seconds: int):
    """
    FastAPI dependency factory. Usage:

        @router.post("/analyze", dependencies=[Depends(rate_limit("workforce_analyze", 5, 60))])

    Limits each user to `max_requests` calls to this endpoint per `window_seconds`.
    """
    def _dependency(current_user: User = Depends(get_current_user)):
        _check_and_record(current_user.id, endpoint_key, max_requests, window_seconds)

    return _dependency
