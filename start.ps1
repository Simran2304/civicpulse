Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Starting CivicPulse AI - Urban Operations System" -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app:app --host 127.0.0.1 --port 8000"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npx vite --host 127.0.0.1 --port 5173"

Write-Host "Both servers launched!" -ForegroundColor Green
Write-Host "Unified App: http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "Vite Dev:    http://127.0.0.1:5173" -ForegroundColor Yellow
