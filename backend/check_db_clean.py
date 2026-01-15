from sqlalchemy import create_engine, text
import sys

# Ensure we are looking at the right DB file
db_path = "sqlite:///./trainpi.db"

try:
    engine = create_engine(db_path)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT id, email, full_name, created_at FROM users"))
        users = result.fetchall()
        
    with open("db_users.txt", "w") as f:
        f.write("="*50 + "\n")
        f.write("  USERS IN SQLITE DATABASE (trainpi.db)\n")
        f.write("="*50 + "\n")
        
        if not users:
            f.write("  [!] No users found.\n")
        else:
            f.write(f"  {'ID':<5} | {'Email':<30} | {'Full Name'}\n")
            f.write("-" * 50 + "\n")
            for user in users:
                 # Handle potential None values for full_name
                full_name = user[2] if user[2] else "N/A"
                f.write(f"  {user[0]:<5} | {user[1]:<30} | {full_name}\n")
        
        f.write("="*50 + "\n")
    print("Output written to db_users.txt")

except Exception as e:
    print(f"Error: {e}")
