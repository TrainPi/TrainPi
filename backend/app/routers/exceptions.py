from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, ExceptionModel
from app.auth import get_current_user
from datetime import datetime, timezone
from pydantic import BaseModel

router = APIRouter()

class ExceptionCreate(BaseModel):
    type: str
    status: str = "exception"
    remarks: str = ""
    duration_seconds: int = 0  # Duration in seconds

# Real exceptions from DB
@router.get("/exceptions")
def get_exceptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exceptions = db.query(ExceptionModel).filter(
        ExceptionModel.user_id == current_user.id
    ).order_by(ExceptionModel.created_at.desc()).all()
    
    return exceptions

@router.post("/exceptions")
def create_exception(
    exception_data: ExceptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    duration_seconds = int(exception_data.duration_seconds)

    if duration_seconds > 86400:
        duration_seconds = 0
    exception = ExceptionModel(
        user_id=current_user.id,
        type=exception_data.type,
        status=exception_data.status,
        remarks=exception_data.remarks,
        duration=duration_seconds
    )
    
    db.add(exception)
    db.commit()
    db.refresh(exception)
    
    return exception

@router.post("/exceptions/{exception_id}/clear")
def clear_exception(
    exception_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exception = db.query(ExceptionModel).filter(
        ExceptionModel.id == exception_id,
        ExceptionModel.user_id == current_user.id
    ).first()
    
    if not exception:
        raise HTTPException(status_code=404, detail="Exception not found")
        
    exception.status = "cleared"
    exception.cleared_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(exception)
    
    return exception
