@echo off
title Ardhnarishwar AI Interview SaaS - Local Server
echo ===================================================
echo   Starting Ardhnarishwar AI Interview SaaS (Local)
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Python FastAPI Backend on port 8000...
start "" cmd /c "set PYTHONPATH=backend&& .\backend\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000"

echo [2/2] Starting Vite Frontend on port 5173...
start "" cmd /c "npm run dev -- --host"

timeout /t 3 >nul
echo.
echo Opening Platform in default browser: http://localhost:5173
start http://localhost:5173

echo.
echo Platform is active! Keep this window open or minimize it.
pause
