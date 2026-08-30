@echo off
setlocal enabledelayedexpansion
title Ardhnarishwar AI SaaS - 1-Click Auto-Sync & Live Deploy
color 0B

echo ==============================================================================
echo       ARDHNARISHWAR AI SAAS - 1-CLICK AUTO-SYNC & CLOUD DEPLOYMENT
echo ==============================================================================
echo.

:: Automatically switch to the project directory
cd /d "%~dp0"
echo [1/4] Active Project Directory: %CD%
echo.

:: Step 1: Verify Production Build
echo [2/4] Testing & Building Project (TypeScript & Vite)...
call npm run build
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Build check failed! Please fix the errors above before deploying.
    echo.
    pause
    exit /b %errorlevel%
)
echo [OK] Build verification passed successfully!
echo.

:: Step 2: Stage All Changes
echo [3/4] Staging all modified files, settings, and features...
git add -A
echo [OK] Changes staged.
echo.

:: Step 3: Get Commit Message or Use Default Timestamp
set "defaultMsg=Update project settings and features (%date% %time%)"
set /p userMsg="Enter update description [Press Enter for default: %defaultMsg%]: "
if "!userMsg!"=="" set "userMsg=%defaultMsg%"

echo Committing: "!userMsg!"
git commit -m "!userMsg!"
if %errorlevel% neq 0 (
    echo.
    echo [INFO] No new changes detected to commit, proceeding to push...
)

echo.
:: Step 4: Push to GitHub & Trigger Cloud Auto-Deploy
echo [4/4] Pushing to GitHub (main branch)...
git branch -M main
git push -u origin main

if %errorlevel% equ 0 (
    color 0A
    echo.
    echo ==============================================================================
    echo  [SUCCESS] ALL CHANGES & SETTINGS PUSHED TO GITHUB SUCCESSFULLY!
    echo ==============================================================================
    echo.
    echo  - GitHub Repository: Updated
    echo  - Vercel Live Deployment: Auto-deploying in ~30s
    echo  - Netlify / Render: Auto-deploying in ~45s
    echo.
    echo  Your live 24/7 web application is now updating everywhere automatically!
    echo.
) else (
    color 0E
    echo.
    echo [NOTE] Push failed. If this is the first time, make sure your remote is linked:
    echo        git remote add origin https://github.com/YOUR_USERNAME/Ardhnarishwar-AI-Interview-SaaS.git
    echo.
)

pause
