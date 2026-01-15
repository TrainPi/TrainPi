from app.database import SessionLocal
from app.models import User
import json

def check_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        user_list = []
        for user in users:
            user_list.append({
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name
            })
        print(json.dumps(user_list, indent=2))
    except Exception as e:
        print(f"Error querying database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_users()
