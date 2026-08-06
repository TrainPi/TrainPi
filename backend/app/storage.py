"""
Object storage for user-uploaded files that need to persist and be served
back later (currently: avatars). Everything else in this app (resumes,
org documents, lesson uploads) is extract-then-discard — the AI-extracted
text is what's persisted, not the raw file — so this module intentionally
has a narrow scope.

Backed by Cloudflare R2 (S3-compatible API, free tier, no egress fees) via
boto3. Falls back to local disk when R2 isn't configured, same pattern as
cache.py's Redis/in-memory fallback — so local dev works with zero setup,
and it upgrades automatically once R2 credentials are added.

Local disk is NOT viable in production: Vercel's serverless filesystem is
ephemeral and typically read-only outside /tmp, so a file written by one
invocation may be gone (or fail to write at all) by the next request.
"""
import os
import uuid
from typing import Optional

_R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "").strip()
_R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "").strip()
_R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "").strip()
_R2_BUCKET = os.getenv("R2_BUCKET", "").strip()
_R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "").strip().rstrip("/")

_client = None
_client_init_attempted = False


def is_object_storage_configured() -> bool:
    return bool(_R2_ACCOUNT_ID and _R2_ACCESS_KEY_ID and _R2_SECRET_ACCESS_KEY and _R2_BUCKET and _R2_PUBLIC_URL)


def _get_client():
    global _client, _client_init_attempted
    if _client is not None:
        return _client
    if _client_init_attempted or not is_object_storage_configured():
        return None
    _client_init_attempted = True
    import boto3
    _client = boto3.client(
        "s3",
        endpoint_url=f"https://{_R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=_R2_ACCESS_KEY_ID,
        aws_secret_access_key=_R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )
    return _client


def upload_file(content: bytes, key_prefix: str, extension: str, content_type: str) -> str:
    """Store a file and return a URL it can be served from. `key_prefix` groups
    files by purpose (e.g. "avatars"); a random UUID is always used as the
    filename itself so uploads never collide or leak the original filename."""
    safe_ext = extension.lstrip(".").lower()
    key = f"{key_prefix}/{uuid.uuid4()}.{safe_ext}"

    client = _get_client()
    if client is not None:
        client.put_object(
            Bucket=_R2_BUCKET,
            Key=key,
            Body=content,
            ContentType=content_type,
        )
        return f"{_R2_PUBLIC_URL}/{key}"

    # Local-disk fallback for dev machines without R2 configured.
    local_path = os.path.join("uploads", key)
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    with open(local_path, "wb") as f:
        f.write(content)
    return f"/uploads/{key}"


def delete_file(url: str) -> None:
    """Best-effort delete given a URL previously returned by upload_file.
    Silently no-ops if the URL doesn't match the configured backend (e.g.
    stale local-disk URLs after R2 was later configured) — losing an old
    unused object/file is harmless."""
    client = _get_client()
    if client is not None and _R2_PUBLIC_URL and url.startswith(_R2_PUBLIC_URL + "/"):
        key = url[len(_R2_PUBLIC_URL) + 1:]
        try:
            client.delete_object(Bucket=_R2_BUCKET, Key=key)
        except Exception:
            pass
        return

    if url.startswith("/uploads/"):
        local_path = url.lstrip("/")
        try:
            os.remove(local_path)
        except OSError:
            pass
