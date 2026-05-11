from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, CareerProfile, Roadmap, Resume, Lesson, UserProgress
from app.schemas import DashboardStats, ProgressUpdate
from app.auth import get_current_user, get_current_user_optional

router = APIRouter()


def _guest_stats() -> DashboardStats:
    """Default stats when browsing without login (bypass auth)."""
    return DashboardStats(
        career_path=None,
        roadmap_completion=0.0,
        skills_acquired=0,
        skills_required=10,
        courses_enrolled=0,
        courses_completed=0,
        lessons_in_progress=0,
        resume_score=None,
        last_resume_update=None,
        weekly_goals=[
            "Complete career discovery",
            "Set a weekly goal",
            "Start your first lesson",
        ],
        suggested_next_steps=[
            "Complete career discovery to find your path",
            "Set a weekly goal",
            "Start your first learning module",
        ],
        exceptions=[],
    )


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    if current_user is None:
        return _guest_stats()

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
    courses_enrolled = db.query(Lesson).filter(Lesson.user_id == current_user.id).count()

    progress_records = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.progress_type == "lesson",
    ).all()
    courses_completed = sum(1 for p in progress_records if p.completion_percentage >= 100)
    lessons_in_progress = sum(1 for p in progress_records if p.completion_percentage < 100)
    
    # Get resume info
    resume = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.created_at.desc()).first()
    resume_score = resume.resume_score if resume else None
    last_resume_update = resume.updated_at if resume else None
    
    # Dynamic weekly goals based on career path
    cyber_keywords = ['cyber', 'soc', 'security', 'analyst', 'iam', 'incident', 'it support', 'infosec']
    is_cyber = career_path and any(kw in career_path.lower() for kw in cyber_keywords)

    if is_cyber:
        if roadmap and roadmap.current_step == 0:
            weekly_goals = [
                "Complete the SOC Environment Orientation lesson",
                "Review how incident tickets are structured in a real SOC",
                "Practice describing what a Tier 1 analyst does on a typical shift",
            ]
        elif roadmap and roadmap.current_step == 1:
            weekly_goals = [
                "Walk through a phishing investigation scenario end-to-end",
                "Practice identifying indicators of compromise in a sample email",
                "Document a mock incident ticket for a phishing alert",
            ]
        elif roadmap and roadmap.current_step == 2:
            weekly_goals = [
                "Review MFA fatigue attack concepts and how analysts detect them",
                "Practice triaging a suspicious login alert — escalate or contain?",
                "Study the identity lifecycle: provisioning, de-provisioning, access reviews",
            ]
        elif roadmap and roadmap.current_step >= 3:
            weekly_goals = [
                f"Continue with step {roadmap.current_step + 1} of your {career_path} roadmap",
                "Practice an escalation decision scenario — when to escalate vs. handle at Tier 1",
                "Review your incident documentation for clarity and completeness",
            ]
        else:
            weekly_goals = [
                "Complete career discovery to find your cybersecurity path",
                "Review the SOC Analyst role overview",
                "Practice a phishing investigation scenario",
            ]
    elif career_path:
        weekly_goals = [
            f"Continue with step {(roadmap.current_step + 1) if roadmap else 1} of your {career_path} roadmap",
            "Update your resume with recently acquired skills",
            "Complete 2 lessons this week",
        ]
    else:
        weekly_goals = [
            "Complete career discovery to find your path",
            "Set a weekly learning goal",
            "Start your first learning module",
        ]
    
    # Get active exceptions
    exceptions = []
    if current_user.exceptions:
        for ex in current_user.exceptions:
            if ex.status == "exception":
                exceptions.append({
                    "id": ex.id,
                    "type": ex.type,
                    "status": ex.status,
                    "createdAt": ex.created_at,
                    "remarks": ex.remarks,
                    "duration": ex.duration
                })
    
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
    
    # Get current roadmap step details
    current_roadmap_step = None
    if roadmap and roadmap.steps:
        # Find the current step in the list
        idx = roadmap.current_step
        if idx < len(roadmap.steps):
            current_roadmap_step = roadmap.steps[idx]
        else:
            # If all steps completed, show last one or keep None
            current_roadmap_step = roadmap.steps[-1]

    return DashboardStats(
        career_path=career_path,
        roadmap_id=roadmap.id if roadmap else None,
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
        current_roadmap_step=current_roadmap_step,
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

