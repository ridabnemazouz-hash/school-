from sqlalchemy import Column, Integer, String, DateTime
from database import Base
import datetime
from pydantic import BaseModel, EmailStr

# SQLAlchemy Model (DB Table)
class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    role = Column(String)
    hashed_password = Column(String)
    status = Column(String, default="Pending")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# Pydantic Models (Validation)
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# Student Models
class StudentDB(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    grade = Column(String)
    student_class = Column(String)
    attendance = Column(String, default="100%")
    gpa = Column(String, default="0.0")

class StudentCreate(BaseModel):
    name: str
    grade: str
    student_class: str
    attendance: str = "100%"
    gpa: str = "0.0"
