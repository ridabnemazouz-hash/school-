from database import SessionLocal, engine, Base
from models import UserDB, ClassDB
from auth_utils import get_password_hash

Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    try:
        users = [
            {
                "name": "Super Admin",
                "email": "super@school.com",
                "password": "password",
                "role": "Super Admin",
                "status": "Active"
            },
            {
                "name": "Admin Test",
                "email": "admin@school.com",
                "password": "password",
                "role": "Admin",
                "status": "Active"
            },
            {
                "name": "Student Test",
                "email": "student@school.com",
                "password": "password",
                "role": "Student",
                "status": "Active"
            },
            {
                "name": "Teacher Test",
                "email": "teacher@school.com",
                "password": "password",
                "role": "Teacher",
                "status": "Active"
            },
            {
                "name": "Parent Test",
                "email": "parent@school.com",
                "password": "password",
                "role": "Parent",
                "status": "Active"
            }
        ]

        created = 0
        for u in users:
            existing = db.query(UserDB).filter(UserDB.email == u["email"]).first()
            if existing:
                print(f"Already exists: {u['email']}")
                continue

            db_user = UserDB(
                name=u["name"],
                email=u["email"],
                role=u["role"],
                status=u["status"],
                hashed_password=get_password_hash(u["password"])
            )
            db.add(db_user)
            created += 1
            print(f"Created: {u['role']} - {u['email']}")

        classes = [
            {"name": "A", "level": "primary", "grade": "1ère année", "teacher": "Mr. Alami", "capacity": 35},
            {"name": "B", "level": "primary", "grade": "3ème année", "teacher": "Mme. Fassi", "capacity": 30},
            {"name": "C", "level": "primary", "grade": "6ème année", "teacher": "Mr. Bennani", "capacity": 32},
            {"name": "1A", "level": "middle", "grade": "1ère année", "teacher": "Mme. Tazi", "capacity": 40},
            {"name": "2A", "level": "middle", "grade": "2ème année", "teacher": "Mr. Idrissi", "capacity": 38},
            {"name": "3A", "level": "middle", "grade": "3ème année", "teacher": "Mme. Chraibi", "capacity": 36},
            {"name": "TC1", "level": "high", "grade": "Tronc commun", "teacher": "Mr. El Amrani", "capacity": 42},
            {"name": "TC2", "level": "high", "grade": "Tronc commun", "teacher": "Mme. Berrada", "capacity": 40},
            {"name": "1Bac1", "level": "high", "grade": "1ère Bac", "teacher": "Mr. Slaoui", "capacity": 38},
            {"name": "2Bac1", "level": "high", "grade": "2ème Bac", "teacher": "Mme. Zniber", "capacity": 35},
        ]

        classes_created = 0
        for c in classes:
            existing = db.query(ClassDB).filter(
                ClassDB.name == c["name"],
                ClassDB.level == c["level"],
                ClassDB.grade == c["grade"]
            ).first()
            if existing:
                continue
            db_class = ClassDB(**c, students_count=0)
            db.add(db_class)
            classes_created += 1
            print(f"Created class: {c['level']} - {c['name']} ({c['grade']})")

        db.commit()
        print(f"\nDone! {created} new user(s) created, {classes_created} new class(es) seeded.")
        print("\nCredentials (password for all):")
        print("  super@school.com  - Super Admin")
        print("  admin@school.com  - Admin")
        print("  student@school.com - Student")
        print("  teacher@school.com - Teacher")
        print("  parent@school.com  - Parent")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
