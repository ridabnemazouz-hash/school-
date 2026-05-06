import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import StudentCreate, StudentDB, UserDB
from auth_utils import get_password_hash
from routes.auth import require_admin_or_super, get_current_user
from services.student_service import StudentService
from security_utils import enforce_school_scope
from fastapi.responses import Response

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

    student_data = {
        "name": name,
        "grade": grade,
        "student_class": student_class,
        "attendance": attendance,
        "gpa": gpa,
        "date_of_birth": date_of_birth,
        "avatar_url": avatar_url
    }
    
    db_student = StudentService.create_student(db, student_data, current_user)
    
    return db_student

@router.get("/")
def get_students(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    students = StudentService.get_all_students(db, current_user)
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
def get_stats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    user_query = db.query(UserDB).filter(UserDB.status == "Active")
    if current_user.school_id is not None:
        user_query = user_query.filter(UserDB.school_id == current_user.school_id)
    total_students = user_query.filter(UserDB.role == "Student").count()
    total_teachers = user_query.filter(UserDB.role == "Teacher").count()
    
    student_query = db.query(StudentDB)
    if current_user.school_id is not None:
        student_query = student_query.filter(StudentDB.school_id == current_user.school_id)
    unique_classes = student_query.with_entities(StudentDB.student_class).distinct().count()
    students = student_query.all()
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
def get_student(student_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    query = db.query(StudentDB).filter(StudentDB.id == student_id)
    if current_user.school_id is not None:
        query = query.filter(StudentDB.school_id == current_user.school_id)
    student = query.first()
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
