from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, CourseEnrollment
from app.auth import get_current_user
from typing import List

router = APIRouter()


@router.get("/enrollments")
def get_enrollments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(CourseEnrollment).filter(CourseEnrollment.user_id == current_user.id).all()
    return [
        {
            "course_id": r.course_id,
            "completed_units": r.completed_units or [],
            "completed": r.completed,
            "enrolled_at": r.enrolled_at,
        }
        for r in rows
    ]


@router.post("/enroll/{course_id}")
def enroll(course_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(CourseEnrollment).filter(
        CourseEnrollment.user_id == current_user.id,
        CourseEnrollment.course_id == course_id,
    ).first()
    if existing:
        return {"course_id": course_id, "completed_units": existing.completed_units or [], "completed": existing.completed}
    enrollment = CourseEnrollment(user_id=current_user.id, course_id=course_id, completed_units=[])
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return {"course_id": course_id, "completed_units": [], "completed": False}


@router.post("/complete-unit/{course_id}/{unit_index}")
def complete_unit(
    course_id: str,
    unit_index: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    enrollment = db.query(CourseEnrollment).filter(
        CourseEnrollment.user_id == current_user.id,
        CourseEnrollment.course_id == course_id,
    ).first()
    if not enrollment:
        enrollment = CourseEnrollment(user_id=current_user.id, course_id=course_id, completed_units=[])
        db.add(enrollment)

    done = list(enrollment.completed_units or [])
    if unit_index not in done:
        done.append(unit_index)
    enrollment.completed_units = done
    db.commit()
    db.refresh(enrollment)
    return {"course_id": course_id, "completed_units": enrollment.completed_units, "completed": enrollment.completed}


@router.get("/stats")
def catalog_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return how many catalog courses the user has completed — used for job readiness."""
    rows = db.query(CourseEnrollment).filter(
        CourseEnrollment.user_id == current_user.id,
        CourseEnrollment.completed == True,
    ).all()
    return {"completed_courses": len(rows)}
