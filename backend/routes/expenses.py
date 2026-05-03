import os
import uuid
import re
import html
import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models import ExpenseCreate, ExpenseResponse, ExpenseDB
from routes.auth import require_admin_or_super
from pydantic import BaseModel

router = APIRouter(prefix="/expenses", tags=["expenses"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads", "expenses")
os.makedirs(UPLOAD_DIR, exist_ok=True)

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXPENSE_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"}

def sanitize_string(value: str) -> str:
    return html.escape(value.strip())[:200]

def validate_filename(filename: str) -> str:
    name = os.path.basename(filename)
    name = re.sub(r'[^\w\-.]', '_', name)
    return name

@router.get("/")
def get_expenses(category: str = None, db: Session = Depends(get_db), current_user=Depends(require_admin_or_super)):
    query = db.query(ExpenseDB)
    if current_user.role != "Super Admin":
        query = query.filter(ExpenseDB.school_id == current_user.school_id)
    if category and category != "All":
        query = query.filter(ExpenseDB.category == category)
    items = query.order_by(ExpenseDB.created_at.desc()).all()
    return [{
        "id": e.id,
        "title": e.title,
        "category": e.category,
        "amount": e.amount,
        "description": e.description,
        "file_url": e.file_url,
        "created_by": e.created_by,
        "created_by_name": e.created_by_name,
        "created_at": e.created_at.isoformat()
    } for e in items]

@router.post("/", response_model=ExpenseResponse)
async def create_expense(
    title: str = Form(...),
    category: str = Form(...),
    amount: int = Form(...),
    description: str = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_super)
):
    title = sanitize_string(title)
    description = sanitize_string(description) if description else None
    
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    if amount > 10000000:
        raise HTTPException(status_code=400, detail="Amount exceeds maximum limit")
    
    file_url = None
    if file and file.filename:
        safe_filename = validate_filename(file.filename)
        ext = os.path.splitext(safe_filename)[1].lower()
        
        if ext not in ALLOWED_EXPENSE_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXPENSE_EXTENSIONS)}")
        
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
        
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as f:
            f.write(content)
        
        file_url = f"/uploads/expenses/{filename}"

    db_expense = ExpenseDB(
        title=title,
        category=category,
        amount=amount,
        description=description,
        file_url=file_url,
        created_by=current_user.id,
        created_by_name=current_user.name,
        school_id=current_user.school_id or 1
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_super)
):
    query = db.query(ExpenseDB).filter(ExpenseDB.id == expense_id)
    if current_user.role != "Super Admin":
        query = query.filter(ExpenseDB.school_id == current_user.school_id)
    expense = query.first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if expense.file_url:
        filepath = os.path.join(UPLOAD_DIR, os.path.basename(expense.file_url))
        if os.path.exists(filepath) and os.path.commonpath([filepath, UPLOAD_DIR]) == UPLOAD_DIR:
            os.remove(filepath)
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user=Depends(require_admin_or_super)):
    query = db.query(ExpenseDB)
    if current_user.role != "Super Admin":
        query = query.filter(ExpenseDB.school_id == current_user.school_id)
    expenses = query.all()
    total = sum(e.amount for e in expenses)
    by_category = {}
    for e in expenses:
        by_category[e.category] = by_category.get(e.category, 0) + e.amount
    return {
        "totalExpenses": total,
        "byCategory": by_category,
        "count": len(expenses)
    }

class AIAnalysisRequest(BaseModel):
    pass

@router.post("/analyze")
async def analyze_expenses(
    request: AIAnalysisRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_super)
):
    query = db.query(ExpenseDB)
    if current_user.role != "Super Admin":
        query = query.filter(ExpenseDB.school_id == current_user.school_id)
    expenses = query.all()
    if not expenses:
        return {"analysis": "No expenses recorded yet."}

    expense_text = ""
    for e in expenses:
        expense_text += f"- {e.title}: {e.amount} DH ({e.category}) - {e.description or 'No details'}\n"

    prompt = f"""You are a financial advisor for a Moroccan school. Analyze these expenses and provide:

1. Total spending summary
2. Breakdown by category with percentages
3. Identify the biggest expenses and suggest where to reduce costs
4. Recommendations for better budget management
5. Flag any unusual or suspicious expenses

Expenses:
{expense_text}

Respond in French. Keep it concise and practical. Use bullet points."""

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:5173",
                    "X-Title": "EduSaaS Expenses"
                },
                json={
                    "model": "google/gemini-2.0-flash-001",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 2000,
                    "temperature": 0.7
                }
            )
            if response.status_code != 200:
                raise HTTPException(status_code=502, detail="AI service temporarily unavailable")
            data = response.json()
            return {"analysis": data["choices"][0]["message"]["content"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="AI analysis failed")
