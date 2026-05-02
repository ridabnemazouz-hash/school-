import os
import uuid
import re
import html
import io
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fpdf import FPDF
from sqlalchemy.orm import Session
from database import get_db
from models import SalaryUpdate, SalaryResponse, SalaryDB
from routes.auth import require_admin_or_super

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads", "salaries")
router = APIRouter(prefix="/salaries", tags=["salaries"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads", "salaries")
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_RECEIPT_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}

def sanitize_string(value: str) -> str:
    return html.escape(value.strip())[:200]

def validate_filename(filename: str) -> str:
    name = os.path.basename(filename)
    name = re.sub(r'[^\w\-.]', '_', name)
    return name

@router.get("/")
def get_salaries(month: str = None, status: str = None, db: Session = Depends(get_db), current_user=Depends(require_admin_or_super)):
    query = db.query(SalaryDB)
    if month and month != "All":
        query = query.filter(SalaryDB.month == month)
    if status and status != "All":
        query = query.filter(SalaryDB.status == status)
    items = query.order_by(SalaryDB.created_at.desc()).all()
    return [{
        "id": s.id,
        "teacher_id": s.teacher_id,
        "teacher_name": s.teacher_name,
        "month": s.month,
        "amount": s.amount,
        "status": s.status,
        "payment_date": s.payment_date.isoformat() if s.payment_date else None,
        "notes": s.notes,
        "file_url": s.file_url,
        "created_by": s.created_by,
        "created_by_name": s.created_by_name,
        "created_at": s.created_at.isoformat()
    } for s in items]

@router.post("/", response_model=SalaryResponse)
async def create_salary(
    teacher_id: int = Form(...),
    teacher_name: str = Form(...),
    month: str = Form(...),
    amount: int = Form(...),
    notes: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_super)
):
    teacher_name = sanitize_string(teacher_name)
    notes = sanitize_string(notes) if notes else None
    
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    if amount > 10000000:
        raise HTTPException(status_code=400, detail="Amount exceeds maximum limit")

    file_url = None
    if file and file.filename:
        safe_filename = validate_filename(file.filename)
        ext = os.path.splitext(safe_filename)[1].lower()
        
        if ext not in ALLOWED_RECEIPT_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_RECEIPT_EXTENSIONS)}")
        
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
        
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as f:
            f.write(content)
        
        file_url = f"/uploads/salaries/{filename}"

    db_salary = SalaryDB(
        teacher_id=teacher_id,
        teacher_name=teacher_name,
        month=month,
        amount=amount,
        status="Pending",
        notes=notes,
        file_url=file_url,
        created_by=current_user.id,
        created_by_name=current_user.name
    )
    db.add(db_salary)
    db.commit()
    db.refresh(db_salary)
    return db_salary

@router.put("/{salary_id}", response_model=SalaryResponse)
async def update_salary(
    salary_id: int,
    amount: Optional[int] = Form(None),
    status: Optional[str] = Form(None),
    payment_date: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_super)
):
    salary = db.query(SalaryDB).filter(SalaryDB.id == salary_id).first()
    if not salary:
        raise HTTPException(status_code=404, detail="Salary not found")
    
    if amount is not None:
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be positive")
        salary.amount = amount
    
    if status is not None:
        salary.status = status
    
    if payment_date is not None:
        import datetime
        salary.payment_date = datetime.datetime.fromisoformat(payment_date)
    
    if notes is not None:
        salary.notes = sanitize_string(notes)
    
    if file and file.filename:
        safe_filename = validate_filename(file.filename)
        ext = os.path.splitext(safe_filename)[1].lower()
        
        if ext not in ALLOWED_RECEIPT_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_RECEIPT_EXTENSIONS)}")
        
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
        
        if salary.file_url:
            old_filepath = os.path.join(UPLOAD_DIR, os.path.basename(salary.file_url))
            if os.path.exists(old_filepath) and os.path.commonpath([old_filepath, UPLOAD_DIR]) == UPLOAD_DIR:
                os.remove(old_filepath)
        
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as f:
            f.write(content)
        
        salary.file_url = f"/uploads/salaries/{filename}"
    
    db.commit()
    db.refresh(salary)
    return salary

