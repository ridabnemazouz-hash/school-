from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from database import Base
import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional, List

# SQLAlchemy Models
class SchoolDB(Base):
    __tablename__ = "schools"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    code = Column(String, unique=True, index=True)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    subscription_plan = Column(String, default="Free")  # Free, Basic, Premium, Enterprise
    subscription_status = Column(String, default="Active")  # Active, Expired, Cancelled
    subscription_expiry = Column(String, nullable=True)
    max_students = Column(Integer, default=50)
    max_teachers = Column(Integer, default=10)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, nullable=True, index=True)
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
    school_id = Column(Integer, nullable=True, index=True)
    event_type = Column(String, index=True)
    email = Column(String, nullable=True, index=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class StudentDB(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, nullable=True, index=True)
    user_id = Column(Integer, nullable=True, unique=True)
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
    school_id = Column(Integer, nullable=True, index=True)
    name = Column(String, index=True)
    level = Column(String)
    grade = Column(String)
    teacher = Column(String)
    capacity = Column(Integer, default=30)
    students_count = Column(Integer, default=0)

class SubjectDB(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, nullable=True, index=True)
    name = Column(String, index=True)
    code = Column(String)
    coefficient = Column(Integer, default=1)
    color = Column(String, default="#6366f1")

class TeacherClassDB(Base):
    __tablename__ = "teacher_classes"
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, nullable=True, index=True)
    teacher_id = Column(Integer, index=True)
    teacher_name = Column(String)
    class_id = Column(Integer, index=True)
    class_name = Column(String)
    subject_id = Column(Integer, index=True)
    subject_name = Column(String)

class NoteDB(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, nullable=True, index=True)
    student_id = Column(Integer, index=True)
    student_name = Column(String)
    student_class = Column(String)
    subject_id = Column(Integer, index=True)
    subject_name = Column(String)
    exam_type = Column(String)
    note = Column(String)
    coefficient = Column(Integer, default=1)
    semester = Column(String, default="S1")
    academic_year = Column(String, default="2025-2026")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ScheduleEntryDB(Base):
    __tablename__ = "schedule"
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, nullable=True, index=True)
    class_id = Column(Integer, index=True)
    class_name = Column(String)
    subject_id = Column(Integer, index=True)
    subject_name = Column(String)
    teacher_id = Column(Integer, index=True)
    teacher_name = Column(String)
    day = Column(String)
    start_time = Column(String)
    end_time = Column(String)
    room = Column(String, nullable=True)

class MessageDB(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, nullable=True, index=True)
    sender_id = Column(Integer)
    receiver_id = Column(Integer)
    content = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    is_read = Column(Boolean, default=False)
    is_group = Column(Boolean, default=False)

class ContentDB(Base):
    __tablename__ = "content"
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, nullable=True, index=True)
    title = Column(String, index=True)
    subject = Column(String)
    content_type = Column(String)
    file_url = Column(String, nullable=True)
    description = Column(String, nullable=True)
    teacher_id = Column(Integer)
    teacher_name = Column(String)
    target_class = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class PaymentDB(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, nullable=True, index=True)
    student_name = Column(String, index=True)
    parent_id = Column(Integer)
    parent_name = Column(String)
    month = Column(String)
    amount = Column(Integer)
    status = Column(String, default="Pending")
    payment_method = Column(String, nullable=True)
    payment_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ExpenseDB(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, nullable=True, index=True)
    title = Column(String, index=True)
    category = Column(String)
    amount = Column(Integer)
    description = Column(String, nullable=True)
    file_url = Column(String, nullable=True)
    created_by = Column(Integer)
    created_by_name = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SalaryDB(Base):
    __tablename__ = "salaries"
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, nullable=True, index=True)
    teacher_id = Column(Integer, index=True)
    teacher_name = Column(String, index=True)
    month = Column(String)
    amount = Column(Integer)
    status = Column(String, default="Pending")
    payment_date = Column(DateTime, nullable=True)
    notes = Column(String, nullable=True)
    file_url = Column(String, nullable=True)
    created_by = Column(Integer)
    created_by_name = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class VideoRoomDB(Base):
    __tablename__ = "video_rooms"
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, nullable=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    teacher_id = Column(Integer, index=True)
    teacher_name = Column(String)
    subject = Column(String, nullable=True)
    room_code = Column(String, unique=True, index=True)
    max_participants = Column(Integer, default=30)
    status = Column(String, default="scheduled")
    scheduled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

class FeatureFlagDB(Base):
    __tablename__ = "feature_flags"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    name = Column(String)
    enabled = Column(Boolean, default=True)
    description = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

