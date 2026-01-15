import sqlite3
import psycopg2
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Load Postgres config
load_dotenv()
pg_url = os.getenv("DATABASE_URL")

# SQLite Path
sqlite_path = "./trainpi.db"

print(f"Migrating from {sqlite_path} to {pg_url}")

try:
    # 1. Read from SQLite
    if not os.path.exists(sqlite_path):
        print("SQLite database not found.")
        exit(1)

    conn_sqlite = sqlite3.connect(sqlite_path)
    cursor_sqlite = conn_sqlite.cursor()
    
    cursor_sqlite.execute("SELECT email, hashed_password, full_name, is_active, created_at FROM users")
    sqlite_users = cursor_sqlite.fetchall()
    
    print(f"Found {len(sqlite_users)} users in SQLite.")
    
    # 2. Write to Postgres
    engine = create_engine(pg_url)
    
    # 2. Write to Postgres using psycopg2
    conn_pg = psycopg2.connect(pg_url)
    cursor_pg = conn_pg.cursor()
    
    migrated_count = 0
    for u in sqlite_users:
        email, pwd, name, active, created = u
        
        # Check for existing
        cursor_pg.execute("SELECT id FROM users WHERE email = %s", (email,))
        exists = cursor_pg.fetchone()
        
        if exists:
            print(f"Skipping {email} (already exists in Postgres).")
        else:
            print(f"Migrating {email}...")
            cursor_pg.execute("""
                INSERT INTO users (email, hashed_password, full_name, is_active, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s::timestamp, NOW())
            """, (email, pwd, name, bool(active), created))
            migrated_count += 1
            print(f"Successfully migrated {email}")

    conn_pg.commit()
    conn_pg.close()
    conn_sqlite.close()

    print(f"Migration complete! Moved {migrated_count} users.")

except Exception as e:
    print(f"Migration failed: {e}")
