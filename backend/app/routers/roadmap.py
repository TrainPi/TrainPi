from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Roadmap
from app.schemas import RoadmapCreate, RoadmapResponse, RoadmapStep
from app.auth import get_current_user
from typing import List

router = APIRouter()

# Mock roadmap templates - in production, generate dynamically based on career path
ROADMAP_TEMPLATES = {
    "Software Development": [
        {
            "step_number": 1,
            "title": "Learn Programming Languages",
            "description": "Master fundamental programming languages like Python, JavaScript, or Java",
            "skills": ["Programming", "Problem Solving", "Algorithms"],
            "certifications": ["Python for Everybody (Coursera)", "JavaScript Algorithms (freeCodeCamp)"],
            "estimated_time": "3-6 months",
            "resources": [
                {"name": "Python Tutorial", "url": "https://www.python.org/doc/"},
                {"name": "JavaScript MDN", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript"}
            ]
        },
        {
            "step_number": 2,
            "title": "Develop Projects & Portfolio",
            "description": "Build real-world projects to showcase your skills",
            "skills": ["Git", "Version Control", "Project Management"],
            "certifications": [],
            "estimated_time": "2-4 months",
            "resources": [
                {"name": "GitHub", "url": "https://github.com"},
                {"name": "Project Ideas", "url": "https://github.com/karan/Projects"}
            ]
        },
        {
            "step_number": 3,
            "title": "Study Software Engineering",
            "description": "Learn software engineering principles, design patterns, and best practices",
            "skills": ["Software Architecture", "Design Patterns", "Testing"],
            "certifications": ["Software Engineering (edX)", "System Design (YouTube)"],
            "estimated_time": "2-3 months",
            "resources": [
                {"name": "Clean Code", "url": "https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882"}
            ]
        },
        {
            "step_number": 4,
            "title": "Build Professional Resume",
            "description": "Create an ATS-compliant resume highlighting your skills and projects",
            "skills": ["Resume Writing", "ATS Optimization"],
            "certifications": [],
            "estimated_time": "1-2 weeks",
            "resources": []
        }
    ],
    "Data Analysis": [
        {
            "step_number": 1,
            "title": "Learn Data Analysis Fundamentals",
            "description": "Master Excel, SQL, and basic statistics",
            "skills": ["Excel", "SQL", "Statistics"],
            "certifications": ["Google Data Analytics Certificate", "SQL for Data Science (Coursera)"],
            "estimated_time": "2-4 months",
            "resources": []
        },
        {
            "step_number": 2,
            "title": "Learn Python/R for Data Analysis",
            "description": "Use programming languages for advanced data manipulation",
            "skills": ["Python", "Pandas", "Data Visualization"],
            "certifications": ["Python for Data Science (edX)"],
            "estimated_time": "2-3 months",
            "resources": []
        },
        {
            "step_number": 3,
            "title": "Build Data Analysis Portfolio",
            "description": "Create projects analyzing real datasets",
            "skills": ["Data Visualization", "Storytelling"],
            "certifications": [],
            "estimated_time": "2-3 months",
            "resources": []
        }
    ]
}

@router.post("/create", response_model=RoadmapResponse)
def create_roadmap(
    roadmap_data: RoadmapCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get roadmap template for career path
    steps_data = ROADMAP_TEMPLATES.get(roadmap_data.career_path, [])
    
    if not steps_data:
        raise HTTPException(status_code=404, detail=f"No roadmap template found for {roadmap_data.career_path}")
    
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

