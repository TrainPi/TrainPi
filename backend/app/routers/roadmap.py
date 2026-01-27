from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Roadmap, CareerProfile
from app.schemas import RoadmapCreate, RoadmapResponse, RoadmapStep
from app.auth import get_current_user
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
    # Fetch user profile for context
    profile = db.query(CareerProfile).filter(
        CareerProfile.user_id == current_user.id
    ).order_by(CareerProfile.created_at.desc()).first()

    skills_context = f", Skills: {', '.join(profile.skills)}" if profile else ""
    interests_context = f", Interests: {', '.join(profile.interests)}" if profile else ""

    prompt = f"""Create a highly detailed, expert-level learning roadmap for a career in {roadmap_data.career_path}, similar to 'roadmap.sh'.
    User Context: {skills_context}{interests_context}.
    
    Return a strictly valid JSON object with a single 'steps' key containing a list of steps. 
    Each step must have: 
    - 'step_number' (int)
    - 'title' (str): specific and professional
    - 'description' (str): 2-3 sentences explaining the 'why' and core concepts.
    - 'skills' (list of str): 3-5 specific sub-skills or technologies.
    - 'certifications' (list of str): Relevant certs.
    - 'estimated_time' (str): e.g., "2 weeks"
    - 'resources' (list of dicts): Provide 2-3 high-quality learning resources. 
       Format: {{ "name": "Resource Title (Type)", "url": "https://www.google.com/search?q=..." }}
       Use Google Search URLs for robustness, e.g., "https://www.google.com/search?q=Python+Crash+Course+YouTube".
    
    Generate 6-8 comprehensive steps covering Beginner to Intermediate levels. Ensure the JSON is properly formatted."""

    try:
        data = get_gemini_json_response(prompt)
        steps_data = data.get("steps", [])

    except Exception as e:
        print(f"AI Generation Error: {e}")
        # Fallback to empty or simple default if AI fails
        steps_data = [{
            "step_number": 1,
            "title": "Welcome to " + roadmap_data.career_path,
            "description": "AI generation failed. Please try again or contact support.",
            "skills": [],
            "certifications": [],
            "estimated_time": "TBD",
            "resources": []
        }]
    
    # Create roadmap
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
        raise HTTPException(status_code=404, detail="No roadmap found")
    
    return roadmap

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
    roadmap.current_step = step_number
    roadmap.completion_percentage = (step_number / total_steps) * 100
    
    db.commit()
    return {"message": "Progress updated", "completion_percentage": roadmap.completion_percentage}

