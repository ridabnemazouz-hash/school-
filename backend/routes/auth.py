from fastapi import APIRouter, HTTPException, Depends, status, Security, Request, Cookie, Response, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import get_db
from models import UserCreate, UserDB, LoginRequest, RefreshTokenRequest, SecurityLogDB, StudentDB
from auth_utils import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token, REFRESH_SECRET_KEY, validate_password_strength, set_token_cookies, clear_token_cookies, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import html
import os
import uuid
import re
from datetime import datetime, timedelta

STUDENT_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads", "students")
os.makedirs(STUDENT_UPLOAD_DIR, exist_ok=True)
ALLOWED_PHOTO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_PHOTO_SIZE = 5 * 1024 * 1024

security = HTTPBearer()

router = APIRouter(prefix="/auth", tags=["auth"])

MAX_NAME_LENGTH = 100
MAX_EMAIL_LENGTH = 255
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15
ALERT_FAILED_THRESHOLD = 3

def sanitize_string(value: str) -> str:
    return html.escape(value.strip())[:MAX_NAME_LENGTH]

def validate_email_format(email: str) -> bool:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def log_security_event(db: Session, event_type: str, email: str = None, ip: str = None, ua: str = None, details: str = None):
    log = SecurityLogDB(
        event_type=event_type,
        email=email,
        ip_address=ip,
        user_agent=ua,
        details=details
    )
    db.add(log)
    db.commit()

def check_login_rate_limit(db: Session, email: str):
    cutoff = datetime.utcnow() - timedelta(minutes=LOCKOUT_MINUTES)
    failed = db.query(SecurityLogDB).filter(
        SecurityLogDB.event_type == "login_failed",
        SecurityLogDB.email == email,
        SecurityLogDB.created_at >= cutoff
    ).count()
    return failed >= MAX_LOGIN_ATTEMPTS

def check_suspicious_activity(db: Session, email: str, client_ip: str):
    cutoff = datetime.utcnow() - timedelta(minutes=5)
    failed_ips = db.query(SecurityLogDB).filter(
        SecurityLogDB.event_type == "login_failed",
        SecurityLogDB.ip_address == client_ip,
        SecurityLogDB.created_at >= cutoff
    ).count()
    
    if failed_ips >= ALERT_FAILED_THRESHOLD:
        log_security_event(db, "rate_limit_blocked", email, client_ip, None, f"Suspicious: {failed_ips} failed attempts from same IP in 5 min")
        return True
    
    failed_emails = db.query(SecurityLogDB).filter(
        SecurityLogDB.event_type == "login_failed",
        SecurityLogDB.email == email,
        SecurityLogDB.created_at >= cutoff
    ).count()
    
    if failed_emails >= ALERT_FAILED_THRESHOLD:
        log_security_event(db, "rate_limit_blocked", email, client_ip, None, f"Suspicious: {failed_emails} failed attempts for same email in 5 min")
        return True
    
    return False

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

def get_token_from_request(request: Request, cookie_token: str = Cookie(None)) -> str:
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1]
    if cookie_token:
        return cookie_token
    raise HTTPException(status_code=401, detail="Not authenticated")

def get_current_user(
    request: Request,
    access_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    try:
        token = get_token_from_request(request, access_token)
    except HTTPException:
        raise
    
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = db.query(UserDB).filter(UserDB.email == payload.get("sub")).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

def require_super_admin(current_user: UserDB = Depends(get_current_user)):
    if current_user.role != "Super Admin":
        raise HTTPException(status_code=403, detail="Only Super Admin can perform this action")
    return current_user

def require_admin_or_super(current_user: UserDB = Depends(get_current_user)):
    if current_user.role not in ["Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Only Admin or Super Admin can perform this action")
    return current_user

@router.get("/users")
def get_users_by_role(role: str, db: Session = Depends(get_db), current_user: UserDB = Depends(require_admin_or_super)):
    query = db.query(UserDB).filter(UserDB.role == role, UserDB.status == "Active")
    if current_user.role != "Super Admin":
        query = query.filter(UserDB.school_id == current_user.school_id)
    users = query.all()
    result = []
    for user in users:
        avatar_url = None
        dob = None
        if role == "Student":
            student_query = db.query(StudentDB).filter(StudentDB.user_id == user.id)
            if current_user.role != "Super Admin":
                student_query = student_query.filter(StudentDB.school_id == current_user.school_id)
            student = student_query.first()
            if student:
                avatar_url = student.avatar_url
                dob = student.date_of_birth
        result.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "status": user.status,
            "addedDate": user.created_at.strftime("%Y-%m-%d") if user.created_at else "",
            "avatar": avatar_url or f"https://ui-avatars.com/api/?name={user.name.replace(' ', '+')}&background=6366f1&color=fff",
            "dateOfBirth": dob
        })
    return result

