from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
import os

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# Load environment variables first
load_dotenv()

from app.database import engine, Base
from app.routers import auth, users, career, roadmap, resume, lessons, dashboard, exceptions
import logging

logger = logging.getLogger(__name__)

# Create database tables (with error handling)
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.warning(f"Could not create database tables: {e}. Make sure PostgreSQL is running and DATABASE_URL is correct.")

app = FastAPI(title="TrainPi API", version="1.0.0")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Session Middleware (Required for OAuth)
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "super-secret-key"))

# CORS middleware
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(career.router, prefix="/api/career", tags=["career"])
app.include_router(roadmap.router, prefix="/api/roadmap", tags=["roadmap"])
app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
app.include_router(lessons.router, prefix="/api/lessons", tags=["lessons"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(exceptions.router, prefix="/api/exceptions", tags=["exceptions"])
from app.routers import ai_chat
app.include_router(ai_chat.router, prefix="/api/chat", tags=["chat"])

@app.get("/")
async def root():
    return {"message": "TrainPi API is running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

