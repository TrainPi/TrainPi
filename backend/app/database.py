from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / '.env'
load_dotenv(dotenv_path=env_path)

# Local pgAdmin default: user=postgres, password=opium, database=trainpi
# Supabase: use the "Connection string" from Project Settings → Database (URI mode, include password)
_raw_url = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:opium@localhost:5432/trainpi",
)

# Supabase and other cloud Postgres require SSL; ensure URL is postgresql:// and has sslmode if needed
if _raw_url.startswith("postgres://"):
    _raw_url = "postgresql://" + _raw_url.split("://", 1)[-1]
if "supabase" in _raw_url.lower() and "sslmode" not in _raw_url:
    _raw_url += "?sslmode=require" if "?" not in _raw_url else "&sslmode=require"

DATABASE_URL = _raw_url

# Supabase/cloud: use connect_args for SSL if sslmode=require still fails
_connect_args = {}
if "sslmode=require" in DATABASE_URL or os.getenv("DATABASE_SSL") == "true":
    _connect_args["sslmode"] = "require"

engine = create_engine(
    DATABASE_URL,
    connect_args=_connect_args,
    pool_pre_ping=True,  # verify connections before use (helps with Supabase pooler)
    pool_size=5,
    max_overflow=10,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
