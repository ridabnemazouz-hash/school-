from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import PaymentCreate, PaymentUpdate, PaymentResponse, PaymentDB
from routes.auth import require_admin_or_super, get_current_user
from fastapi.responses import StreamingResponse
from fpdf import FPDF
import io, datetime

router = APIRouter(prefix="/payments", tags=["payments"])

@router.get("/")
def get_payments(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    query = db.query(PaymentDB)
    if current_user.school_id is not None:
        query = query.filter(PaymentDB.school_id == current_user.school_id)
    if current_user.role == "Parent":
        query = query.filter(PaymentDB.parent_id == current_user.id)
    elif current_user.role not in ["Admin", "Super Admin"]:
        query = query.filter(PaymentDB.parent_name == current_user.name)
    payments = query.order_by(PaymentDB.created_at.desc()).all()
    return [{
        "id": p.id,
        "student_name": p.student_name,
        "parent_id": p.parent_id,
        "parent_name": p.parent_name,
        "month": p.month,
        "amount": p.amount,
        "status": p.status,
        "payment_method": p.payment_method,
        "payment_date": p.payment_date.isoformat() if p.payment_date else None,
        "created_at": p.created_at.isoformat()
    } for p in payments]

@router.post("/", response_model=PaymentResponse)
def create_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role not in ["Parent", "Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Only Parents and Admins can create payments")

    existing = db.query(PaymentDB).filter(
        PaymentDB.student_name == data.student_name,
        PaymentDB.month == data.month
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Payment for this month already exists")

    is_paid = data.payment_method is not None
    db_payment = PaymentDB(
        student_name=data.student_name,
        parent_id=current_user.id,
        parent_name=current_user.name,
        month=data.month,
        amount=data.amount,
        status="Paid" if is_paid else "Pending",
        payment_method=data.payment_method,
        payment_date=datetime.datetime.utcnow() if is_paid else None,
        school_id=current_user.school_id or 1
    )
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

@router.put("/{payment_id}")
def update_payment(
    payment_id: int,
    data: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_super)
):
    query = db.query(PaymentDB).filter(PaymentDB.id == payment_id)
    if current_user.school_id is not None:
        query = query.filter(PaymentDB.school_id == current_user.school_id)
    payment = query.first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if data.status:
        payment.status = data.status
    if data.payment_method:
        payment.payment_method = data.payment_method
    if data.status == "Paid" and not payment.payment_date:
        payment.payment_date = datetime.datetime.utcnow()

    db.commit()
    db.refresh(payment)
    return {
        "id": payment.id,
        "student_name": payment.student_name,
        "month": payment.month,
        "amount": payment.amount,
        "status": payment.status,
        "payment_method": payment.payment_method,
        "payment_date": payment.payment_date.isoformat() if payment.payment_date else None
    }

@router.delete("/{payment_id}")
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_super)
):
    query = db.query(PaymentDB).filter(PaymentDB.id == payment_id)
    if current_user.school_id is not None:
        query = query.filter(PaymentDB.school_id == current_user.school_id)
    payment = query.first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    db.delete(payment)
    db.commit()
    return {"message": "Payment deleted successfully"}

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    query = db.query(PaymentDB)
    if current_user.school_id is not None:
        query = query.filter(PaymentDB.school_id == current_user.school_id)
    if current_user.role == "Parent":
        query = query.filter(PaymentDB.parent_id == current_user.id)

    all_payments = query.all()
    total_revenue = sum(p.amount for p in all_payments if p.status == "Paid")
    outstanding = sum(p.amount for p in all_payments if p.status == "Pending")
    collected = total_revenue

    now = datetime.datetime.utcnow()
    current_month = now.strftime("%B %Y")
    this_month = [p for p in all_payments if p.month == current_month]
    month_revenue = sum(p.amount for p in this_month if p.status == "Paid")

    last_month = (now.replace(day=1) - datetime.timedelta(days=1)).strftime("%B %Y")
    last_month_payments = [p for p in all_payments if p.month == last_month]
    last_month_revenue = sum(p.amount for p in last_month_payments if p.status == "Paid")

    growth = 0
    if last_month_revenue > 0:
        growth = round(((month_revenue - last_month_revenue) / last_month_revenue) * 100, 1)
    elif month_revenue > 0:
        growth = 100

    return {
        "totalRevenue": total_revenue,
        "outstanding": outstanding,
        "collected": collected,
        "monthGrowth": growth
    }

