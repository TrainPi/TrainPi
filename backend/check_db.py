from sqlalchemy import create_engine, text
from app.database import Base
import os

# Ensure we are looking at the right DB file
db_path = "sqlite:///./trainpi.db"
print(f"Connecting to: {db_path}")

try:
    engine = create_engine(db_path)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT * FROM users"))
        users = result.fetchall()
        
        print("\n--- Users in Database ---")
        if not users:
            print("No users found in the database.")
        else:
            for user in users:
                print(user)
        print("-------------------------\n")
        
        # Also check if tables exist
        result_tables = connection.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
        tables = result_tables.fetchall()
        print("Tables found:", [t[0] for t in tables])

except Exception as e:
    print(f"Error connecting to database: {e}")
