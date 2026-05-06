import json
from sqlalchemy.orm import Session
from models import StudentDB, UserDB, ActivityEvent
from auth_utils import get_password_hash
from security_utils import enforce_school_scope
import datetime

class StudentService:
    @staticmethod
    def get_all_students(db: Session, user: UserDB):
        query = db.query(StudentDB)
        query = enforce_school_scope(query, StudentDB, user)
        return query.all()

    @staticmethod
    def create_student(db: Session, student_data: dict, current_user: UserDB):
        # 1. Create Student Profile
        db_student = StudentDB(
            name=student_data['name'],
            grade=student_data['grade'],
            student_class=student_data['student_class'],
            attendance=student_data.get('attendance', '100%'),
            gpa=student_data.get('gpa', '0.0'),
            date_of_birth=student_data.get('date_of_birth'),
            avatar_url=student_data.get('avatar_url'),
            school_id=current_user.school_id or 1
        )
        db.add(db_student)
        db.commit()
        db.refresh(db_student)

        # 2. Create User Account
        user_exists = db.query(UserDB).filter(UserDB.email == f"{db_student.name.lower().replace(' ', '.')}@school.com").first()
        if not user_exists:
            user_db = UserDB(
                name=db_student.name,
                email=f"{db_student.name.lower().replace(' ', '.')}@school.com",
                role="Student",
                hashed_password=get_password_hash(db_student.name + "123"),
                status="Active",
                school_id=db_student.school_id
            )
            db.add(user_db)
            db.commit()
            db.refresh(user_db)
            db_student.user_id = user_db.id
            db.commit()

        # 3. Log Activity
        activity = ActivityEvent(
            event_type="student_created",
            entity_type="student",
            entity_id=db_student.id,
            school_id=db_student.school_id,
            user_email=current_user.email,
            details=f"Student {db_student.name} created",
            after_data=json.dumps({
                "name": db_student.name,
                "class": db_student.student_class,
                "grade": db_student.grade
            })
        )
        db.add(activity)
        db.commit()

        return db_student