@router.post("/forgot-password")
def forgot_password(req: LoginRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
    user = db.query(UserDB).filter(UserDB.email == email).first()
    if not user:
        return {"message": "If an account exists, reset instructions have been sent"}
    from jose import jwt
    from datetime import datetime, timedelta
    token = jwt.encode({"sub": user.email, "exp": datetime.utcnow() + timedelta(hours=1)}, SECRET_KEY, algorithm=ALGORITHM)
    reset_url = f"{os.environ.get('FRONTEND_URL', 'http://localhost:5173')}/reset-password?token={token}"
    print(f"Password reset link for {user.email}: {reset_url}")
    return {"message": "If an account exists, reset instructions have been sent"}

@router.get("/users/{user_id}")
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "Student":
        student = db.query(StudentDB).filter(StudentDB.user_id == user.id).first()
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "status": user.status,
            "created_at": user.created_at.strftime("%Y-%m-%d") if user.created_at else None,
            "avatar_url": student.avatar_url if student else None,
            "date_of_birth": student.date_of_birth if student else None,
            "grade": student.grade if student else None,
            "student_class": student.student_class if student else None,
            "attendance": student.attendance if student else None,
            "gpa": student.gpa if student else None,
        }
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "status": user.status,
        "created_at": user.created_at.strftime("%Y-%m-%d") if user.created_at else None,
    }

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(require_admin_or_super)):
    query = db.query(UserDB).filter(UserDB.id == user_id)
    if current_user.role != "Super Admin":
        query = query.filter(UserDB.school_id == current_user.school_id)
    user = query.first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "Super Admin":
        raise HTTPException(status_code=403, detail="Super Admin cannot be deleted")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.post("/register")
