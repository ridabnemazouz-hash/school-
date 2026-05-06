from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import NoteDB, NoteCreate, NoteResponse, StudentDB, SubjectDB
from routes.auth import get_current_user
from security_utils import enforce_school_scope

router = APIRouter(prefix="/grades", tags=["grades"])

@router.get("/notes")
def get_notes(
    student_id: int = None,
    class_name: str = None,
    subject_id: int = None,
    semester: str = None,
    academic_year: str = "2025-2026",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(NoteDB).filter(NoteDB.academic_year == academic_year)
    query = enforce_school_scope(query, NoteDB, current_user)
    if student_id:
        query = query.filter(NoteDB.student_id == student_id)
    if class_name:
        query = query.filter(NoteDB.student_class == class_name)
    if subject_id:
        query = query.filter(NoteDB.subject_id == subject_id)
    if semester:
        query = query.filter(NoteDB.semester == semester)
    return query.all()

@router.post("/notes", response_model=NoteResponse)
def create_note(note: NoteCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role not in ["Admin", "Super Admin", "Teacher"]:
        raise HTTPException(status_code=403, detail="Only teachers and admins can create notes")
    db_note = NoteDB(**note.model_dump(), school_id=current_user.school_id or 1)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.put("/notes/{note_id}", response_model=NoteResponse)
def update_note(note_id: int, note: NoteCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role not in ["Admin", "Super Admin", "Teacher"]:
        raise HTTPException(status_code=403, detail="Only teachers and admins can update notes")
    query = db.query(NoteDB).filter(NoteDB.id == note_id)
    if current_user.school_id is not None:
        query = query.filter(NoteDB.school_id == current_user.school_id)
    db_note = query.first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    for key, value in note.model_dump().items():
        setattr(db_note, key, value)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.delete("/notes/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role not in ["Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Only admins can delete notes")
    query = db.query(NoteDB).filter(NoteDB.id == note_id)
    if current_user.school_id is not None:
        query = query.filter(NoteDB.school_id == current_user.school_id)
    db_note = query.first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(db_note)
    db.commit()
    return {"message": "Note deleted"}

@router.get("/averages")
def get_averages(
    class_name: str = None,
    subject_id: int = None,
    semester: str = None,
    academic_year: str = "2025-2026",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(NoteDB).filter(NoteDB.academic_year == academic_year)
    query = enforce_school_scope(query, NoteDB, current_user)
    if class_name:
        query = query.filter(NoteDB.student_class == class_name)
    if subject_id:
        query = query.filter(NoteDB.subject_id == subject_id)
    if semester:
        query = query.filter(NoteDB.semester == semester)
    notes = query.all()

    students = {}
    for n in notes:
        if n.student_id not in students:
            students[n.student_id] = {"name": n.student_name, "total": 0, "count": 0}
        try:
            val = float(n.note.replace(",", "."))
            students[n.student_id]["total"] += val * n.coefficient
            students[n.student_id]["count"] += n.coefficient
        except:
            pass

    result = []
    for sid, data in students.items():
        avg = data["total"] / data["count"] if data["count"] > 0 else 0
        result.append({
            "student_id": sid,
            "student_name": data["name"],
            "average": round(avg, 2),
            "total_notes": data["count"]
        })
    result.sort(key=lambda x: x["average"], reverse=True)

    for i, r in enumerate(result):
        r["rank"] = i + 1

    return result

@router.get("/student/{student_id}")
def get_student_grades(
    student_id: int,
    semester: str = None,
    academic_year: str = "2025-2026",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(NoteDB).filter(NoteDB.student_id == student_id, NoteDB.academic_year == academic_year)
    query = enforce_school_scope(query, NoteDB, current_user)
    if semester:
        query = query.filter(NoteDB.semester == semester)
    notes = query.all()

    subjects = {}
    for n in notes:
        if n.subject_id not in subjects:
            subjects[n.subject_id] = {"name": n.subject_name, "total": 0, "count": 0, "notes": []}
        try:
            val = float(n.note.replace(",", "."))
            subjects[n.subject_id]["total"] += val * n.coefficient
            subjects[n.subject_id]["count"] += n.coefficient
        except:
            pass
        subjects[n.subject_id]["notes"].append({
            "id": n.id,
            "type": n.exam_type,
            "note": n.note,
            "coefficient": n.coefficient
        })

    result = []
    general_total = 0
    general_count = 0
    for sid, data in subjects.items():
        avg = data["total"] / data["count"] if data["count"] > 0 else 0
        general_total += data["total"]
        general_count += data["count"]
        result.append({
            "subject_id": sid,
            "subject_name": data["name"],
            "average": round(avg, 2),
            "notes": data["notes"]
        })

    general_avg = general_total / general_count if general_count > 0 else 0

    return {
        "student_id": student_id,
        "student_name": notes[0].student_name if notes else "",
        "class": notes[0].student_class if notes else "",
        "general_average": round(general_avg, 2),
        "semester": semester or "All",
        "subjects": result
    }
