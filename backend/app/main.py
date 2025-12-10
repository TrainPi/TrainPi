from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
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

@app.get("/")
async def root():
    return {"message": "TrainPi API is running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

