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

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Fallback to hardcoded string for debugging or raise clear error
    # Trying hardcoded first to confirm if env is the only issue.
    # But wait, hardcoding credentials in git is bad. I'll just raise a better error.
    # Actually, the user has the password in the .env snippet viewed earlier: "postgresql://postgres:opium@localhost:5432/trainpi"
    # I will print the path I tried to load.
    print(f"DEBUG: Attempted to load .env from {env_path}")
    print(f"DEBUG: DATABASE_URL is {DATABASE_URL}")
    raise ValueError(f"DATABASE_URL is not set. Checked {env_path}")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
