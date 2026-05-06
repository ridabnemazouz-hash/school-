from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import SubjectDB, SubjectCreate, SubjectResponse, TeacherClassDB, TeacherClassCreate, TeacherClassResponse, UserDB
from routes.auth import get_current_user

router = APIRouter(prefix="/subjects", tags=["subjects"])

@router.get("/", response_model=list[SubjectResponse])
def get_subjects(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    query = db.query(SubjectDB)
    if current_user.school_id is not None:
        query = query.filter(SubjectDB.school_id == current_user.school_id)
    return query.all()

@router.post("/", response_model=SubjectResponse)
def create_subject(subject: SubjectCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role not in ["Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Only admins can create subjects")
    existing_query = db.query(SubjectDB).filter(SubjectDB.name == subject.name)
    if current_user.school_id is not None:
        existing_query = existing_query.filter(SubjectDB.school_id == current_user.school_id)
    existing = existing_query.first()
    if existing:
        raise HTTPException(status_code=400, detail="Subject already exists")
    db_subject = SubjectDB(**subject.model_dump(), school_id=current_user.school_id or 1)
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(subject_id: int, subject: SubjectCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role not in ["Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Only admins can update subjects")
    query = db.query(SubjectDB).filter(SubjectDB.id == subject_id)
    if current_user.school_id is not None:
        query = query.filter(SubjectDB.school_id == current_user.school_id)
    db_subject = query.first()
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    for key, value in subject.model_dump().items():
        setattr(db_subject, key, value)
    db.commit()
    db.refresh(db_subject)
    return db_subject

@router.delete("/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role not in ["Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Only admins can delete subjects")
    query = db.query(SubjectDB).filter(SubjectDB.id == subject_id)
    if current_user.school_id is not None:
        query = query.filter(SubjectDB.school_id == current_user.school_id)
    db_subject = query.first()
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(db_subject)
    db.commit()
    return {"message": "Subject deleted"}

@router.get("/teacher-classes")
def get_teacher_classes(class_id: int = None, teacher_id: int = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    query = db.query(TeacherClassDB)
    if current_user.school_id is not None:
        query = query.filter(TeacherClassDB.school_id == current_user.school_id)
    if class_id:
        query = query.filter(TeacherClassDB.class_id == class_id)
    if teacher_id:
        query = query.filter(TeacherClassDB.teacher_id == teacher_id)
    return query.all()

@router.post("/teacher-classes", response_model=TeacherClassResponse)
def assign_teacher_class(assignment: TeacherClassCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role not in ["Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Only admins can assign teachers")
    db_assignment = TeacherClassDB(**assignment.model_dump(), school_id=current_user.school_id or 1)
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@router.delete("/teacher-classes/{assignment_id}")
def delete_teacher_class(assignment_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role not in ["Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Only admins can remove assignments")
    query = db.query(TeacherClassDB).filter(TeacherClassDB.id == assignment_id)
    if current_user.school_id is not None:
        query = query.filter(TeacherClassDB.school_id == current_user.school_id)
    db_assignment = query.first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(db_assignment)
    db.commit()
    return {"message": "Assignment removed"}

@router.get("/teachers")
def get_teachers_with_classes(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    user_query = db.query(UserDB).filter(UserDB.role == "Teacher", UserDB.status == "Active")
    if current_user.school_id is not None:
        user_query = user_query.filter(UserDB.school_id == current_user.school_id)
    teachers = user_query.all()
    result = []
    for teacher in teachers:
        tc_query = db.query(TeacherClassDB).filter(TeacherClassDB.teacher_id == teacher.id)
        if current_user.school_id is not None:
            tc_query = tc_query.filter(TeacherClassDB.school_id == current_user.school_id)
        assignments = tc_query.all()
        result.append({
            "id": teacher.id,
            "name": teacher.name,
            "email": teacher.email,
            "classes": [{"id": a.class_id, "name": a.class_name, "subject": a.subject_name} for a in assignments]
        })
    return result
