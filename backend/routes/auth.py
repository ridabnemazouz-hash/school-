from fastapi import APIRouter, HTTPException, Depends, status, Security
from sqlalchemy.orm import Session
from database import get_db
from models import UserCreate, UserDB, LoginRequest, Token
from auth_utils import get_password_hash, verify_password, create_access_token
from fastapi.responses import Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

router = APIRouter(prefix="/auth", tags=["auth"])

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        from jose import jwt, JWTError
        from auth_utils import SECRET_KEY, ALGORITHM
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(UserDB).filter(UserDB.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

def require_super_admin(current_user: UserDB = Depends(get_current_user)):
    if current_user.role != "Super Admin":
        raise HTTPException(status_code=403, detail="Only Super Admin can perform this action")
    return current_user

@router.options("/login")
@router.options("/register")
@router.options("/add-admin")
@router.options("/approve/{user_id}")
@router.options("/reject/{user_id}")
def options_handler():
    return Response(status_code=200)

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(UserDB).filter(UserDB.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = get_password_hash(user.password)
    
    # Create DB user
    user_db = UserDB(
        name=user.name,
        email=user.email,
        role=user.role,
        hashed_password=hashed_password
    )
    
    # Insert to DB
    db.add(user_db)
    db.commit()
    db.refresh(user_db)
    
    return {"message": "Registration request sent successfully", "id": user_db.id}

@router.post("/add-admin")
def add_admin(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(UserDB).filter(UserDB.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = get_password_hash(user.password)
    
    # Create DB user with Active status
    user_db = UserDB(
        name=user.name,
        email=user.email,
        role=user.role,
        hashed_password=hashed_password,
        status="Active"
    )
    
    # Insert to DB
    db.add(user_db)
    db.commit()
    db.refresh(user_db)
    
    return {"message": "Admin added successfully", "id": user_db.id, "status": user_db.status}

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.email == req.email).first()
    
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
    if user.status != "Active" and user.role != "Super Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is pending approval or inactive")
        
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": user.id, "name": user.name, "role": user.role, "email": user.email}}

@router.get("/pending-requests")
def get_pending_requests(db: Session = Depends(get_db)):
    users = db.query(UserDB).filter(UserDB.status == "Pending").all()
    
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
def approve_user(user_id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(require_super_admin)):
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.status != "Pending":
        raise HTTPException(status_code=400, detail="User is not pending")
    
    user.status = "Active"
    db.commit()
    db.refresh(user)
    
    return {"message": "User approved successfully", "id": user.id, "status": user.status, "name": user.name, "email": user.email}

@router.put("/reject/{user_id}")
def reject_user(user_id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(require_super_admin)):
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.status != "Pending":
        raise HTTPException(status_code=400, detail="User is not pending")
    
    user.status = "Rejected"
    db.commit()
    db.refresh(user)
    
    return {"message": "User rejected successfully", "id": user.id, "status": user.status}
