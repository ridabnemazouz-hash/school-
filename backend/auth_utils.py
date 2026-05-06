import os
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import Response
from fastapi.responses import JSONResponse

load_dotenv()

SECRET_KEY = os.environ.get("SECRET_KEY", "fallback_secret_change_me")
REFRESH_SECRET_KEY = os.environ.get("REFRESH_SECRET_KEY", "fallback_refresh_secret_change_me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

IS_PRODUCTION = os.environ.get("PRODUCTION") == "true"

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto", pbkdf2_sha256__rounds=600000)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str, secret: str = None):
    try:
        key = secret or SECRET_KEY
        payload = jwt.decode(token, key, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def set_token_cookies(response: Response, access_token: str, refresh_token: str):
    secure = IS_PRODUCTION
    # SameSite=Strict is recommended for maximum security against CSRF
    samesite = "strict" if secure else "lax"
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )

def clear_token_cookies(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")

def validate_password_strength(password: str) -> str | None:
    if len(password) < 8:
        return "Password must be at least 8 characters long"
    if not any(c.isupper() for c in password):
        return "Password must contain at least one uppercase letter"
    if not any(c.islower() for c in password):
        return "Password must contain at least one lowercase letter"
    if not any(c.isdigit() for c in password):
        return "Password must contain at least one digit"
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        return "Password must contain at least one special character"
    return None

def require_admin_or_super(current_user):
    if current_user.role not in ["Admin", "Super Admin"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Only Admin or Super Admin can perform this action")
    return current_user

def require_super_admin(current_user):
    if current_user.role not in ["Super Admin", "Owner"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Only Super Admin can perform this action")
    return current_user

def enforce_school_scope(query, model, user):
    """Enforce that school-level users can only access their school's data"""
    if not user.is_platform_owner and user.school_id is not None:
        return query.filter(model.school_id == user.school_id)
    return query

def verify_object_ownership(obj, user):
    """Double protection: Verify that a fetched object belongs to the user's school"""
    if user.is_platform_owner:
        return # Platform Owner can see everything
    
    if not hasattr(obj, "school_id"):
        return # Object doesn't have school_id, skip check
        
    if obj.school_id != user.school_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Security Violation: Access Denied to this resource")

def check_subscription_active(db, school_id: int):
    """Check if school has active subscription"""
    from models import SubscriptionDB
    subscription = db.query(SubscriptionDB).filter(SubscriptionDB.school_id == school_id).first()
    if not subscription:
        return True
    if subscription.status != "Active":
        return False
    if subscription.expires_at and subscription.expires_at < datetime.utcnow():
        return False
    return True
