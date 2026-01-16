import sys
import os

# Add current directory to path so we can import app modules
sys.path.append(os.getcwd())

from app.database import engine, Base
# Import models to ensure they are registered with Base.metadata
from app.models import User, CareerProfile, Roadmap, Resume, Lesson, UserProgress, Certification

def reset_schema():
    print("Dropping all tables...")
    # reflect=True might be needed if we were inspecting, but for declared models drop_all works on what it knows.
    # If there are tables in DB not in models, they might stay? No, drop_all drops what is in metadata.
    # If we want to really clean clean, we might need more, but let's assume models cover the app tables.
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Database schema reset complete.")

if __name__ == "__main__":
    reset_schema()
