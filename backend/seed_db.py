from database import SessionLocal, engine, Base
from models import UserDB
from auth_utils import get_password_hash

# Make sure tables are created
Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    
    try:
        # Check if Super Admin exists
        existing = db.query(UserDB).filter(UserDB.email == "super@school.com").first()
        if existing:
            print("Super Admin already exists!")
            return

        # Create Super Admin
        hashed_password = get_password_hash("password")
        super_admin = UserDB(
            name="Super Admin",
            email="super@school.com",
            role="Super Admin",
            status="Active",
            hashed_password=hashed_password
        )
        
        db.add(super_admin)
        db.commit()
        print("Super Admin created successfully!")
        print("Email: super@school.com")
        print("Password: password")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
