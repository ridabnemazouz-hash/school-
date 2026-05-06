@echo off
cd /d C:\Users\hp\Desktop\rida30\backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
pause