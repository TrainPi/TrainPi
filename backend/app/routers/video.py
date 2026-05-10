from fastapi import APIRouter, HTTPException
import httpx
import os
import time

router = APIRouter()

# Simple in-memory cache: {query -> {video_id, title, thumbnail, cached_at}}
_cache: dict[str, dict] = {}
CACHE_TTL = 60 * 60 * 24  # 24 hours


def _cached(q: str):
    entry = _cache.get(q)
    if entry and (time.time() - entry["cached_at"]) < CACHE_TTL:
        return entry
    return None


@router.get("/search")
async def search_video(q: str):
    """Return a single embeddable YouTube video ID for the given search query."""
    if not q or not q.strip():
        raise HTTPException(status_code=400, detail="Query required")

    key = q.strip().lower()
    cached = _cached(key)
    if cached:
        return cached

    api_key = os.getenv("YOUTUBE_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=503, detail="YOUTUBE_API_KEY not configured")

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(
                "https://www.googleapis.com/youtube/v3/search",
                params={
                    "key": api_key,
                    "q": q,
                    "part": "snippet",
                    "type": "video",
                    "maxResults": 3,
                    "videoEmbeddable": "true",
                    "safeSearch": "moderate",
                    "relevanceLanguage": "en",
                },
            )
            data = resp.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"YouTube API error: {str(e)}")

    if "error" in data:
        raise HTTPException(status_code=502, detail=data["error"].get("message", "YouTube API error"))

    items = data.get("items", [])
    if not items:
        raise HTTPException(status_code=404, detail="No video found")

    item = items[0]
    result = {
        "video_id": item["id"]["videoId"],
        "title": item["snippet"]["title"],
        "channel": item["snippet"]["channelTitle"],
        "thumbnail": item["snippet"]["thumbnails"].get("high", {}).get("url", ""),
        "cached_at": time.time(),
    }
    _cache[key] = result
    return result