class ReceiptPDF:
    def generate(self, payment, student_name, parent_name):
        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=25)
        W = 210
        margin = 20
        content_w = W - 2 * margin

        # === HEADER ===
        pdf.set_fill_color(30, 41, 59)
        pdf.rect(0, 0, W, 50, 'F')
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Helvetica", "B", 26)
        pdf.set_xy(margin, 12)
        pdf.cell(content_w, 14, "GRADUATION SCHOOL", align="C")
        pdf.set_font("Helvetica", "", 12)
        pdf.set_text_color(148, 163, 184)
        pdf.set_xy(margin, 28)
        pdf.cell(content_w, 8, "FACTURE DE PAIEMENT - RECU OFFICIEL", align="C")

        # === INVOICE NUMBER BAR ===
        pdf.ln(28)
        pdf.set_fill_color(99, 102, 241)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Helvetica", "B", 12)
        badge_x = (W - 100) / 2
        pdf.set_x(badge_x)
        pdf.cell(100, 12, f"N  FACTURE:  FACT-{payment.id:04d}", fill=True, align="C", border=1)

        # === SECTION: INFORMATION ===
        pdf.ln(12)
        pdf.set_text_color(30, 41, 59)
        pdf.set_font("Helvetica", "B", 14)
        pdf.cell(0, 10, "Information du paiement", new_x="LMARGIN", new_y="NEXT")
        pdf.set_draw_color(226, 232, 240)
        pdf.set_line_width(0.5)
        pdf.line(margin, pdf.get_y(), W - margin, pdf.get_y())
        pdf.ln(4)

        # Info rows with alternating backgrounds
        details = [
            ("Nom de l'etudiant", student_name),
            ("Parent / Tuteur", parent_name),
            ("Mois de scolarite", payment.month),
            ("Methode de paiement", payment.payment_method or "N/A"),
            ("Date de paiement", payment.payment_date.strftime("%d/%m/%Y") if payment.payment_date else "N/A"),
            ("Statut", payment.status.upper()),
        ]

        for i, (label, value) in enumerate(details):
            bg_color = (248, 250, 252) if i % 2 == 0 else (255, 255, 255)
            pdf.set_fill_color(*bg_color)
            row_h = 10
            x = margin

            # Label cell
            pdf.set_xy(x, pdf.get_y())
            pdf.set_fill_color(*bg_color)
            pdf.set_text_color(100, 116, 139)
            pdf.set_font("Helvetica", "B", 11)
            pdf.cell(content_w * 0.4, row_h, f"  {label}", fill=True)

            # Value cell
            pdf.set_text_color(30, 41, 59)
            pdf.set_font("Helvetica", "", 11)
            pdf.cell(content_w * 0.6, row_h, f"  {str(value)}", fill=True, new_x="LMARGIN", new_y="NEXT")

        # === TOTAL AMOUNT BOX ===
        pdf.ln(8)
        box_h = 20
        pdf.set_fill_color(99, 102, 241)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Helvetica", "B", 18)
        pdf.set_xy(margin, pdf.get_y())
        pdf.cell(content_w, box_h, f"TOTAL PAYE:  {payment.amount} DH", fill=True, align="C", border=1)

        # === FOOTER ===
        pdf.ln(15)
        pdf.set_draw_color(226, 232, 240)
        pdf.set_line_width(0.3)
        pdf.line(margin, pdf.get_y(), W - margin, pdf.get_y())
        pdf.ln(5)
        pdf.set_font("Helvetica", "I", 9)
        pdf.set_text_color(148, 163, 184)
        pdf.cell(0, 6, "Ce document fait office de preuve de paiement officielle.", align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.cell(0, 6, f"Genere le {datetime.datetime.utcnow().strftime('%d/%m/%Y a %H:%M')}", align="C", new_x="LMARGIN", new_y="NEXT")

        return pdf.output()

@router.get("/{payment_id}/receipt")
def download_receipt(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(PaymentDB).filter(PaymentDB.id == payment_id)
    if current_user.school_id is not None:
        query = query.filter(PaymentDB.school_id == current_user.school_id)
    payment = query.first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if current_user.role not in ["Admin", "Super Admin"] and payment.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    pdf = ReceiptPDF()
    pdf_bytes = pdf.generate(payment, payment.student_name, payment.parent_name)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="Facture-{payment.id:04d}.pdf"'}
    )
