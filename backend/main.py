from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
import uvicorn
import os
import logging
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
from routes.salaries import router as salaries_router
from routes.rooms import router as rooms_router
from database import engine, Base

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
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://ui-avatars.com; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
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
        
        if path not in ["/", "/docs", "/openapi.json", "/favicon.ico"]:
            logger.info(f"{method} {path} from {client_ip}")
        
        response = await call_next(request)
        
        if response.status_code >= 400 and path not in ["/auth/login"]:
            logger.warning(f"{method} {path} - Status {response.status_code}")
        
        return response

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
allowed_origins = cors_origins
if os.environ.get("PRODUCTION") == "true":
    allowed_origins = [o for o in cors_origins if o.startswith("https://")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

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

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Welcome to EduSaaS API (Secure)"}

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "2.0.0"}

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
