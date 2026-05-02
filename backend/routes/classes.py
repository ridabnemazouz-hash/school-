from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import ClassCreate, ClassDB
from auth_utils import create_access_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from auth_utils import SECRET_KEY, ALGORITHM

security = HTTPBearer()
router = APIRouter(prefix="/classes", tags=["classes"])

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    from models import UserDB
    user = db.query(UserDB).filter(UserDB.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_admin_or_super(current_user=Depends(get_current_user)):
    if current_user.role not in ["Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Only Admin or Super Admin can perform this action")
    return current_user

@router.get("/")
def get_classes(db: Session = Depends(get_db)):
    classes = db.query(ClassDB).all()
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
        students_count=0
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
    cls = db.query(ClassDB).filter(ClassDB.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    db.delete(cls)
    db.commit()
    return {"message": "Class deleted successfully"}

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(ClassDB).count()
    total_students = db.query(ClassDB).with_entities(ClassDB.students_count).all()
    total_students = sum(s[0] for s in total_students)
    total_capacity = db.query(ClassDB).with_entities(ClassDB.capacity).all()
    total_capacity = sum(c[0] for c in total_capacity)
    avg = round(total_students / total_capacity * 100, 1) if total_capacity > 0 else 0
    return {
        "totalClasses": total,
        "totalStudents": total_students,
        "totalCapacity": total_capacity,
        "avgOccupancy": avg
    }
