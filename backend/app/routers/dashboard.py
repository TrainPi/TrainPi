from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, CareerProfile, Roadmap, Resume, Lesson, UserProgress
from app.schemas import DashboardStats, ProgressUpdate
from app.auth import get_current_user
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get career path
    profile = db.query(CareerProfile).filter(
        CareerProfile.user_id == current_user.id
    ).order_by(CareerProfile.created_at.desc()).first()
    career_path = profile.career_path if profile else None
    
    # Get roadmap completion
    roadmap = db.query(Roadmap).filter(
        Roadmap.user_id == current_user.id
    ).order_by(Roadmap.created_at.desc()).first()
    roadmap_completion = roadmap.completion_percentage if roadmap else 0.0
    
    # Get skills info (mock - in production, calculate from roadmap)
    skills_acquired = len(profile.skills) if profile and profile.skills else 0
    skills_required = 10  # Mock value
    
    # Get courses/lessons
    lessons = db.query(Lesson).filter(Lesson.user_id == current_user.id).all()
    courses_enrolled = len(lessons)
    courses_completed = len([l for l in lessons if True])  # Mock - check progress
    
    # Get lessons in progress
    progress_records = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.progress_type == "lesson",
        UserProgress.completion_percentage < 100
    ).all()
    lessons_in_progress = len(progress_records)
    
    # Get resume info
    resume = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.created_at.desc()).first()
    resume_score = resume.resume_score if resume else None
    last_resume_update = resume.updated_at if resume else None
    
    # Weekly goals (mock)
    weekly_goals = [
        "Complete Module 1 of Software Development roadmap",
        "Update resume with new skills",
        "Complete 2 micro-lessons"
    ]
    
    # Get active exceptions
    # TODO: Query exceptions from database when exception model is added
    exceptions = []  # Mock for now
    
    # Suggested next steps
    suggested_next_steps = []
    if not career_path:
        suggested_next_steps.append("Complete career discovery to find your path")
    if roadmap and roadmap.completion_percentage < 50:
        suggested_next_steps.append(f"Continue with step {roadmap.current_step + 1} of your roadmap")
    if not resume or resume.resume_score < 70:
        suggested_next_steps.append("Improve your resume score")
    if courses_enrolled == 0:
        suggested_next_steps.append("Start your first learning module")
    
    return DashboardStats(
        career_path=career_path,
        roadmap_completion=roadmap_completion,
        skills_acquired=skills_acquired,
        skills_required=skills_required,
        courses_enrolled=courses_enrolled,
        courses_completed=courses_completed,
        lessons_in_progress=lessons_in_progress,
        resume_score=resume_score,
        last_resume_update=last_resume_update,
        weekly_goals=weekly_goals,
        suggested_next_steps=suggested_next_steps,
        exceptions=exceptions
    )

@router.post("/progress", response_model=dict)
def update_progress(
    progress_data: ProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Create or update progress record
    progress = UserProgress(
        user_id=current_user.id,
        lesson_id=progress_data.lesson_id,
        roadmap_id=progress_data.roadmap_id,
        progress_type=progress_data.progress_type,
        completion_percentage=progress_data.completion_percentage,
        time_spent=progress_data.time_spent_minutes
    )
    
    if progress_data.quiz_score:
        progress.quiz_scores = [progress_data.quiz_score]
    
    db.add(progress)
    db.commit()
    db.refresh(progress)
    
    return {"message": "Progress updated", "progress_id": progress.id}

