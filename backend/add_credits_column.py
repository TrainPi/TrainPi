"""
One-time script: add 'credits' column to users and create credit_transactions table.
Run from backend dir: python add_credits_column.py
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

def run():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 100"))
            conn.commit()
            print("Added credits column to users.")
        except Exception as e:
            conn.rollback()
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                print("Column credits already exists.")
            else:
                raise
        conn.execute(text("UPDATE users SET credits = 100 WHERE credits IS NULL"))
        conn.commit()
        print("Ensured default credits for existing users.")

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN gemini_api_key VARCHAR NULL"))
            conn.commit()
            print("Added gemini_api_key column to users.")
        except Exception as e2:
            conn.rollback()
            if "already exists" in str(e2).lower() or "duplicate" in str(e2).lower():
                print("Column gemini_api_key already exists.")
            else:
                raise

    # credit_transactions table is created by Base.metadata.create_all when app starts
    from app.database import Base
    from app import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    print("Ensured credit_transactions table exists.")

if __name__ == "__main__":
    run()
