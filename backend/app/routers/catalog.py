from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db, engine, Base
from app.models import User, CourseEnrollment
from app.auth import get_current_user

router = APIRouter()


def _ensure_table():
    """Create course_enrollments table if it doesn't exist yet."""
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        pass


@router.get("/enrollments")
def get_enrollments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _ensure_table()
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
    _ensure_table()
    try:
        existing = db.query(CourseEnrollment).filter(
            CourseEnrollment.user_id == current_user.id,
            CourseEnrollment.course_id == course_id,
        ).first()
        if existing:
            return {
                "course_id": course_id,
                "completed_units": existing.completed_units or [],
                "completed": existing.completed,
            }
        enrollment = CourseEnrollment(
            user_id=current_user.id,
            course_id=course_id,
            completed_units=[],
        )
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)
        return {"course_id": course_id, "completed_units": [], "completed": False}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Enrollment failed: {str(e)}")


@router.post("/complete-unit/{course_id}/{unit_index}")
def complete_unit(
    course_id: str,
    unit_index: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_table()
    try:
        enrollment = db.query(CourseEnrollment).filter(
            CourseEnrollment.user_id == current_user.id,
            CourseEnrollment.course_id == course_id,
        ).first()
        if not enrollment:
            enrollment = CourseEnrollment(
                user_id=current_user.id,
                course_id=course_id,
                completed_units=[],
            )
            db.add(enrollment)

        done = list(enrollment.completed_units or [])
        if unit_index not in done:
            done.append(unit_index)
        enrollment.completed_units = done
        db.commit()
        db.refresh(enrollment)
        return {
            "course_id": course_id,
            "completed_units": enrollment.completed_units,
            "completed": enrollment.completed,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save progress: {str(e)}")


@router.get("/stats")
def catalog_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _ensure_table()
    rows = db.query(CourseEnrollment).filter(
        CourseEnrollment.user_id == current_user.id,
        CourseEnrollment.completed == True,
    ).all()
    return {"completed_courses": len(rows)}
