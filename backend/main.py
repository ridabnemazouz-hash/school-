from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
import uvicorn
import os
import logging
from dotenv import load_dotenv
from database import engine, Base, get_db

load_dotenv()

from routes.auth import router as auth_router
from routes.students import router as students_router
from routes.chat import router as chat_router
from routes.classes import router as classes_router
from routes.content import router as content_router
from routes.ai_tutor import router as ai_tutor_router
from routes.payments import router as payments_router
from routes.expenses import router as expenses_router
from routes.salaries import router as salaries_router
from routes.rooms import router as rooms_router
from routes.subjects import router as subjects_router
from routes.grades import router as grades_router
from routes.schedule import router as schedule_router
from routes.schools import router as schools_router
from routes.dev import router as dev_router
from routes.enterprise import router as enterprise_router
from routes.subscriptions import router as subscriptions_router

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(os.path.dirname(__file__), "security.log")),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("edusaas")

Base.metadata.create_all(bind=engine)

app = FastAPI(title="EduSaaS API", version="2.0.0")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https://ui-avatars.com https://*.googleusercontent.com; "
            "font-src 'self' data:; "
            "connect-src 'self' *; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if os.environ.get("PRODUCTION") == "true":
            response.headers["X-Content-Type-Options"] = "nosniff"
        return response

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        method = request.method
        path = request.url.path
        
        NOISE_PATHS = {"/auth/me", "/health", "/favicon.ico", "/", "/docs", "/openapi.json"}
        
        if path not in NOISE_PATHS:
            logger.info(f"{method} {path} from {client_ip}")
        
        response = await call_next(request)
        
        if response.status_code >= 400 and path not in ["/auth/login", "/auth/me"]:
            logger.warning(f"{method} {path} - Status {response.status_code}")
        
        return response

cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://[::1]:5173,http://localhost:3000,http://127.0.0.1:3000").split(",")

# Add CORS - restrict to known origins in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
    max_age=600,
)

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred"}
    )

app.include_router(auth_router)
app.include_router(students_router)
app.include_router(chat_router)
app.include_router(classes_router)
app.include_router(content_router)
app.include_router(ai_tutor_router)
app.include_router(payments_router)
app.include_router(expenses_router)
app.include_router(salaries_router)
app.include_router(rooms_router)
app.include_router(subjects_router)
app.include_router(grades_router)
app.include_router(schedule_router)
app.include_router(schools_router)
app.include_router(dev_router)
app.include_router(enterprise_router)
app.include_router(subscriptions_router)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Welcome to EduSaaS API (Secure)"}

@app.get("/health")
def health_check():
    from database import SessionLocal
    from models import SchoolDB, UserDB
    db = SessionLocal()
    try:
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        db_status = "Connected"
        total_schools = db.query(SchoolDB).count()
        total_users = db.query(UserDB).count()
    except Exception:
        db_status = "Disconnected"
        total_schools = 0
        total_users = 0
    finally:
        db.close()
    
    return {
        "status": "ok",
        "version": "2.0.0",
        "database": db_status,
        "uptime": "running",
        "timestamp": __import__("datetime").datetime.utcnow().isoformat()
    }

@app.get("/system/stats")
def get_system_stats(db: Session = Depends(get_db)):
    from models import SchoolDB, UserDB, StudentDB, ClassDB
    total_schools = db.query(SchoolDB).count()
    active_schools = db.query(SchoolDB).filter(SchoolDB.is_active == True).count()
    total_students = db.query(UserDB).filter(UserDB.role == "Student", UserDB.status == "Active").count()
    total_teachers = db.query(UserDB).filter(UserDB.role == "Teacher", UserDB.status == "Active").count()
    total_classes = db.query(ClassDB).count()
    free_plan = db.query(SchoolDB).filter(SchoolDB.subscription_plan == "Free").count()
    basic_plan = db.query(SchoolDB).filter(SchoolDB.subscription_plan == "Basic").count()
    premium_plan = db.query(SchoolDB).filter(SchoolDB.subscription_plan == "Premium").count()
    enterprise_plan = db.query(SchoolDB).filter(SchoolDB.subscription_plan == "Enterprise").count()
    
    return {
        "totalSchools": total_schools,
        "activeSchools": active_schools,
        "totalStudents": total_students,
        "totalTeachers": total_teachers,
        "totalClasses": total_classes,
        "subscriptions": {
            "Free": free_plan,
            "Basic": basic_plan,
            "Premium": premium_plan,
            "Enterprise": enterprise_plan
        }
    }

if __name__ == "__main__":
    ssl_certfile = os.environ.get("SSL_CERTFILE")
    ssl_keyfile = os.environ.get("SSL_KEYFILE")
    
    if os.environ.get("PRODUCTION") == "true" and ssl_certfile and ssl_keyfile:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=False,
            ssl_certfile=ssl_certfile,
            ssl_keyfile=ssl_keyfile
        )
    else:
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
