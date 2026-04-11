from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, CareerProfile
from app.schemas import CareerInterestRequest, CareerMatch, CareerProfileResponse, CareerSelectRequest
from app.auth import get_current_user
from app.routers.credits import deduct_credits, refund_credits, CREDITS_PER_CAREER_DISCOVER
from typing import List
from app.services.ai_service import get_gemini_json_response

router = APIRouter()

def get_ai_career_matches(interests: List[str], skills: List[str], user_api_key: str | None = None) -> List[CareerMatch]:
    prompt = f"""
    Based on the following user profile, suggest 3 suitable career paths.
    Interests: {', '.join(interests)}
    Skills: {', '.join(skills)}
    
    Return a valid JSON object with a key 'matches' containing a list of objects.
    Each object must have:
    - 'career_path' (str)
    - 'match_score' (int, 0-100)
    - 'salary_range' (str, e.g. "$70k - $120k")
    - 'growth_outlook' (str, e.g. "15% growth")
    - 'required_skills' (list of str)
    - 'job_titles' (list of str)
    """
    try:
        data = get_gemini_json_response(prompt, user_api_key=user_api_key)
        matches_data = data.get("matches", [])
        return [CareerMatch(**m) for m in matches_data]
    except Exception as e:
        print(f"AI Match Error: {e}")
        return []

@router.post("/discover", response_model=List[CareerMatch])
def discover_careers(
    request: CareerInterestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    use_own_key = bool(current_user.gemini_api_key and current_user.gemini_api_key.strip())
    if not use_own_key:
        try:
            deduct_credits(
                db,
                current_user.id,
                CREDITS_PER_CAREER_DISCOVER,
                "usage",
                "AI Career Discover",
            )
        except HTTPException as e:
            if e.status_code == status.HTTP_402_PAYMENT_REQUIRED:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="INSUFFICIENT_CREDITS",
                )
            raise

    profile = CareerProfile(
        user_id=current_user.id,
        interests=request.interests,
        skills=request.skills
    )
    db.add(profile)
    db.commit()

    matches = get_ai_career_matches(request.interests, request.skills, user_api_key=current_user.gemini_api_key if use_own_key else None)
    if not use_own_key and not matches:
        refund_credits(db, current_user.id, CREDITS_PER_CAREER_DISCOVER, "Refund: AI career discover failed")
    return matches


@router.post("/select")
def select_career(
    request: CareerSelectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Update user's selected career path or create new profile
    profile = db.query(CareerProfile).filter(
        CareerProfile.user_id == current_user.id
    ).order_by(CareerProfile.created_at.desc()).first()
    
    if profile:
        profile.career_path = request.career_path
    else:
        profile = CareerProfile(
            user_id=current_user.id,
            career_path=request.career_path,
            interests=[],
            skills=[]
        )
        db.add(profile)
    
    db.commit()
    
    return {"message": f"Career path {request.career_path} selected"}

@router.get("/profile", response_model=CareerProfileResponse)
def get_career_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CareerProfile).filter(
        CareerProfile.user_id == current_user.id
    ).order_by(CareerProfile.created_at.desc()).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Career profile not found")
    
    return profile

