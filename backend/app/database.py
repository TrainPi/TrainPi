from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / '.env'
load_dotenv(dotenv_path=env_path)

# Get DATABASE_URL from environment - MUST be set on Vercel via project settings
_raw_url = os.getenv("DATABASE_URL", "").strip()

if not _raw_url:
    # On Vercel, DATABASE_URL will be empty if not configured in project settings
    logger.error("❌ CRITICAL: DATABASE_URL environment variable is not set!")
    logger.error("On Vercel: Go to Project Settings > Environment Variables > Add DATABASE_URL")
    logger.error("Format: postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require")
    # Still create engine to avoid crashing at import time - it will fail at first use
    _raw_url = "postgresql://localhost/dummy"
else:
    # Handle postgres:// vs postgresql://
    if _raw_url.startswith("postgres://"):
        _raw_url = "postgresql://" + _raw_url.split("://", 1)[-1]
    # Supabase requires SSL
    if "supabase" in _raw_url.lower() and "sslmode" not in _raw_url:
        _raw_url += "?sslmode=require" if "?" not in _raw_url else "&sslmode=require"
    logger.info(f"DATABASE_URL configured: {_raw_url.split('@')[0]}@[hidden]")

DATABASE_URL = _raw_url

# Connection args for SSL
_connect_args = {}
if "sslmode=require" in DATABASE_URL or os.getenv("DATABASE_SSL") == "true":
    _connect_args["sslmode"] = "require"

# Create engine - this is lazy, won't actually connect until first use
engine = create_engine(
    DATABASE_URL,
    connect_args=_connect_args,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=False,  # Set to True for SQL debugging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
