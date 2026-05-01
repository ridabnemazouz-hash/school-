from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import StudentCreate, StudentDB, UserDB
from fastapi.responses import Response

router = APIRouter(prefix="/students", tags=["students"])

@router.options("/stats")
def options_handler():
    return Response(status_code=200)

@router.post("/")
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    db_student = StudentDB(
        name=student.name,
        grade=student.grade,
        student_class=student.student_class,
        attendance=student.attendance,
        gpa=student.gpa
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    
    return {
        "id": db_student.id,
        "name": db_student.name,
        "grade": db_student.grade,
        "class": db_student.student_class,
        "attendance": db_student.attendance,
        "gpa": db_student.gpa
    }

@router.get("/")
def get_students(db: Session = Depends(get_db)):
    students = db.query(StudentDB).all()
    result = []
    for s in students:
        result.append({
            "id": s.id,
            "name": s.name,
            "grade": s.grade,
            "class": s.student_class,
            "attendance": s.attendance,
            "gpa": s.gpa
        })
    return result

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    # Count students from users table
    total_students = db.query(UserDB).filter(UserDB.role == "Student", UserDB.status == "Active").count()
    
    # Count teachers from users table
    total_teachers = db.query(UserDB).filter(UserDB.role == "Teacher", UserDB.status == "Active").count()
    
    # Count unique classes from students table
    unique_classes = db.query(StudentDB.student_class).distinct().count()
    
    # Calculate average attendance from students table
    students = db.query(StudentDB).all()
    if students:
        avg_attendance = sum(int(s.attendance.replace('%', '')) for s in students if s.attendance) / len(students)
    else:
        avg_attendance = 0
    
    return {
        "totalStudents": total_students,
        "totalTeachers": total_teachers,
        "totalClasses": unique_classes,
        "averageAttendance": round(avg_attendance, 1)
    }
