"""
Verify database connection and that all expected tables exist.
Run from backend dir: python verify_db.py
"""
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent))
os.chdir(Path(__file__).resolve().parent)

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, text
from app.database import DATABASE_URL

EXPECTED_TABLES = [
    "users",
    "password_reset_tokens",
    "career_profiles",
    "roadmaps",
    "resumes",
    "lessons",
    "user_progress",
    "exceptions",
    "certifications",
]

def main():
    print("DATABASE_URL:", DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else "(hidden)")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            r = conn.execute(text(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
            ))
            tables = [row[0] for row in r.fetchall()]
            print("Tables in DB:", tables)
            missing = [t for t in EXPECTED_TABLES if t not in tables]
            if missing:
                print("MISSING tables:", missing)
                return 1
            print("OK: All expected tables exist.")
            return 0
    except Exception as e:
        print("ERROR:", e)
        return 1

if __name__ == "__main__":
    sys.exit(main())