# Pydantic Schemas
class SchoolCreate(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    subscription_plan: str = "Free"
    max_students: int = 50
    max_teachers: int = 10
    super_admin_name: Optional[str] = None
    super_admin_email: Optional[str] = None
    super_admin_password: Optional[str] = None

class SchoolUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    subscription_plan: Optional[str] = None
    subscription_status: Optional[str] = None
    subscription_expiry: Optional[str] = None
    max_students: Optional[int] = None
    max_teachers: Optional[int] = None
    is_active: Optional[bool] = None

class SchoolResponse(BaseModel):
    id: int
    name: str
    code: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None
    subscription_plan: str
    subscription_status: str
    subscription_expiry: Optional[str] = None
    max_students: int
    max_teachers: int
    is_active: bool
    created_at: Optional[datetime.datetime] = None
    class Config:
        from_attributes = True

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

class SubjectCreate(BaseModel):
    name: str
    code: str
    coefficient: int = 1
    color: str = "#6366f1"

class SubjectResponse(BaseModel):
    id: int
    name: str
    code: str
    coefficient: int
    color: str
    class Config:
        from_attributes = True

class TeacherClassCreate(BaseModel):
    teacher_id: int
    teacher_name: str
    class_id: int
    class_name: str
    subject_id: int
    subject_name: str

class TeacherClassResponse(BaseModel):
    id: int
    teacher_id: int
    teacher_name: str
    class_id: int
    class_name: str
    subject_id: int
    subject_name: str
    class Config:
        from_attributes = True

class NoteCreate(BaseModel):
    student_id: int
    student_name: str
    student_class: str
    subject_id: int
    subject_name: str
    exam_type: str
    note: str
    coefficient: int = 1
    semester: str = "S1"
    academic_year: str = "2025-2026"

class NoteResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    student_class: str
    subject_id: int
    subject_name: str
    exam_type: str
    note: str
    coefficient: int
    semester: str
    academic_year: str
    class Config:
        from_attributes = True

class ScheduleEntryCreate(BaseModel):
    class_id: int
    class_name: str
    subject_id: int
    subject_name: str
    teacher_id: int
    teacher_name: str
    day: str
    start_time: str
    end_time: str
    room: Optional[str] = None

class ScheduleEntryResponse(BaseModel):
    id: int
    class_id: int
    class_name: str
    subject_id: int
    subject_name: str
    teacher_id: int
    teacher_name: str
    day: str
    start_time: str
    end_time: str
    room: Optional[str] = None
    class Config:
        from_attributes = True

# === ENTERPRISE MODELS ===

class BlockedIP(Base):
    __tablename__ = "blocked_ips"
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, index=True)
    reason = Column(String, nullable=True)
    blocked_by = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

class SecurityIncident(Base):
    __tablename__ = "security_incidents"
    id = Column(Integer, primary_key=True, index=True)
    incident_type = Column(String, index=True)  # hack_attempt, brute_force, sql_injection, xss, suspicious_login
    severity = Column(String, default="medium")  # low, medium, high, critical
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    target = Column(String, nullable=True)
    payload = Column(Text, nullable=True)
    details = Column(Text, nullable=True)
    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class BackupRecord(Base):
    __tablename__ = "backup_records"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    size_mb = Column(Integer, default=0)
    backup_type = Column(String, default="manual")  # manual, auto
    status = Column(String, default="completed")  # pending, completed, failed, restoring
    triggered_by = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class IntegrationConfig(Base):
    __tablename__ = "integration_configs"
    id = Column(Integer, primary_key=True, index=True)
    service = Column(String, unique=True, index=True)  # stripe, smtp, sms, etc.
    config = Column(Text)  # JSON string
    is_active = Column(Boolean, default=False)
    last_tested = Column(DateTime, nullable=True)
    test_status = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class AlertRule(Base):
    __tablename__ = "alert_rules"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    rule_type = Column(String)  # server_down, db_slow, error_spike, high_churn, payment_failed
    threshold = Column(Integer, nullable=True)
    condition = Column(String, nullable=True)
    enabled = Column(Boolean, default=True)
    notification_channels = Column(String, default="dashboard")  # dashboard, email, sms
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AlertNotification(Base):
    __tablename__ = "alert_notifications"
    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, nullable=True)
    severity = Column(String, default="medium")
    title = Column(String)
    message = Column(Text)
    channel = Column(String, default="dashboard")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ABTest(Base):
    __tablename__ = "ab_tests"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    feature_key = Column(String)
    variant_a_name = Column(String, default="A")
    variant_b_name = Column(String, default="B")
    traffic_split = Column(Integer, default=50)  # percentage for B
    target_schools = Column(Text, nullable=True)  # JSON list of school IDs
    status = Column(String, default="draft")  # draft, running, completed
    results = Column(Text, nullable=True)  # JSON
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)

class MigrationRecord(Base):
    __tablename__ = "migration_records"
    id = Column(Integer, primary_key=True, index=True)
    migration_name = Column(String, unique=True, index=True)
    status = Column(String, default="pending")  # pending, applied, rolled_back, failed
    applied_at = Column(DateTime, nullable=True)
    rolled_back_at = Column(DateTime, nullable=True)
    details = Column(Text, nullable=True)

class ActivityEvent(Base):
    __tablename__ = "activity_events"
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, index=True)  # school_created, user_login, payment_received, etc.
    entity_type = Column(String, nullable=True)
    entity_id = Column(Integer, nullable=True)
    school_id = Column(Integer, nullable=True)
    user_email = Column(String, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class BillingMetric(Base):
    __tablename__ = "billing_metrics"
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, nullable=True, index=True)
    metric_type = Column(String, index=True)  # revenue, churn, ltv, mrr
    value = Column(Integer)  # in cents
    period = Column(String)  # e.g. "2025-01"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ReportRecord(Base):
    __tablename__ = "report_records"
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, nullable=True)
    report_type = Column(String)  # financial, attendance, academic, security
    format = Column(String, default="pdf")
    status = Column(String, default="pending")
    file_url = Column(String, nullable=True)
    generated_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
