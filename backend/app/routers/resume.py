from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Resume
from app.schemas import ResumeCreate, ResumeResponse, ResumeContent
from app.auth import get_current_user
from typing import List
import json

router = APIRouter()

def calculate_resume_score(resume_content: ResumeContent) -> float:
    """Calculate resume score based on completeness and quality"""
    score = 0.0
    
    # Personal info (10 points)
    if resume_content.personal_info.get("name"):
        score += 5
    if resume_content.personal_info.get("email"):
        score += 5
    
    # Summary (15 points)
    if resume_content.summary and len(resume_content.summary) > 50:
        score += 15
    
    # Experience (40 points)
    if resume_content.experience:
        score += min(len(resume_content.experience) * 10, 40)
    
    # Education (15 points)
    if resume_content.education:
        score += min(len(resume_content.education) * 7.5, 15)
    
    # Skills (10 points)
    if resume_content.skills:
        score += min(len(resume_content.skills) * 2, 10)
    
    # Certifications (10 points)
    if resume_content.certifications:
        score += min(len(resume_content.certifications) * 5, 10)
    
    return min(score, 100.0)

def check_ats_compliance(resume_content: ResumeContent) -> bool:
    """Basic ATS compliance check"""
    has_name = bool(resume_content.personal_info.get("name"))
    has_email = bool(resume_content.personal_info.get("email"))
    has_summary = bool(resume_content.summary)
    has_experience = len(resume_content.experience) > 0
    has_skills = len(resume_content.skills) > 0
    
    return has_name and has_email and has_summary and has_experience and has_skills

@router.post("/create", response_model=ResumeResponse)
def create_resume(
    resume_data: ResumeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Calculate resume score
    resume_score = calculate_resume_score(resume_data.content)
    ats_compliant = check_ats_compliance(resume_data.content)
    
    # Get latest version number
    latest_resume = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.version.desc()).first()
    
    version = (latest_resume.version + 1) if latest_resume else 1
    
    # Create resume
    resume = Resume(
        user_id=current_user.id,
        title=resume_data.title or "My Resume",
        content=resume_data.content.dict(),
        resume_score=resume_score,
        ats_compliant=ats_compliant,
        version=version
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    
    return resume

@router.get("/my-resumes", response_model=List[ResumeResponse])
def get_my_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resumes = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.created_at.desc()).all()
    
    return resumes

@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return resume

@router.post("/enhance/{resume_id}")
def enhance_resume(
    resume_id: int,
    job_description: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # In production, use AI to enhance resume based on job description
    # For now, return a message
    return {
        "message": "Resume enhancement suggestions generated",
        "suggestions": [
            "Add more relevant keywords from job description",
            "Quantify achievements with numbers",
            "Use action verbs in experience descriptions"
        ]
    }

