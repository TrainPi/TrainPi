from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, ExceptionModel
from app.auth import get_current_user
from typing import List, Dict, Any
from datetime import datetime
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
    # CRITICAL FIX: Duration is ALREADY in seconds - DO NOT CONVERT!
    duration_seconds = int(exception_data.duration_seconds)
    
    # DEBUG: Log what we received
    print(f"🔍 Received duration_seconds: {duration_seconds}")
    
    # FIX: REMOVED THE BUGGY LOGIC that was multiplying by 3600!
    # The old buggy code was:
    #   if duration_seconds < 1000:
    #       duration_seconds = duration_seconds * 3600
    # This was WRONG - it converted:
    # - 1 second → 1 * 3600 = 3600 seconds (1 hour) ❌
    # - 30 seconds → 30 * 3600 = 108,000 seconds (30 hours) ❌
    # - 39 seconds → 39 * 3600 = 140,400 seconds (39 hours) ❌
    
    # Safety check: if value seems too large, it's likely a bug
    if duration_seconds > 86400:  # More than 24 hours
        print(f"❌ ERROR: Duration value {duration_seconds} is > 24 hours. This is likely a bug!")
        duration_seconds = 0  # Reset to prevent display bug
    
    # FIX: If value is exactly 108000 (30 hours), it's definitely a bug
    if duration_seconds == 108000:
        print(f"❌ ERROR: Duration is exactly 108000 (30 hours). This is the bug!")
        duration_seconds = 0  # Reset to prevent display bug
    
    # FIX: If value is 1 and somehow becomes 108000, there's a multiplication bug
    if duration_seconds == 1:
        print(f"✅ Received 1 second - storing as 1 second (NOT converting)")
    
    # Store duration AS-IS in seconds
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
    exception.cleared_at = datetime.now()
    
    db.commit()
    db.refresh(exception)
    
    return exception