async def register(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form(...),
    grade: str = Form(""),
    student_class: str = Form(""),
    date_of_birth: str = Form(None),
    avatar: UploadFile = File(None),
    request: Request = None,
    db: Session = Depends(get_db)
):
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("user-agent", "")
    
    recent_registrations = db.query(SecurityLogDB).filter(
        SecurityLogDB.event_type == "registration",
        SecurityLogDB.ip_address == client_ip,
        SecurityLogDB.created_at >= datetime.utcnow() - timedelta(hours=1)
    ).count()
    
    if recent_registrations >= 3:
        raise HTTPException(status_code=429, detail="Too many registration attempts. Please try again later.")
    
    name = sanitize_string(name)
    email = email.lower().strip()
    
    if not validate_email_format(email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    if len(email) > MAX_EMAIL_LENGTH:
        raise HTTPException(status_code=400, detail="Email too long")
    
    existing_user = db.query(UserDB).filter(UserDB.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if role == "Super Admin":
        raise HTTPException(status_code=403, detail="Super Admin role cannot be requested via registration")
    
    pw_error = validate_password_strength(password)
    if pw_error:
        raise HTTPException(status_code=400, detail=pw_error)
    
    hashed_password = get_password_hash(password)
    
    avatar_url = None
    if avatar and avatar.filename:
        ext = os.path.splitext(avatar.filename)[1].lower()
        if ext in ALLOWED_PHOTO_EXTENSIONS:
            content = await avatar.read()
            if len(content) <= MAX_PHOTO_SIZE:
                filename = f"{uuid.uuid4().hex}{ext}"
                filepath = os.path.join(STUDENT_UPLOAD_DIR, filename)
                with open(filepath, "wb") as f:
                    f.write(content)
                avatar_url = f"/uploads/students/{filename}"
    
    user_db = UserDB(
        name=name,
        email=email,
        role=role,
        hashed_password=hashed_password,
        status="Pending",
        school_id=1
    )
    
    db.add(user_db)
    db.commit()
    db.refresh(user_db)

    # If role is Student, also create a student record
    if role == "Student":
        student_db = StudentDB(
            user_id=user_db.id,
            name=name,
            grade=grade,
            student_class=student_class,
            attendance="100%",
            gpa="0.0",
            date_of_birth=date_of_birth,
            avatar_url=avatar_url,
            school_id=1
        )
        db.add(student_db)
        db.commit()
    
    log_security_event(db, "registration", email, client_ip, user_agent)
    
    return {"message": "Registration request sent successfully", "id": user_db.id}

@router.post("/add-admin")
def add_admin(user: UserCreate, db: Session = Depends(get_db), current_user: UserDB = Depends(require_super_admin)):
    user.name = sanitize_string(user.name)
    user.email = user.email.lower().strip()
    
    if not validate_email_format(user.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    if len(user.email) > MAX_EMAIL_LENGTH:
        raise HTTPException(status_code=400, detail="Email too long")
    
    existing_user = db.query(UserDB).filter(UserDB.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if user.role == "Super Admin":
        raise HTTPException(status_code=403, detail="Only one Super Admin is allowed and cannot be created here")
    
    pw_error = validate_password_strength(user.password)
    if pw_error:
        raise HTTPException(status_code=400, detail=pw_error)
    
    hashed_password = get_password_hash(user.password)
    
    user_db = UserDB(
        name=user.name,
        email=user.email,
        role=user.role,
        hashed_password=hashed_password,
        status="Active",
        school_id=current_user.school_id or 1
    )
    
    db.add(user_db)
    db.commit()
    db.refresh(user_db)
    
    return {"message": "Admin added successfully", "id": user_db.id, "status": user_db.status}

@router.post("/login")
def login(req: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    client_ip = get_client_ip(request)
    user_agent = request.headers.get("user-agent", "")
    
    user = db.query(UserDB).filter(UserDB.email == req.email.lower().strip()).first()
    
    if check_login_rate_limit(db, req.email):
        log_security_event(db, "rate_limit_blocked", req.email, client_ip, user_agent, "Account locked due to too many failed attempts")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Please try again in {LOCKOUT_MINUTES} minutes."
        )
    
    if not user or not verify_password(req.password, user.hashed_password):
        log_security_event(db, "login_failed", req.email, client_ip, user_agent, "Invalid credentials")
        check_suspicious_activity(db, req.email, client_ip)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
    if user.status != "Active" and user.role != "Super Admin":
        log_security_event(db, "login_failed", user.email, client_ip, user_agent, f"Account status: {user.status}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is pending approval or inactive")
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.email, "role": user.role})
    
    user.refresh_token = refresh_token
    db.commit()
    
    set_token_cookies(response, access_token, refresh_token)
    
    log_security_event(db, "login_success", user.email, client_ip, user_agent)
    
    return {
        "user": {"id": user.id, "name": user.name, "role": user.role, "email": user.email, "school_id": user.school_id},
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.post("/refresh")
def refresh_tokens(request: Request, response: Response, db: Session = Depends(get_db)):
    client_ip = get_client_ip(request)
    
    recent_refreshes = db.query(SecurityLogDB).filter(
        SecurityLogDB.event_type == "token_refresh",
        SecurityLogDB.ip_address == client_ip,
        SecurityLogDB.created_at >= datetime.utcnow() - timedelta(minutes=1)
    ).count()
    
    if recent_refreshes >= 10:
        raise HTTPException(status_code=429, detail="Too many refresh attempts")
    
    cookie_refresh = request.cookies.get("refresh_token")
    if not cookie_refresh:
        raise HTTPException(status_code=401, detail="No refresh token")
    
    payload = decode_token(cookie_refresh, REFRESH_SECRET_KEY)
    if payload is None or payload.get("type") != "refresh":
        log_security_event(db, "login_failed", None, client_ip, None, "Invalid refresh token")
        clear_token_cookies(response)
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user = db.query(UserDB).filter(UserDB.email == payload.get("sub")).first()
    if user is None or user.refresh_token != cookie_refresh:
        log_security_event(db, "login_failed", payload.get("sub"), client_ip, None, "Refresh token mismatch")
        clear_token_cookies(response)
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    if user.status != "Active" and user.role != "Super Admin":
        clear_token_cookies(response)
        raise HTTPException(status_code=403, detail="Account is inactive")
    
    new_access_token = create_access_token(data={"sub": user.email, "role": user.role})
    new_refresh_token = create_refresh_token(data={"sub": user.email, "role": user.role})
    
    user.refresh_token = new_refresh_token
    db.commit()
    
    set_token_cookies(response, new_access_token, new_refresh_token)
    
    log_security_event(db, "token_refresh", user.email, client_ip)
    
    return {"expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60}

@router.post("/logout")
def logout(response: Response, request: Request, db: Session = Depends(get_db)):
    cookie_refresh = request.cookies.get("refresh_token")
    if cookie_refresh:
        payload = decode_token(cookie_refresh, REFRESH_SECRET_KEY)
        if payload:
            user = db.query(UserDB).filter(UserDB.email == payload.get("sub")).first()
            if user:
                user.refresh_token = None
                db.commit()
    
    clear_token_cookies(response)
    return {"message": "Logged out successfully"}

@router.get("/me")
def get_current_user_info(current_user: UserDB = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "school_id": current_user.school_id,
        "status": current_user.status,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }

@router.get("/admins")
def get_admins(db: Session = Depends(get_db), current_user: UserDB = Depends(require_admin_or_super)):
    query = db.query(UserDB).filter(UserDB.role.in_(["Admin", "Super Admin"]))
    if current_user.role != "Super Admin":
        query = query.filter(UserDB.school_id == current_user.school_id)
    users = query.all()
    result = []
    for user in users:
        result.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "status": user.status,
            "addedDate": user.created_at.strftime("%Y-%m-%d") if user.created_at else "",
            "avatar": f"https://ui-avatars.com/api/?name={user.name.replace(' ', '+')}&background=6366f1&color=fff"
        })
    return result

@router.delete("/admins/{user_id}")
def delete_admin(user_id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(require_super_admin)):
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Admin not found")
    if user.role == "Super Admin":
        raise HTTPException(status_code=403, detail="Super Admin cannot be deleted")
    db.delete(user)
    db.commit()
    return {"message": "Admin deleted successfully"}

@router.put("/admins/{user_id}/toggle-status")
def toggle_admin_status(user_id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(require_super_admin)):
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Admin not found")
    if user.role == "Super Admin":
        raise HTTPException(status_code=403, detail="Super Admin status cannot be changed")
    user.status = "Inactive" if user.status == "Active" else "Active"
    db.commit()
    db.refresh(user)
    return {"id": user.id, "status": user.status}

@router.get("/pending-requests")
def get_pending_requests(db: Session = Depends(get_db), current_user: UserDB = Depends(require_admin_or_super)):
    query = db.query(UserDB).filter(UserDB.status == "Pending")
    if current_user.role != "Super Admin":
        query = query.filter(UserDB.school_id == current_user.school_id)
    users = query.all()
    
    result = []
    for user in users:
        result.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "status": user.status,
            "created_at": user.created_at.isoformat() if user.created_at else None
        })
        
    return result

