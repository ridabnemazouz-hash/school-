from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

from routes.auth import router as auth_router
from routes.students import router as students_router
from routes.chat import router as chat_router
from routes.classes import router as classes_router
from routes.content import router as content_router
from routes.ai_tutor import router as ai_tutor_router
from routes.payments import router as payments_router
from routes.expenses import router as expenses_router
from database import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="EduSaaS API", version="1.0.0")

# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Setup CORS
cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
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

# Serve uploaded files (restricted to uploads folder only)
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Welcome to EduSaaS API (SQLite)"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
