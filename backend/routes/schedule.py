from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import ScheduleEntryDB, ScheduleEntryCreate, ScheduleEntryResponse
from routes.auth import get_current_user

router = APIRouter(prefix="/schedule", tags=["schedule"])

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

@router.get("/")
def get_schedule(class_id: int = None, teacher_id: int = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    query = db.query(ScheduleEntryDB)
    if current_user.school_id is not None:
        query = query.filter(ScheduleEntryDB.school_id == current_user.school_id)
    if class_id:
        query = query.filter(ScheduleEntryDB.class_id == class_id)
    if teacher_id:
        query = query.filter(ScheduleEntryDB.teacher_id == teacher_id)
    entries = query.all()
    result = {}
    for entry in entries:
        if entry.day not in result:
            result[entry.day] = []
        result[entry.day].append({
            "id": entry.id,
            "start_time": entry.start_time,
            "end_time": entry.end_time,
            "subject_name": entry.subject_name,
            "teacher_name": entry.teacher_name,
            "class_name": entry.class_name,
            "room": entry.room,
            "subject_id": entry.subject_id,
            "teacher_id": entry.teacher_id,
            "class_id": entry.class_id
        })
    for day in result:
        result[day].sort(key=lambda x: x["start_time"])
    return result

@router.post("/", response_model=ScheduleEntryResponse)
def create_schedule_entry(entry: ScheduleEntryCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role not in ["Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Only admins can create schedule entries")
    if entry.day not in DAYS:
        raise HTTPException(status_code=400, detail=f"Day must be one of: {', '.join(DAYS)}")
    db_entry = ScheduleEntryDB(**entry.model_dump(), school_id=current_user.school_id or 1)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.delete("/{entry_id}")
def delete_schedule_entry(entry_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role not in ["Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Only admins can delete schedule entries")
    query = db.query(ScheduleEntryDB).filter(ScheduleEntryDB.id == entry_id)
    if current_user.school_id is not None:
        query = query.filter(ScheduleEntryDB.school_id == current_user.school_id)
    db_entry = query.first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Schedule entry not found")
    db.delete(db_entry)
    db.commit()
    return {"message": "Schedule entry deleted"}
