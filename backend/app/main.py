from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
import os

# Create uploads directory if it doesn't exist (skip on serverless e.g. Vercel)
try:
    os.makedirs("uploads", exist_ok=True)
except OSError:
    pass

# Load environment variables first
load_dotenv()

from app.database import engine, Base
from app import models  # noqa: F401 - register all models with Base before create_all
from app.routers import auth, users, career, roadmap, resume, lessons, dashboard, exceptions, credits, ai_features, catalog, video, workforce
import logging

logger = logging.getLogger(__name__)

try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.warning(f"⚠️ Could not initialize database: {e}")
    logger.warning("App will start anyway, but database operations will fail. Check DATABASE_URL env var.")

app = FastAPI(title="TrainPi API", version="1.0.0")

# CORS must be added FIRST so it runs as outermost middleware and adds headers to every response.
# Always include known local/production domains, then merge any env-provided origins.
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://www.trainpi.net",
    "https://trainpi.net",
    "https://trainpi.vercel.app",
    "https://train-pi-h9bu.vercel.app",
    "https://train-8gna08pyd-runboys.vercel.app",
]

_origins_env = os.getenv("CORS_ORIGINS", "").strip()
if _origins_env:
    for origin in [o.strip().rstrip("/") for o in _origins_env.split(",") if o.strip()]:
        if origin not in origins:
            origins.append(origin)

_frontend = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
if _frontend and _frontend not in origins:
    origins.append(_frontend)

logger.info(f"CORS origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Session Middleware (Required for OAuth)
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "super-secret-key"))

# Mount uploads only if directory exists (e.g. not on Vercel serverless)
if os.path.isdir("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(career.router, prefix="/api/career", tags=["career"])
app.include_router(roadmap.router, prefix="/api/roadmap", tags=["roadmap"])
app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
app.include_router(lessons.router, prefix="/api/lessons", tags=["lessons"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(exceptions.router, prefix="/api/exceptions", tags=["exceptions"])
app.include_router(credits.router, prefix="/api/credits", tags=["credits"])
app.include_router(ai_features.router, prefix="/api/ai", tags=["ai-features"])
app.include_router(catalog.router, prefix="/api/catalog", tags=["catalog"])
app.include_router(video.router, prefix="/api/video", tags=["video"])
app.include_router(workforce.router, prefix="/api/workforce", tags=["workforce"])
from app.routers import ai_chat
app.include_router(ai_chat.router, prefix="/api/chat", tags=["chat"])

@app.get("/")
async def root():
    return {"message": "TrainPi API is running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "cors": "enabled"}

@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """Handle OPTIONS requests for CORS preflight"""
    return {"message": "OK"}



