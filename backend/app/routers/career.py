from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, CareerProfile
from app.schemas import CareerInterestRequest, CareerMatch, CareerProfileResponse, CareerSelectRequest
from app.auth import get_current_user
from typing import List

router = APIRouter()

# Mock career matching logic - in production, integrate with ONET/BLS APIs
CAREER_DATABASE = {
    "Software Development": {
        "salary_range": "$70,000 - $150,000",
        "growth_outlook": "22% growth (2020-2030)",
        "required_skills": ["Programming", "Problem Solving", "Software Engineering"],
        "job_titles": ["Software Engineer", "Full Stack Developer", "Backend Developer"]
    },
    "Data Analysis": {
        "salary_range": "$60,000 - $120,000",
        "growth_outlook": "25% growth (2020-2030)",
        "required_skills": ["Data Analysis", "Statistics", "SQL", "Python"],
        "job_titles": ["Data Analyst", "Business Analyst", "Data Scientist"]
    },
    "Marketing": {
        "salary_range": "$50,000 - $100,000",
        "growth_outlook": "10% growth (2020-2030)",
        "required_skills": ["Marketing", "SEO", "Content Creation", "Analytics"],
        "job_titles": ["Marketing Specialist", "Digital Marketer", "Content Manager"]
    },
    "Cybersecurity": {
        "salary_range": "$80,000 - $160,000",
        "growth_outlook": "33% growth (2020-2030)",
        "required_skills": ["Network Security", "Ethical Hacking", "Risk Assessment"],
        "job_titles": ["Security Analyst", "Penetration Tester", "Security Engineer"]
    },
    "Project Management": {
        "salary_range": "$65,000 - $130,000",
        "growth_outlook": "7% growth (2020-2030)",
        "required_skills": ["Project Management", "Leadership", "Communication"],
        "job_titles": ["Project Manager", "Scrum Master", "Program Manager"]
    }
}

import os
import json
from app.services.ai_service import get_gemini_json_response
from dotenv import load_dotenv

load_dotenv()

def get_ai_career_matches(interests: List[str], skills: List[str]) -> List[CareerMatch]:
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
        data = get_gemini_json_response(prompt)
        matches_data = data.get("matches", [])
        
        return [CareerMatch(**m) for m in matches_data]
    except Exception as e:
        print(f"AI Match Error: {e}")
        # Fallback to empty list or static logic could go here
        return []

@router.post("/discover", response_model=List[CareerMatch])
def discover_careers(
    request: CareerInterestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Save user interests and skills
    profile = CareerProfile(
        user_id=current_user.id,
        interests=request.interests,
        skills=request.skills
    )
    db.add(profile)
    db.commit()
    
    # Get AI matches
    matches = get_ai_career_matches(request.interests, request.skills)
    
    # If AI fails, return an empty list (frontend handles empty state or we could fallback)
    return matches

# Add CareerSelectRequest to imports (assumed existing imports handle this generally, but modifying the import line is safe practice if I can rely on previous view)
# Actually, I'll validly modify the import line separately or assume "from app.schemas import *" logic? 
# "from app.schemas import CareerInterestRequest, CareerMatch, CareerProfileResponse" is line 5. I should update that too.

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

