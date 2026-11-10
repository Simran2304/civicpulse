@echo off
echo =======================================================
echo   Starting CivicPulse AI - Urban Operations System
echo =======================================================

echo Starting FastAPI Backend on port 8000...
start cmd /k "cd backend && python -m uvicorn app:app --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak >nul

echo Starting Frontend on port 5173...
start cmd /k "cd frontend && npx vite --host 127.0.0.1 --port 5173"

echo.
echo Both servers are launching!
echo Unified App URL: http://127.0.0.1:8000
echo Frontend Dev URL: http://127.0.0.1:5173
echo =======================================================
