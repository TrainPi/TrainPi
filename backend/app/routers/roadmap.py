from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Roadmap, CareerProfile
from app.schemas import RoadmapCreate, RoadmapResponse, RoadmapStep
from app.auth import get_current_user
from app.routers.credits import deduct_credits, refund_credits, CREDITS_PER_ROADMAP_CREATE
from typing import List

router = APIRouter()

import json
import os
from app.services.ai_service import get_gemini_json_response
from dotenv import load_dotenv

load_dotenv()

@router.post("/create", response_model=RoadmapResponse)
async def create_roadmap(
    roadmap_data: RoadmapCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    use_own_key = bool(current_user.gemini_api_key and current_user.gemini_api_key.strip())
    if not use_own_key:
        try:
            deduct_credits(
                db,
                current_user.id,
                CREDITS_PER_ROADMAP_CREATE,
                "usage",
                "AI Roadmap Create",
            )
        except HTTPException as e:
            if e.status_code == status.HTTP_402_PAYMENT_REQUIRED:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="INSUFFICIENT_CREDITS",
                )
            raise

    profile = db.query(CareerProfile).filter(
        CareerProfile.user_id == current_user.id
    ).order_by(CareerProfile.created_at.desc()).first()
    skills_context = f", Skills: {', '.join(profile.skills)}" if profile and profile.skills else ""
    interests_context = f", Interests: {', '.join(profile.interests)}" if profile and profile.interests else ""

    prompt = f"""Create a highly detailed, professional learning roadmap for a career in {roadmap_data.career_path}, modeled after 'roadmap.sh'.
    User Context: {skills_context}{interests_context}.
    
    The roadmap must follow a logical progression: Fundamentals -> Advanced Concepts -> Real-world Projects -> Job Readiness.
    
    Return a strictly valid JSON object with a single 'steps' key containing a list of steps. 
    Each step must have: 
    - 'step_number' (int)
    - 'title' (str): Short, punchy, and professional.
    - 'description' (str): 3-4 sentences explaining WHAT and WHY.
    - 'skills' (list of str): 4-6 specific technical skills.
    - 'certifications' (list of str): 1-2 recognized industry certifications.
    - 'estimated_time' (str): realistic estimate.
    - 'resources' (list of dicts): Provide 2-3 high-quality educational links. 
       PRIORITIZE links from recognizable sources like:
       - W3Schools (for fundamentals)
       - YouTube (for tutorials/overviews)
       - MDN Web Docs (for web tech)
       - Official Documentation sites (e.g., docs.python.org, react.dev)
       - FreeCodeCamp or Coursera (for full courses)
       Format: {{ "name": "Resource Title (Source)", "url": "Actual URL if known, or Search URL" }}
    
    Generate 7-9 comprehensive steps. Ensure the JSON is properly formatted and valid."""

    try:
        data = get_gemini_json_response(
            prompt,
            user_api_key=current_user.gemini_api_key if use_own_key else None,
        )
        steps_data = data.get("steps", []) if isinstance(data, dict) else []
    except Exception as e:
        print(f"AI Generation Error: {e}")
        if not use_own_key:
            refund_credits(db, current_user.id, CREDITS_PER_ROADMAP_CREATE, "Refund: AI roadmap failed")
        steps_data = [{
            "step_number": 1,
            "title": "Welcome to " + roadmap_data.career_path,
            "description": "AI generation failed. Please try again or buy more credits.",
            "skills": [],
            "certifications": [],
            "estimated_time": "TBD",
            "resources": []
        }]

    roadmap = Roadmap(
        user_id=current_user.id,
        career_path=roadmap_data.career_path,
        steps=steps_data,
        current_step=0,
        completion_percentage=0.0
    )
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)
    return roadmap

@router.get("/my-roadmap", response_model=RoadmapResponse)
def get_my_roadmap(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roadmap = db.query(Roadmap).filter(
        Roadmap.user_id == current_user.id
    ).order_by(Roadmap.created_at.desc()).first()
    
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
        
    return roadmap
@router.get("/get/{roadmap_id}", response_model=RoadmapResponse)
def get_roadmap(
    roadmap_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roadmap = db.query(Roadmap).filter(
        Roadmap.id == roadmap_id,
        Roadmap.user_id == current_user.id
    ).first()
    
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    return roadmap

@router.get("/all", response_model=List[RoadmapResponse])
def get_all_roadmaps(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roadmaps = db.query(Roadmap).filter(
        Roadmap.user_id == current_user.id
    ).order_by(Roadmap.created_at.desc()).all()
    return roadmaps

@router.post("/update-progress/{roadmap_id}")
def update_roadmap_progress(
    roadmap_id: int,
    step_number: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roadmap = db.query(Roadmap).filter(
        Roadmap.id == roadmap_id,
        Roadmap.user_id == current_user.id
    ).first()
    
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    total_steps = len(roadmap.steps) if roadmap.steps else 1
    # step_number = completed steps count; cap at total_steps to avoid >100%
    completed = min(max(0, step_number), total_steps)
    roadmap.current_step = completed
    roadmap.completion_percentage = round((completed / total_steps) * 100, 1)
    
    db.commit()
    db.refresh(roadmap)
    return {"message": "Progress updated", "completion_percentage": roadmap.completion_percentage, "current_step": completed}

