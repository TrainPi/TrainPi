from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, Token, UserResponse, UserUpdate
from app.auth import verify_password, get_password_hash, create_access_token, get_current_user as get_current_user_auth, oauth
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
import secrets
import os

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
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
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

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

@router.get("/login/github")
async def login_github(request: Request):
    redirect_uri = request.url_for('auth_github')
    return await oauth.github.authorize_redirect(request, redirect_uri)

@router.get("/auth/github")
async def auth_github(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.github.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    resp = await oauth.github.get('user', token=token)
    user_info = resp.json()
    # GitHub email might be private, need to fetch separately if not in profile
    if not user_info.get('email'):
        emails_resp = await oauth.github.get('user/emails', token=token)
        emails = emails_resp.json()
        primary_email = next((e['email'] for e in emails if e['primary']), None)
        user_info['email'] = primary_email

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
