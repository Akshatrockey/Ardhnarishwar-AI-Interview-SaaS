@echo off
title Ardhnarishwar AI Interview SaaS - Public Global URL
echo =========================================================
echo   Starting Ardhnarishwar AI SaaS - Public HTTPS Tunnel
echo =========================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Python FastAPI Backend on port 8000...
start "" cmd /c "set PYTHONPATH=backend&& .\backend\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000"

echo [2/3] Starting Vite Frontend on port 5173...
start "" cmd /c "npm run dev -- --host"

timeout /t 3 >nul

echo.
echo [3/3] Creating Global HTTPS Public Tunnel...
echo.
echo Connecting to tunnel network. Your live public URL will appear below:
echo ====================================================================
echo.

:tunnel_loop
ssh -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o StrictHostKeyChecking=no -T -R 80:localhost:5173 nokey@localhost.run
echo.
echo Tunnel connection lost. Reconnecting in 5 seconds...
timeout /t 5 >nul
goto tunnel_loop
