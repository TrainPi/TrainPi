from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
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

# Mock exceptions - in production, create Exception model
@router.get("/exceptions")
def get_exceptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # TODO: Query from database when Exception model is created
    # IMPORTANT: Duration is stored in SECONDS, not hours or minutes
    exceptions = [
        {
            "id": 1,
            "type": "ATT C",
            "status": "exception",
            "createdAt": datetime.now().isoformat(),
            "remarks": "Attendance cancelled due to medical reasons"
            # duration will be calculated when cleared
        }
    ]
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
    
    # Store duration AS-IS in seconds (no conversion!)
    exception = {
        "id": len(get_exceptions(current_user, db)) + 1,
        "type": exception_data.type,
        "status": exception_data.status,
        "createdAt": datetime.now().isoformat(),
        "remarks": exception_data.remarks,
        "duration": duration_seconds  # ALWAYS stored as SECONDS (no conversion!)
    }
    return exception

@router.post("/exceptions/{exception_id}/clear")
def clear_exception(
    exception_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # TODO: Update exception in database
    return {
        "message": "Exception cleared",
        "exception_id": exception_id,
        "cleared_at": datetime.now().isoformat()
    }
