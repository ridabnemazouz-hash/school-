from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from routes.auth import router as auth_router
from routes.students import router as students_router
from routes.chat import router as chat_router
from routes.classes import router as classes_router
from database import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="EduSaaS API", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(students_router)
app.include_router(chat_router)
app.include_router(classes_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to EduSaaS API (SQLite)"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
