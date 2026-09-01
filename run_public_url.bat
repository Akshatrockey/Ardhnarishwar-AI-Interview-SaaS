@echo off
title Ardhnarishwar AI Interview SaaS - Public Global URL Launcher
color 0A

echo ==============================================================================
echo   Ardhnarishwar AI SaaS - Starting Full Stack & Public HTTPS Tunnel
echo ==============================================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting FastAPI Backend on port 8000...
if exist "backend\.venv\Scripts\python.exe" (
    start "Ardhnarishwar-Backend" cmd /c "cd /d %~dp0backend && .venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000"
) else (
    start "Ardhnarishwar-Backend" cmd /c "cd /d %~dp0backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000"
)

echo [2/3] Starting Vite Frontend on port 5173...
start "Ardhnarishwar-Frontend" cmd /c "npm run dev -- --host"

timeout /t 3 >nul

echo [3/3] Opening Local Application & Generating Public HTTPS Link...
start "" "http://localhost:5173"

echo.
echo ==============================================================================
echo  LOCAL ACCESS:   http://localhost:5173
echo  API DOCS:       http://localhost:8000/docs
echo  GLOBAL TUNNEL:  Establishing Secure Global URL...
echo ==============================================================================
echo.

npx --yes localtunnel --port 5173
