from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import SchoolDB, SchoolCreate, SchoolUpdate, SchoolResponse, UserDB, StudentDB, ClassDB
from auth_utils import get_password_hash
from routes.auth import get_current_user, require_admin_or_super, require_super_admin
from datetime import datetime

router = APIRouter(prefix="/schools", tags=["schools"])

@router.get("/", response_model=list[SchoolResponse])
def get_schools(db: Session = Depends(get_db), current_user=Depends(require_super_admin)):
    query = db.query(SchoolDB)
    if current_user.school_id is not None:
        query = query.filter(SchoolDB.id == current_user.school_id)
    return query.all()

@router.post("/", response_model=SchoolResponse)
def create_school(school: SchoolCreate, db: Session = Depends(get_db), current_user=Depends(require_super_admin)):
    existing = db.query(SchoolDB).filter(SchoolDB.code == school.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="School code already exists")
    db_school = SchoolDB(**school.model_dump(exclude={"super_admin_name", "super_admin_email", "super_admin_password"}), created_at=datetime.utcnow())
    db.add(db_school)
    db.commit()
    db.refresh(db_school)

    if school.super_admin_name and school.super_admin_email and school.super_admin_password:
        existing_admin = db.query(UserDB).filter(UserDB.email == school.super_admin_email).first()
        if existing_admin:
            raise HTTPException(status_code=400, detail="Super Admin email already exists")
        admin_user = UserDB(
            name=school.super_admin_name,
            email=school.super_admin_email,
            role="Super Admin",
            hashed_password=get_password_hash(school.super_admin_password),
            status="Active",
            school_id=db_school.id,
            created_at=datetime.utcnow()
        )
        db.add(admin_user)
        db.commit()

    return db_school

@router.get("/{school_id}", response_model=SchoolResponse)
def get_school(school_id: int, db: Session = Depends(get_db), current_user=Depends(require_super_admin)):
    school = db.query(SchoolDB).filter(SchoolDB.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    return school

@router.put("/{school_id}", response_model=SchoolResponse)
def update_school(school_id: int, updates: SchoolUpdate, db: Session = Depends(get_db), current_user=Depends(require_super_admin)):
    school = db.query(SchoolDB).filter(SchoolDB.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(school, key, value)
    db.commit()
    db.refresh(school)
    return school

@router.delete("/{school_id}")
def delete_school(school_id: int, db: Session = Depends(get_db), current_user=Depends(require_super_admin)):
    school = db.query(SchoolDB).filter(SchoolDB.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    if school.id == 1:
        raise HTTPException(status_code=400, detail="Cannot delete default school")
    db.delete(school)
    db.commit()
    return {"message": "School deleted"}

@router.get("/{school_id}/stats")
def get_school_stats(school_id: int, db: Session = Depends(get_db), current_user=Depends(require_super_admin)):
    school = db.query(SchoolDB).filter(SchoolDB.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    students = db.query(UserDB).filter(UserDB.school_id == school_id, UserDB.role == "Student", UserDB.status == "Active").count()
    teachers = db.query(UserDB).filter(UserDB.school_id == school_id, UserDB.role == "Teacher", UserDB.status == "Active").count()
    classes = db.query(ClassDB).filter(ClassDB.school_id == school_id).count()
    return {
        "school_id": school_id,
        "school_name": school.name,
        "students": students,
        "teachers": teachers,
        "classes": classes,
        "subscription": school.subscription_plan,
        "usage": {
            "students_percent": round((students / school.max_students * 100), 1) if school.max_students > 0 else 0,
            "teachers_percent": round((teachers / school.max_teachers * 100), 1) if school.max_teachers > 0 else 0,
        }
    }

@router.get("/my")
def get_my_school(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.school_id:
        school = db.query(SchoolDB).filter(SchoolDB.id == current_user.school_id).first()
        if school:
            return school
    return None
