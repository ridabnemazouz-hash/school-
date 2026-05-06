from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import ClassCreate, ClassDB
from routes.auth import require_admin_or_super, get_current_user

router = APIRouter(prefix="/classes", tags=["classes"])

@router.get("/")
def get_classes(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    query = db.query(ClassDB)
    if current_user.school_id is not None:
        query = query.filter(ClassDB.school_id == current_user.school_id)
    classes = query.all()
    return [{
        "id": c.id,
        "name": c.name,
        "level": c.level,
        "grade": c.grade,
        "teacher": c.teacher,
        "capacity": c.capacity,
        "students": c.students_count
    } for c in classes]

@router.post("/")
def create_class(cls: ClassCreate, db: Session = Depends(get_db), current_user=Depends(require_admin_or_super)):
    db_class = ClassDB(
        name=cls.name,
        level=cls.level,
        grade=cls.grade,
        teacher=cls.teacher,
        capacity=cls.capacity,
        students_count=0,
        school_id=current_user.school_id or 1
    )
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return {
        "id": db_class.id,
        "name": db_class.name,
        "level": db_class.level,
        "grade": db_class.grade,
        "teacher": db_class.teacher,
        "capacity": db_class.capacity,
        "students": db_class.students_count
    }

@router.delete("/{class_id}")
def delete_class(class_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin_or_super)):
    query = db.query(ClassDB).filter(ClassDB.id == class_id)
    if current_user.school_id is not None:
        query = query.filter(ClassDB.school_id == current_user.school_id)
    cls = query.first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    db.delete(cls)
    db.commit()
    return {"message": "Class deleted successfully"}

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    query = db.query(ClassDB)
    if current_user.school_id is not None:
        query = query.filter(ClassDB.school_id == current_user.school_id)
    total = query.count()
    total_students = query.with_entities(ClassDB.students_count).all()
    total_students = sum(s[0] for s in total_students)
    total_capacity = query.with_entities(ClassDB.capacity).all()
    total_capacity = sum(c[0] for c in total_capacity)
    avg = round(total_students / total_capacity * 100, 1) if total_capacity > 0 else 0
    return {
        "totalClasses": total,
        "totalStudents": total_students,
        "totalCapacity": total_capacity,
        "avgOccupancy": avg
    }
