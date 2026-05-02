import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import StudentCreate, StudentDB, UserDB
from fastapi.responses import Response
from routes.auth import require_admin_or_super

router = APIRouter(prefix="/students", tags=["students"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads", "students")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024

@router.options("/stats")
def options_handler():
    return Response(status_code=200)

@router.post("/")
async def create_student(
    name: str = Form(...),
    grade: str = Form(...),
    student_class: str = Form(...),
    attendance: str = Form("100%"),
    gpa: str = Form("0.0"),
    date_of_birth: str = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_super)
):
    avatar_url = None
    if file and file.filename:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext in ALLOWED_EXTENSIONS:
            content = await file.read()
            if len(content) <= MAX_FILE_SIZE:
                filename = f"{uuid.uuid4().hex}{ext}"
                filepath = os.path.join(UPLOAD_DIR, filename)
                with open(filepath, "wb") as f:
                    f.write(content)
                avatar_url = f"/uploads/students/{filename}"

    db_student = StudentDB(
        name=name,
        grade=grade,
        student_class=student_class,
        attendance=attendance,
        gpa=gpa,
        date_of_birth=date_of_birth,
        avatar_url=avatar_url
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
        "gpa": db_student.gpa,
        "date_of_birth": db_student.date_of_birth,
        "avatar_url": db_student.avatar_url
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
            "gpa": s.gpa,
            "date_of_birth": s.date_of_birth,
            "avatar_url": s.avatar_url
        })
    return result

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total_students = db.query(UserDB).filter(UserDB.role == "Student", UserDB.status == "Active").count()
    total_teachers = db.query(UserDB).filter(UserDB.role == "Teacher", UserDB.status == "Active").count()
    unique_classes = db.query(StudentDB.student_class).distinct().count()
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

@router.get("/{student_id}")
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(StudentDB).filter(StudentDB.id == student_id).first()
    if not student:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Student not found")
    user = db.query(UserDB).filter(UserDB.name == student.name, UserDB.role == "Student").first()
    return {
        "id": student.id,
        "name": student.name,
        "grade": student.grade,
        "class": student.student_class,
        "attendance": student.attendance,
        "gpa": student.gpa,
        "date_of_birth": student.date_of_birth,
        "avatar_url": student.avatar_url,
        "email": user.email if user else None,
        "status": user.status if user else None,
        "created_at": user.created_at.strftime("%Y-%m-%d") if user and user.created_at else None,
    }
