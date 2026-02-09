from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, PasswordResetToken
from app.schemas import UserCreate, Token, UserResponse, UserUpdate, ForgotPasswordRequest, ResetPasswordRequest
from app.auth import verify_password, get_password_hash, create_access_token, get_current_user as get_current_user_auth, oauth
from datetime import timedelta, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
import secrets
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        # Check if user exists
        db_user = db.query(User).filter(User.email == user.email).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        hashed_password = get_password_hash(user.password)
        db_user = User(
            email=user.email,
            hashed_password=hashed_password,
            full_name=user.full_name,
            credits=100,  # Explicitly set initial credits
            is_active=True  # Explicitly set active status
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Registration error for email {user.email}: {str(e)}", exc_info=True)
        # Always return detailed error for debugging (remove in production)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not getattr(user, "is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# --- Forgot / Reset Password ---

RESET_TOKEN_EXPIRE_HOURS = 24

@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        return {"message": "If an account exists with this email, you will receive a reset link."}
    token_str = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)
    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token_str,
        expires_at=expires_at,
    )
    db.add(reset_token)
    db.commit()
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    reset_link = f"{frontend_url}/reset-password?token={token_str}"
    if os.getenv("SMTP_HOST"):
        try:
            _send_reset_email(user.email, reset_link)
        except Exception:
            pass
    return {"message": "If an account exists with this email, you will receive a reset link.", "reset_link": reset_link}


def _send_reset_email(to_email: str, reset_link: str):
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "TrainPi – Reset your password"
    msg["From"] = os.getenv("SMTP_FROM", "noreply@trainpi.com")
    msg["To"] = to_email
    html = f"<p>Click the link below to reset your password (valid 24 hours):</p><p><a href=\"{reset_link}\">{reset_link}</a></p>"
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP(os.getenv("SMTP_HOST"), int(os.getenv("SMTP_PORT", "587"))) as server:
        server.starttls()
        server.login(os.getenv("SMTP_USER", ""), os.getenv("SMTP_PASSWORD", ""))
        server.sendmail(msg["From"], to_email, msg.as_string())


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(body.new_password.encode("utf-8")) > 72:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password cannot be longer than 72 characters")
    record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == body.token,
        PasswordResetToken.used_at.is_(None),
    ).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset link")
    if record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset link has expired")
    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset link")
    user.hashed_password = get_password_hash(body.new_password)
    record.used_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Password has been reset. You can now sign in with your new password."}

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user_auth)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_profile(
    user_update: UserUpdate, 
    current_user: User = Depends(get_current_user_auth),
    db: Session = Depends(get_db)
):
    # Update fields if provided
    for field, value in user_update.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

from fastapi import UploadFile, File
import shutil
import os
from uuid import uuid4

@router.post("/upload-avatar")
def upload_avatar(file: UploadFile = File(...)):
    # Create avatars directory if not exists
    os.makedirs("uploads/avatars", exist_ok=True)
    
    # Generate unique filename
    ext = file.filename.split(".")[-1]
    filename = f"{uuid4()}.{ext}"
    file_path = f"uploads/avatars/{filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"/uploads/avatars/{filename}"}

# --- OAuth Routes ---

@router.get("/login/google")
async def login_google(request: Request):
    redirect_uri = request.url_for('auth_google')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/auth/google")
async def auth_google(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        # If token exchange fails
        raise HTTPException(status_code=400, detail=str(e))
        
    user_info = token.get('userinfo')
    if not user_info:
        # Fallback if userinfo not in token (depends on scope)
        user_info = await oauth.google.userinfo(token=token)
        
    return await process_oauth_login(user_info, db)

async def process_oauth_login(user_info: dict, db: Session):
    email = user_info.get('email')
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by OAuth provider")
        
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Create new user
        password = secrets.token_urlsafe(16)
        hashed_password = get_password_hash(password)
        new_user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=user_info.get('name') or user_info.get('login'),
            is_active=True,
            # Could populate bio/avatar here too
            profile_image=user_info.get('picture') or user_info.get('avatar_url')
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user = new_user
        
    # Create JWT
    access_token_expires = timedelta(minutes=60) # Longer validity for OAuth
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    # Redirect to Frontend
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    return RedirectResponse(f"{frontend_url}/auth/callback?token={access_token}&user_id={user.id}")
