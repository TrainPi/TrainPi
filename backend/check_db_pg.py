from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Load env vars to get the URL
load_dotenv()

database_url = os.getenv("DATABASE_URL")
print(f"Testing connection to: {database_url}")

try:
    # We need to ensure we use the postgresql driver
    if not database_url or "sqlite" in database_url:
        print("Error: DATABASE_URL is not set to PostgreSQL in .env")
        exit(1)

    engine = create_engine(database_url)
    
    with engine.connect() as connection:
        print("Connection successful!")
        
        # Check if users table exists
        result_tables = connection.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        tables = [row[0] for row in result_tables.fetchall()]
        print(f"Tables found: {tables}")
        
        if 'users' in tables:
            result = connection.execute(text("SELECT id, email, full_name, created_at FROM users"))
            users = result.fetchall()
            
            with open("db_users_pg.txt", "w") as f:
                f.write("="*50 + "\n")
                f.write(f"  USERS IN POSTGRES DATABASE ({database_url})\n")
                f.write("="*50 + "\n")
                
                if not users:
                    f.write("  [!] No users found in the 'users' table.\n")
                else:
                    f.write(f"  {'ID':<5} | {'Email':<30} | {'Full Name'}\n")
                    f.write("-" * 50 + "\n")
                    for user in users:
                        full_name = user[2] if user[2] else "N/A"
                        f.write(f"  {user[0]:<5} | {user[1]:<30} | {full_name}\n")
                f.write("="*50 + "\n")
            print("Output written to db_users_pg.txt")
        else:
            print("  [!] 'users' table DOES NOT EXIST yet.")

except Exception as e:
    print("\n" + "!"*50)
    print("CONNECTION FAILED")
    print(f"Error: {e}")
    print("!"*50)
    print("Please check your password in backend/.env")
