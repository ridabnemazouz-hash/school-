from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import UserDB
from auth_utils import get_password_hash
import datetime

def init():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if platform owner exists
    owner = db.query(UserDB).filter(UserDB.email == "dev@edusaas.com").first()
    if not owner:
        print("Creating Platform Owner...")
        hashed_password = get_password_hash("dev123")
        new_owner = UserDB(
            name="Platform Owner",
            email="dev@edusaas.com",
            hashed_password=hashed_password,
            role="Owner",
            status="Active",
            is_platform_owner=True,
            created_at=datetime.datetime.utcnow()
        )
        db.add(new_owner)
        db.commit()
        print("Platform Owner created: dev@edusaas.com / dev123")

    # Check if super admin exists
    admin = db.query(UserDB).filter(UserDB.email == "admin@school.com").first()
    if not admin:
        print("Creating default super admin...")
        hashed_password = get_password_hash("admin123")
        new_admin = UserDB(
            name="Super Admin",
            email="admin@school.com",
            hashed_password=hashed_password,
            role="Super Admin",
            status="Active",
            created_at=datetime.datetime.utcnow(),
            school_id=1
        )
        db.add(new_admin)
        db.commit()
        print("Super admin created: admin@school.com / admin123")
    else:
        print("Super admin already exists.")
    db.close()

if __name__ == "__main__":
    init()
