import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from routes.auth import get_current_user
import httpx
from pydantic import BaseModel

router = APIRouter(prefix="/ai-tutor", tags=["ai-tutor"])

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPT = """You are a helpful, patient, and encouraging AI tutor for Moroccan school students. 
You help students understand their lessons, answer questions about their studies, and create study programs.

Rules:
- Always respond in the language the student uses (French, English, or Arabic)
- Be encouraging and never make the student feel bad for not understanding
- Break down complex topics into simple, easy-to-understand explanations
- When creating study programs, organize them by day with specific topics and time estimates
- Give practical examples and exercises when explaining concepts
- Keep responses concise and well-structured
- If asked about a subject you're not sure about, say so honestly
- Never give direct answers to homework - guide the student to find the answer themselves
"""

def require_student_or_teacher(current_user=Depends(get_current_user)):
    if current_user.role not in ["Student", "Teacher", "Admin", "Super Admin", "Parent"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return current_user

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]

class ChatResponse(BaseModel):
    content: str

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user=Depends(require_student_or_teacher)
):
    system_msg = SYSTEM_PROMPT + f"\n\nStudent name: {current_user.name}"
    
    messages = [{"role": "system", "content": system_msg}]
    for msg in request.messages:
        messages.append({"role": msg.role, "content": msg.content})

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:5173",
                    "X-Title": "EduSaaS AI Tutor"
                },
                json={
                    "model": "google/gemini-2.0-flash-001",
                    "messages": messages,
                    "max_tokens": 2000,
                    "temperature": 0.7
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=502, detail=f"AI service error: {response.text}")
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            return ChatResponse(content=content)
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/study-plan", response_model=ChatResponse)
async def create_study_plan(
    request: ChatRequest,
    current_user=Depends(require_student_or_teacher)
):
    system_msg = f"""You are an expert study planner for Moroccan school students.
Create a detailed, realistic study plan based on the student's needs.

Format the response as:
- 📅 **Day 1**: Topic - Time needed
- 📝 Key points to focus on
- ✅ Practice exercises

Student: {current_user.name}
Be encouraging and make the plan achievable."""

    messages = [{"role": "system", "content": system_msg}]
    for msg in request.messages:
        messages.append({"role": msg.role, "content": msg.content})

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:5173",
                    "X-Title": "EduSaaS AI Tutor"
                },
                json={
                    "model": "google/gemini-2.0-flash-001",
                    "messages": messages,
                    "max_tokens": 2000,
                    "temperature": 0.7
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=502, detail=f"AI service error: {response.text}")
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            return ChatResponse(content=content)
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
