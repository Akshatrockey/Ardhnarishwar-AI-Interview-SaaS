@echo off
setlocal enabledelayedexpansion
title Ardhnarishwar AI SaaS - Global Live Launcher
color 0B

echo ==============================================================================
echo       ARDHNARISHWAR AI SAAS - INSTANT GLOBAL PUBLIC HTTPS LAUNCHER
echo ==============================================================================
echo.

cd /d "%~dp0"
echo [1/3] Current Workspace: %CD%
echo.

:: Build & Verify TypeScript
echo [2/3] Checking production build and compiling assets...
call npm run build
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Build failed! Please review errors.
    pause
    exit /b 1
)
echo [OK] Build verified successfully!
echo.

:: Start Local Dev Server
echo [3/3] Starting Global Web Server & Public HTTPS Tunnel...
echo.
start "Ardhnarishwar-Frontend" cmd /c "npm run dev -- --host 0.0.0.0 --port 5173"

timeout /t 3 >nul

echo ==============================================================================
echo  LOCAL ACCESS URL:   http://localhost:5173
echo  NETWORK ACCESS URL: http://127.0.0.1:5173
echo ==============================================================================
echo.
echo Launching Public HTTPS Tunnel (Localtunnel / Worldwide Access)...
echo Share this link with anyone across the world to access your AI SaaS platform:
echo.

start "" "http://localhost:5173"

npx --yes localtunnel --port 5173

pause
