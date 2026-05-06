from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import get_db
from models import (
    SchoolDB, SchoolCreate, SchoolUpdate, SchoolResponse, UserDB, StudentDB, ClassDB,
    NoteDB, PaymentDB, TeacherClassDB, ScheduleEntryDB, ContentDB, ExpenseDB, 
    SalaryDB, VideoRoomDB, SecurityLogDB, MessageDB, BillingMetric, SubjectDB,
    SubscriptionDB, ActivityEvent, ReportRecord
)
from auth_utils import get_password_hash
from routes.auth import get_current_user, require_admin_or_super, require_super_admin, require_owner
from datetime import datetime

router = APIRouter(prefix="/schools", tags=["schools"])

@router.get("/", response_model=list[SchoolResponse])
def get_schools(db: Session = Depends(get_db), current_user=Depends(require_owner)):
    query = db.query(SchoolDB)
    return query.all()

@router.post("/")
def create_school(school: SchoolCreate, db: Session = Depends(get_db), current_user=Depends(require_owner)):
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

        return JSONResponse(content={
            "id": db_school.id,
            "name": db_school.name,
            "code": db_school.code,
            "address": db_school.address,
            "phone": db_school.phone,
            "email": db_school.email,
            "logo_url": db_school.logo_url,
            "subscription_plan": db_school.subscription_plan,
            "subscription_status": db_school.subscription_status,
            "subscription_expiry": db_school.subscription_expiry,
            "max_students": db_school.max_students,
            "max_teachers": db_school.max_teachers,
            "is_active": db_school.is_active,
            "created_at": str(db_school.created_at),
            "admin_created": True,
            "admin_name": admin_user.name,
            "admin_email": admin_user.email,
            "admin_password": school.super_admin_password,
        })

    return JSONResponse(content={
        "id": db_school.id,
        "name": db_school.name,
        "code": db_school.code,
        "address": db_school.address,
        "phone": db_school.phone,
        "email": db_school.email,
        "logo_url": db_school.logo_url,
        "subscription_plan": db_school.subscription_plan,
        "subscription_status": db_school.subscription_status,
        "subscription_expiry": db_school.subscription_expiry,
        "max_students": db_school.max_students,
        "max_teachers": db_school.max_teachers,
        "is_active": db_school.is_active,
        "created_at": str(db_school.created_at),
    })

@router.get("/{school_id}", response_model=SchoolResponse)
def get_school(school_id: int, db: Session = Depends(get_db), current_user=Depends(require_super_admin)):
    school = db.query(SchoolDB).filter(SchoolDB.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    return school

@router.put("/{school_id}", response_model=SchoolResponse)
def update_school(school_id: int, updates: SchoolUpdate, db: Session = Depends(get_db), current_user=Depends(require_owner)):
    school = db.query(SchoolDB).filter(SchoolDB.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(school, key, value)
    db.commit()
    db.refresh(school)
    return school

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks

from database import SessionLocal

def perform_school_cleanup(school_id: int):
    # Use a fresh session for background task to avoid closed session errors
    db_session = SessionLocal()
    try:
        tables_to_clean = [
            SubscriptionDB, TeacherClassDB, ScheduleEntryDB, NoteDB, StudentDB, 
            ContentDB, PaymentDB, ExpenseDB, SalaryDB, VideoRoomDB, 
            SecurityLogDB, MessageDB, BillingMetric, ActivityEvent, 
            ReportRecord, ClassDB, SubjectDB, UserDB
        ]
        
        for table in tables_to_clean:
            try:
                db_session.query(table).filter(table.school_id == school_id).delete(synchronize_session=False)
            except Exception as table_err:
                print(f"Skipping table {table.__tablename__}: {str(table_err)}")
                continue
        
        # Finally delete the school
        db_session.query(SchoolDB).filter(SchoolDB.id == school_id).delete(synchronize_session=False)
        db_session.commit()
        print(f"School {school_id} successfully purged in background.")
    except Exception as e:
        db_session.rollback()
        print(f"BACKGROUND DELETE FAILED: {str(e)}")
    finally:
        db_session.close()

@router.delete("/{school_id}")
def delete_school(school_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user=Depends(require_owner)):
    school = db.query(SchoolDB).filter(SchoolDB.id == school_id).first()
    
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Pass only school_id, let the task create its own session
    background_tasks.add_task(perform_school_cleanup, school_id)
    return {"message": "Purge initiated successfully."}

@router.post("/{school_id}/delete")
def delete_school_post(school_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user=Depends(require_owner)):
    return delete_school(school_id, background_tasks, db, current_user)

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
