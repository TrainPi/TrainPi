from fastapi import APIRouter, HTTPException
import httpx
import os
import time

from app.cache import cache_get, cache_set

router = APIRouter()

CACHE_TTL = 60 * 60 * 24  # 24 hours
CACHE_PREFIX = "video_search:"


@router.get("/search")
async def search_video(q: str):
    """
    Return a single embeddable YouTube video ID for the given search query.

    Quality gating: requests 5 candidates (medium/long duration only, so
    Shorts and junk clips are excluded), then picks the highest-view-count
    result among them instead of blindly taking YouTube's #1 relevance match.
    """
    if not q or not q.strip():
        raise HTTPException(status_code=400, detail="Query required")

    key = q.strip().lower()
    cached = cache_get(CACHE_PREFIX + key)
    if cached:
        return cached

    api_key = os.getenv("YOUTUBE_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=503, detail="YOUTUBE_API_KEY not configured")

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            search_resp = await client.get(
                "https://www.googleapis.com/youtube/v3/search",
                params={
                    "key": api_key,
                    "q": q,
                    "part": "snippet",
                    "type": "video",
                    "maxResults": 5,
                    "videoEmbeddable": "true",
                    "videoDuration": "medium",  # excludes Shorts/junk clips under 4 min
                    "safeSearch": "moderate",
                    "relevanceLanguage": "en",
                },
            )
            search_data = search_resp.json()

            if "error" in search_data:
                raise HTTPException(status_code=502, detail=search_data["error"].get("message", "YouTube API error"))

            items = search_data.get("items", [])
            if not items:
                raise HTTPException(status_code=404, detail="No video found")

            video_ids = [item["id"]["videoId"] for item in items if item.get("id", {}).get("videoId")]
            snippets_by_id = {item["id"]["videoId"]: item["snippet"] for item in items}

            # Fetch view counts in one batched call to pick the best of the 5 candidates.
            stats_resp = await client.get(
                "https://www.googleapis.com/youtube/v3/videos",
                params={
                    "key": api_key,
                    "id": ",".join(video_ids),
                    "part": "statistics",
                },
            )
            stats_data = stats_resp.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"YouTube API error: {str(e)}")

    view_counts = {
        v["id"]: int(v.get("statistics", {}).get("viewCount", 0) or 0)
        for v in stats_data.get("items", [])
    }

    if not view_counts:
        # Stats call failed/returned nothing — fall back to the top relevance result.
        best_id = video_ids[0]
    else:
        best_id = max(view_counts, key=lambda vid: view_counts.get(vid, 0))

    snippet = snippets_by_id[best_id]
    result = {
        "video_id": best_id,
        "title": snippet["title"],
        "channel": snippet["channelTitle"],
        "thumbnail": snippet["thumbnails"].get("high", {}).get("url", ""),
        "cached_at": time.time(),
    }
    cache_set(CACHE_PREFIX + key, result, CACHE_TTL)
    return result