@router.delete("/{salary_id}")
def delete_salary(
    salary_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_super)
):
    salary = db.query(SalaryDB).filter(SalaryDB.id == salary_id).first()
    if not salary:
        raise HTTPException(status_code=404, detail="Salary not found")
    if salary.file_url:
        filepath = os.path.join(UPLOAD_DIR, os.path.basename(salary.file_url))
        if os.path.exists(filepath) and os.path.commonpath([filepath, UPLOAD_DIR]) == UPLOAD_DIR:
            os.remove(filepath)
    db.delete(salary)
    db.commit()
    return {"message": "Salary deleted successfully"}

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user=Depends(require_admin_or_super)):
    salaries = db.query(SalaryDB).all()
    total = sum(s.amount for s in salaries)
    paid = sum(s.amount for s in salaries if s.status == "Paid")
    pending = sum(s.amount for s in salaries if s.status == "Pending")
    paid_count = len([s for s in salaries if s.status == "Paid"])
    pending_count = len([s for s in salaries if s.status == "Pending"])
    return {
        "totalSalaries": total,
        "totalPaid": paid,
        "totalPending": pending,
        "paidCount": paid_count,
        "pendingCount": pending_count,
        "count": len(salaries)
    }

@router.get("/{salary_id}/receipt")
def generate_receipt(
    salary_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_super)
):
    salary = db.query(SalaryDB).filter(SalaryDB.id == salary_id).first()
    if not salary:
        raise HTTPException(status_code=404, detail="Salary not found")

    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=30)

    pdf.set_font('Helvetica', 'B', 20)
    pdf.set_text_color(33, 33, 50)
    pdf.cell(0, 15, 'RECU DE SALAIRE', center=True)
    pdf.ln(20)

    pdf.set_draw_color(99, 102, 241)
    pdf.set_line_width(0.8)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(5)

    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(80, 80, 80)
    pay_date = salary.payment_date.strftime('%d/%m/%Y') if salary.payment_date else '-'
    pdf.cell(95, 8, f'N recu: SAL-{salary.id:04d}')
    pdf.cell(0, 8, f'Date: {pay_date}', align='R')
    pdf.ln(10)

    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(33, 33, 50)
    pdf.cell(0, 8, 'Details du paiement:')
    pdf.ln(10)

    rows = [
        ('Enseignant', salary.teacher_name),
        ('Mois', salary.month),
        ('Montant', f'{salary.amount:,.0f} DH'),
        ('Statut', salary.status),
        ('Date de paiement', pay_date),
        ('Notes', salary.notes if salary.notes else '-'),
        ('Cree par', salary.created_by_name),
    ]

    pdf.set_font('Helvetica', '', 10)
    for label, value in rows:
        pdf.set_font('Helvetica', 'B', 10)
        pdf.set_text_color(99, 102, 241)
        pdf.cell(55, 8, label)
        pdf.set_font('Helvetica', '', 10)
        pdf.set_text_color(33, 33, 50)
        pdf.cell(0, 8, str(value))
        pdf.ln(8)

    pdf.ln(5)
    pdf.set_draw_color(99, 102, 241)
    pdf.set_line_width(0.3)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(8)

    pdf.set_font('Helvetica', 'B', 16)
    if salary.status == 'Paid':
        pdf.set_text_color(16, 185, 129)
    else:
        pdf.set_text_color(245, 158, 11)
    pdf.cell(0, 15, f'Montant Total: {salary.amount:,.0f} DH', center=True)

    pdf.ln(12)
    pdf.set_font('Helvetica', 'I', 9)
    pdf.set_text_color(128, 128, 128)
    pdf.cell(0, 8, 'Ce document sert de recu officiel de paiement.', center=True)
    pdf.ln(6)
    now_str = datetime.datetime.now().strftime('%d/%m/%Y a %H:%M')
    pdf.cell(0, 6, f'Genere le {now_str}', center=True)

    pdf_bytes = pdf.output()
    filename = f"Recu-Salaire-{salary.teacher_name.replace(' ', '-')}-{salary.month.replace(' ', '-')}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type='application/pdf',
        headers={'Content-Disposition': f'attachment; filename="{filename}"'}
    )
