@echo off
title Ardhnarishwar AI SaaS - Production 1-Click Launcher
color 0B

echo ==============================================================================
echo        ARDHNARISHWAR AI INTERVIEW & ENTERPRISE HRMS SAAS PLATFORM
echo                     100%% REAL-TIME PRODUCTION LAUNCHER
echo ==============================================================================
echo.

cd /d "%~dp0"

echo [1/4] Checking Python & Node.js environment prerequisites...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not found in PATH. Please install Node.js 18+.
    pause
    exit /b 1
)

echo [2/4] Starting FastAPI High-Performance Backend on port 8000...
if exist "backend\.venv\Scripts\python.exe" (
    start "Ardhnarishwar-Backend" cmd /k "title Backend-8000 && cd /d %~dp0backend && .venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000"
) else if exist ".venv\Scripts\python.exe" (
    start "Ardhnarishwar-Backend" cmd /k "title Backend-8000 && cd /d %~dp0backend && ..\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000"
) else (
    start "Ardhnarishwar-Backend" cmd /k "title Backend-8000 && cd /d %~dp0backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000"
)

echo [3/4] Starting Vite Production Web Application on port 5173...
start "Ardhnarishwar-Frontend" cmd /k "title Frontend-5173 && cd /d %~dp0 && npm run dev -- --host 0.0.0.0 --port 5173"

timeout /t 3 >nul

echo [4/4] Launching Browser Interface & Global Public Link...
start "" "http://localhost:5173"

echo.
echo ==============================================================================
echo  LOCAL APPLICATION URL:   http://localhost:5173
echo  BACKEND REST API & DOCS: http://localhost:8000/docs
echo  ADMIN CREDENTIALS:       admin@ardhnarishwar.ai / SuperSecretAdminPass2026!
echo ==============================================================================
echo.
echo  Starting Global Public HTTPS Tunnel (Shareable Link for Mobile / Remote)...
echo  (Press Ctrl+C in this window at any time to stop the public tunnel)
echo ==============================================================================
echo.

if exist "tools\cloudflared.exe" (
    tools\cloudflared.exe tunnel --url http://localhost:5173
) else (
    npx --yes localtunnel --port 5173
)
pause
