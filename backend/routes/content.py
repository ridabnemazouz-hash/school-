import os
import uuid
import re
import html
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models import ContentCreate, ContentDB, ContentResponse
from auth_utils import SECRET_KEY, ALGORITHM
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from models import UserDB

security = HTTPBearer()
router = APIRouter(prefix="/content", tags=["content"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".mp4", ".mov", ".avi", ".txt", ".png", ".jpg", ".jpeg", ".ppt", ".pptx"}

def sanitize_string(value: str) -> str:
    return html.escape(value.strip())[:200]

def validate_filename(filename: str) -> str:
    name = os.path.basename(filename)
    name = re.sub(r'[^\w\-.]', '_', name)
    return name

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(UserDB).filter(UserDB.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_teacher_or_admin(current_user=Depends(get_current_user)):
    if current_user.role not in ["Teacher", "Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Only Teachers and Admins can manage content")
    return current_user

@router.get("/")
def get_content(subject: str = None, db: Session = Depends(get_db)):
    query = db.query(ContentDB)
    if subject and subject != "All":
        query = query.filter(ContentDB.subject == subject)
    items = query.order_by(ContentDB.created_at.desc()).all()
    return [{
        "id": c.id,
        "title": c.title,
        "subject": c.subject,
        "content_type": c.content_type,
        "file_url": c.file_url,
        "description": c.description,
        "teacher_id": c.teacher_id,
        "teacher_name": c.teacher_name,
        "target_class": c.target_class,
        "created_at": c.created_at.isoformat()
    } for c in items]

@router.post("/", response_model=ContentResponse)
def create_content(
    data: ContentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_teacher_or_admin)
):
    db_content = ContentDB(
        title=sanitize_string(data.title),
        subject=sanitize_string(data.subject),
        content_type=data.content_type,
        file_url=data.file_url,
        description=sanitize_string(data.description) if data.description else None,
        teacher_id=current_user.id,
        teacher_name=current_user.name,
        target_class=sanitize_string(data.target_class) if data.target_class else None
    )
    db.add(db_content)
    db.commit()
    db.refresh(db_content)
    return db_content

@router.post("/upload", response_model=ContentResponse)
async def upload_content(
    title: str = Form(...),
    subject: str = Form(...),
    content_type: str = Form(...),
    description: str = Form(None),
    target_class: str = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_teacher_or_admin)
):
    title = sanitize_string(title)
    subject = sanitize_string(subject)
    description = sanitize_string(description) if description else None
    target_class = sanitize_string(target_class) if target_class else None

    file_url = None
    if file and file.filename:
        safe_filename = validate_filename(file.filename)
        ext = os.path.splitext(safe_filename)[1].lower()
        
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
        
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB")
        
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as f:
            f.write(content)
        
        file_url = f"/uploads/{filename}"

    db_content = ContentDB(
        title=title,
        subject=subject,
        content_type=content_type,
        file_url=file_url,
        description=description,
        teacher_id=current_user.id,
        teacher_name=current_user.name,
        target_class=target_class
    )
    db.add(db_content)
    db.commit()
    db.refresh(db_content)
    return db_content

@router.delete("/{content_id}")
def delete_content(
    content_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_teacher_or_admin)
):
    content = db.query(ContentDB).filter(ContentDB.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    if content.file_url:
        filepath = os.path.join(UPLOAD_DIR, os.path.basename(content.file_url))
        if os.path.exists(filepath) and os.path.commonpath([filepath, UPLOAD_DIR]) == UPLOAD_DIR:
            os.remove(filepath)
    db.delete(content)
    db.commit()
    return {"message": "Content deleted successfully"}
