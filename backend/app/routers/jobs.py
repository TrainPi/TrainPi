"""
Job Postings matched to profile (beyond Exhibit A — product extension).

Uses Adzuna's job search API (free tier, 250 calls/month), not any AI
provider — this is a plain REST call plus simple string-overlap scoring,
no Gemini involved. Matches the existing video.py caching pattern since
Adzuna's free tier is rate-limited too.
"""
import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, WorkforceProfile, CareerProfile
from app.auth import get_current_user
from app.cache import cache_get, cache_set

router = APIRouter()

CACHE_TTL = 60 * 60 * 4  # 4 hours — job postings change faster than course/video content
CACHE_PREFIX = "jobs_search:"


def _get_user_skills(user: User, db: Session) -> list[str]:
    """Pull skills from whichever profile the user has — workforce flow first, then individual career flow."""
    wf_profile = (
        db.query(WorkforceProfile)
        .filter(WorkforceProfile.user_id == user.id)
        .order_by(WorkforceProfile.created_at.desc())
        .first()
    )
    if wf_profile:
        skills = wf_profile.extracted_skills or wf_profile.primary_skills or []
        if skills:
            return skills

    career_profile = (
        db.query(CareerProfile)
        .filter(CareerProfile.user_id == user.id)
        .order_by(CareerProfile.created_at.desc())
        .first()
    )
    if career_profile and career_profile.skills:
        return career_profile.skills

    return []


def _score_posting(posting: dict, skills: list[str]) -> tuple[int, list[str]]:
    """Count how many of the user's skills appear in the posting's title+description text."""
    haystack = f"{posting.get('title', '')} {posting.get('description', '')}".lower()
    matched = [s for s in skills if s.lower() in haystack]
    return len(matched), matched


@router.get("/search")
async def search_jobs(
    query: str | None = Query(None, description="Override the auto-built skills query"),
    location: str = Query("", description="e.g. 'Reston, VA' — blank searches all locations"),
    country: str = Query("us", description="Adzuna country code: us, gb, ca, au, etc."),
    results_per_page: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Search job postings matched to the current user's profile skills.
    If `query` is not provided, builds one from the user's extracted/entered skills.
    """
    app_id = os.getenv("ADZUNA_APP_ID", "").strip()
    app_key = os.getenv("ADZUNA_APP_KEY", "").strip()
    if not app_id or not app_key:
        raise HTTPException(status_code=503, detail="Job search is not configured (ADZUNA_APP_ID/ADZUNA_APP_KEY missing).")

    skills = _get_user_skills(current_user, db)
    search_query = query or " ".join(skills[:6]) or "entry level"

    cache_key = f"{country}:{search_query.lower()}:{location.lower()}:{results_per_page}"
    cached = cache_get(CACHE_PREFIX + cache_key)
    if cached is not None:
        return {"query": search_query, "results": cached, "cached": True}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"https://api.adzuna.com/v1/api/jobs/{country}/search/1",
                params={
                    "app_id": app_id,
                    "app_key": app_key,
                    "what": search_query,
                    "where": location or None,
                    "results_per_page": results_per_page,
                    "content-type": "application/json",
                },
            )
            data = resp.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Job search provider error: {str(e)}")

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=data.get("display", "Job search provider error"))

    raw_results = data.get("results", [])
    scored_results = []
    for posting in raw_results:
        match_count, matched_skills = _score_posting(posting, skills)
        scored_results.append({
            "id": posting.get("id"),
            "title": posting.get("title"),
            "company": (posting.get("company") or {}).get("display_name"),
            "location": (posting.get("location") or {}).get("display_name"),
            "description": (posting.get("description") or "")[:500],
            "salary_min": posting.get("salary_min"),
            "salary_max": posting.get("salary_max"),
            "url": posting.get("redirect_url"),
            "created": posting.get("created"),
            "matched_skills": matched_skills,
            "match_count": match_count,
            "total_skills": len(skills),
        })

    # Sort by skill match count (descending) when the user has a skills profile;
    # otherwise leave in the provider's relevance order.
    if skills:
        scored_results.sort(key=lambda r: r["match_count"], reverse=True)

    cache_set(CACHE_PREFIX + cache_key, scored_results, CACHE_TTL)
    return {"query": search_query, "results": scored_results, "cached": False}
