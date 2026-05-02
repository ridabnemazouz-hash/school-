from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
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
    refresh_token = Column(String, nullable=True)
    status = Column(String, default="Pending")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SecurityLogDB(Base):
    __tablename__ = "security_logs"
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, index=True)  # login_success, login_failed, token_refresh, rate_limit_blocked
    email = Column(String, nullable=True, index=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class StudentDB(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    grade = Column(String)
    student_class = Column(String)
    attendance = Column(String, default="100%")
    gpa = Column(String, default="0.0")
    date_of_birth = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)

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
    is_group = Column(Boolean, default=False)

class ContentDB(Base):
    __tablename__ = "content"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    subject = Column(String)
    content_type = Column(String)  # PDF, Video, Link, Document
    file_url = Column(String, nullable=True)
    description = Column(String, nullable=True)
    teacher_id = Column(Integer)
    teacher_name = Column(String)
    target_class = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class PaymentDB(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    student_name = Column(String, index=True)
    parent_id = Column(Integer)
    parent_name = Column(String)
    month = Column(String)  # e.g. "May 2026"
    amount = Column(Integer)  # in DH
    status = Column(String, default="Pending")  # Paid, Pending, Overdue
    payment_method = Column(String, nullable=True)  # Cash, Credit Card, Transfer
    payment_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ExpenseDB(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    category = Column(String)  # Repairs, Supplies, Utilities, Transport, Other
    amount = Column(Integer)  # in DH
    description = Column(String, nullable=True)
    file_url = Column(String, nullable=True)
    created_by = Column(Integer)
    created_by_name = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SalaryDB(Base):
    __tablename__ = "salaries"
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, index=True)
    teacher_name = Column(String, index=True)
    month = Column(String)  # e.g. "May 2026"
    amount = Column(Integer)  # in DH
    status = Column(String, default="Pending")  # Paid, Pending
    payment_date = Column(DateTime, nullable=True)
    notes = Column(String, nullable=True)
    file_url = Column(String, nullable=True)  # receipt PDF/image
    created_by = Column(Integer)
    created_by_name = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class VideoRoomDB(Base):
    __tablename__ = "video_rooms"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    teacher_id = Column(Integer, index=True)
    teacher_name = Column(String)
    subject = Column(String, nullable=True)
    room_code = Column(String, unique=True, index=True)
    max_participants = Column(Integer, default=30)
    status = Column(String, default="scheduled")  # scheduled, active, ended
    scheduled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

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
    date_of_birth: Optional[str] = None

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
    is_group: bool = False
    class Config:
        from_attributes = True

class ContentCreate(BaseModel):
    title: str
    subject: str
    content_type: str
    file_url: Optional[str] = None
    description: Optional[str] = None
    teacher_id: int
    teacher_name: str
    target_class: Optional[str] = None

class ContentResponse(BaseModel):
    id: int
    title: str
    subject: str
    content_type: str
    file_url: Optional[str] = None
    description: Optional[str] = None
    teacher_id: int
    teacher_name: str
    target_class: Optional[str] = None
    created_at: datetime.datetime
    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    student_name: str
    month: str
    amount: int = 1200
    payment_method: Optional[str] = None

class PaymentUpdate(BaseModel):
    status: Optional[str] = None
    payment_method: Optional[str] = None
    payment_date: Optional[datetime.datetime] = None

class PaymentResponse(BaseModel):
    id: int
    student_name: str
    parent_id: Optional[int] = None
    parent_name: Optional[str] = None
    month: str
    amount: int
    status: str
    payment_method: Optional[str] = None
    payment_date: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    class Config:
        from_attributes = True

class ExpenseCreate(BaseModel):
    title: str
    category: str
    amount: int
    description: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: int
    title: str
    category: str
    amount: int
    description: Optional[str] = None
    file_url: Optional[str] = None
    created_by: int
    created_by_name: str
    created_at: datetime.datetime
    class Config:
        from_attributes = True

class SalaryCreate(BaseModel):
    teacher_id: int
    teacher_name: str
    month: str
    amount: int
    notes: Optional[str] = None

class SalaryUpdate(BaseModel):
    amount: Optional[int] = None
    status: Optional[str] = None
    payment_date: Optional[datetime.datetime] = None
    notes: Optional[str] = None
    file_url: Optional[str] = None

class SalaryResponse(BaseModel):
    id: int
    teacher_id: int
    teacher_name: str
    month: str
    amount: int
    status: str
    payment_date: Optional[datetime.datetime] = None
    notes: Optional[str] = None
    file_url: Optional[str] = None
    created_by: int
    created_by_name: str
    created_at: datetime.datetime
    class Config:
        from_attributes = True

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class VideoRoomCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None
    max_participants: int = 30
    scheduled_at: Optional[datetime.datetime] = None

class VideoRoomResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    teacher_id: int
    teacher_name: str
    subject: Optional[str] = None
    room_code: str
    max_participants: int
    status: str
    scheduled_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    ended_at: Optional[datetime.datetime] = None
    class Config:
        from_attributes = True
