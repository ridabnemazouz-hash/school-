# Start EduSaaS Servers
# Double-click this file to start both backend and frontend

Write-Host "Starting Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Users\hp\Desktop\rida30\backend; python -m uvicorn main:app --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 3

Write-Host "Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Users\hp\Desktop\rida30\frontend; npm run dev"

Start-Sleep -Seconds 3

Write-Host "`nServers running:" -ForegroundColor Green
Write-Host "  Backend: http://localhost:8000" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "`nPress Ctrl+C in the windows to stop servers" -ForegroundColor Gray
Read-Host