@router.put("/approve/{user_id}")
def approve_user(user_id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(require_admin_or_super)):
    query = db.query(UserDB).filter(UserDB.id == user_id)
    if current_user.role != "Super Admin":
        query = query.filter(UserDB.school_id == current_user.school_id)
    user = query.first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.status != "Pending":
        raise HTTPException(status_code=400, detail="User is not pending")
    
    user.status = "Active"
    db.commit()
    db.refresh(user)
    
    return {"message": "User approved successfully", "id": user.id, "status": user.status, "name": user.name, "email": user.email}

@router.put("/reject/{user_id}")
def reject_user(user_id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(require_admin_or_super)):
    query = db.query(UserDB).filter(UserDB.id == user_id)
    if current_user.role != "Super Admin":
        query = query.filter(UserDB.school_id == current_user.school_id)
    user = query.first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.status != "Pending":
        raise HTTPException(status_code=400, detail="User is not pending")
    
    user.status = "Rejected"
    db.commit()
    db.refresh(user)
    
    return {"message": "User rejected successfully", "id": user.id, "status": user.status}

@router.get("/security-logs")
def get_security_logs(
    event_type: str = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_super_admin)
):
    query = db.query(SecurityLogDB)
    if event_type and event_type != "All":
        query = query.filter(SecurityLogDB.event_type == event_type)
    logs = query.order_by(SecurityLogDB.created_at.desc()).limit(limit).all()
    return [{
        "id": l.id,
        "event_type": l.event_type,
        "email": l.email,
        "ip_address": l.ip_address,
        "details": l.details,
        "created_at": l.created_at.isoformat() if l.created_at else None
    } for l in logs]

@router.get("/security-alerts")
def get_security_alerts(db: Session = Depends(get_db), current_user: UserDB = Depends(require_super_admin)):
    cutoff = datetime.utcnow() - timedelta(hours=1)
    
    suspicious = db.query(SecurityLogDB).filter(
        SecurityLogDB.event_type == "rate_limit_blocked",
        SecurityLogDB.created_at >= cutoff
    ).all()
    
    failed_logins = db.query(SecurityLogDB).filter(
        SecurityLogDB.event_type == "login_failed",
        SecurityLogDB.created_at >= cutoff
    ).count()
    
    return {
        "suspicious_events": len(suspicious),
        "failed_logins_last_hour": failed_logins,
        "alerts": [{
            "id": s.id,
            "email": s.email,
            "ip_address": s.ip_address,
            "details": s.details,
            "created_at": s.created_at.isoformat() if s.created_at else None
        } for s in suspicious]
    }
