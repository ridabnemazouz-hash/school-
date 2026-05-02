from sqlalchemy import Column, Integer, String, DateTime, Boolean
from database import Base
import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional, List

# SQLAlchemy Models
class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    role = Column(String)
    hashed_password = Column(String)
    status = Column(String, default="Pending")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class StudentDB(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    grade = Column(String)
    student_class = Column(String)
    attendance = Column(String, default="100%")
    gpa = Column(String, default="0.0")

class ClassDB(Base):
    __tablename__ = "classes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    level = Column(String)  # ابتدائي, إعدادي, ثانوي
    grade = Column(String)  # 1-6, 7-9, 10-12
    teacher = Column(String)
    capacity = Column(Integer, default=30)
    students_count = Column(Integer, default=0)

class MessageDB(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer)
    receiver_id = Column(Integer)
    content = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    is_read = Column(Boolean, default=False)

# Pydantic Schemas
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

class StudentCreate(BaseModel):
    name: str
    grade: str
    student_class: str
    attendance: str = "100%"
    gpa: str = "0.0"

class ClassCreate(BaseModel):
    name: str
    level: str
    grade: str
    teacher: str
    capacity: int = 30

class MessageBase(BaseModel):
    receiver_id: int
    content: str

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    sender_id: int
    timestamp: datetime.datetime
    is_read: bool
    class Config:
        from_attributes = True
