from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, CareerProfile
from app.schemas import CareerInterestRequest, CareerMatch, CareerProfileResponse
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

def match_career(interests: List[str], skills: List[str]) -> List[CareerMatch]:
    matches = []
    for career, data in CAREER_DATABASE.items():
        # Simple matching logic - count overlapping skills/interests
        interest_match = sum(1 for i in interests if i.lower() in career.lower())
        skill_match = sum(1 for s in skills if s.lower() in [sk.lower() for sk in data["required_skills"]])
        
        match_score = (interest_match * 0.4 + skill_match * 0.6) * 100
        if match_score > 20:  # Only return relevant matches
            matches.append(CareerMatch(
                career_path=career,
                match_score=min(match_score, 100),
                salary_range=data["salary_range"],
                growth_outlook=data["growth_outlook"],
                required_skills=data["required_skills"],
                job_titles=data["job_titles"]
            ))
    
    return sorted(matches, key=lambda x: x.match_score, reverse=True)

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
    
    # Get career matches
    matches = match_career(request.interests, request.skills)
    return matches

@router.post("/select/{career_path}")
def select_career(
    career_path: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Update user's selected career path
    profile = db.query(CareerProfile).filter(
        CareerProfile.user_id == current_user.id
    ).order_by(CareerProfile.created_at.desc()).first()
    
    if profile:
        profile.career_path = career_path
        db.commit()
    
    return {"message": f"Career path {career_path} selected"}

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

