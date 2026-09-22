@echo off
setlocal enabledelayedexpansion
title Ardhnarishwar AI SaaS - 1-Click MySQL Database Initializer
color 0B

echo ==============================================================================
echo       ARDHNARISHWAR AI SAAS - 1-CLICK MYSQL INITIALIZATION & SETUP
echo ==============================================================================
echo.

:: Automatically switch to project directory
cd /d "%~dp0"
echo [*] Active Directory: %CD%
echo.

:: Step 1: Detect Python Environment
set "PYTHON_EXE="
if exist "backend\.venv\Scripts\python.exe" (
    set "PYTHON_EXE=backend\.venv\Scripts\python.exe"
    echo [OK] Using virtual environment Python: !PYTHON_EXE!
) else if exist ".venv\Scripts\python.exe" (
    set "PYTHON_EXE=.venv\Scripts\python.exe"
    echo [OK] Using virtual environment Python: !PYTHON_EXE!
) else (
    set "PYTHON_EXE=python"
    echo [NOTE] Using system Python: !PYTHON_EXE!
)

:: Step 2: Check if Windows MySQL Service is installed and stopped
set "MYSQL_SVC="
sc query MySQL80 >nul 2>&1
if %errorlevel% equ 0 set "MYSQL_SVC=MySQL80"
if not defined MYSQL_SVC (
    sc query MySQL >nul 2>&1
    if %errorlevel% equ 0 set "MYSQL_SVC=MySQL"
)

if defined MYSQL_SVC (
    for /f "tokens=3 delims=: " %%H in ('sc query !MYSQL_SVC! ^| findstr "STATE"') do (
        if /i "%%H"=="STOPPED" (
            echo [*] Found local Windows service '!MYSQL_SVC!' in STOPPED state.
            echo [*] Requesting Windows permission to start '!MYSQL_SVC!' service...
            powershell -Command "Start-Process cmd -ArgumentList '/c net start !MYSQL_SVC!' -Verb RunAs -Wait" >nul 2>&1
            timeout /t 2 /nobreak >nul
        ) else (
            echo [OK] Windows service '!MYSQL_SVC!' is currently RUNNING.
        )
    )
)

echo.
echo [*] Running MySQL connection & migration script...
echo.

call !PYTHON_EXE! backend\init_mysql.py

if %errorlevel% equ 0 (
    color 0A
    echo.
    echo ==============================================================================
    echo  [SUCCESS] MYSQL DATABASE AND ALL TABLES INITIALIZED SUCCESSFULLY!
    echo ==============================================================================
    echo.
    echo  You can now start the application with:
    echo    START_APPLICATION.bat
    echo.
) else (
    color 0E
    echo.
    echo ==============================================================================
    echo  [INFO] MySQL connection could not be established directly.
    echo ==============================================================================
    echo.
    echo  If MySQL is not installed locally or not started, you can:
    echo   1. Start MySQL using Docker:
    echo        docker-compose up -d mysql_db
    echo   2. Or start your local MySQL Service / XAMPP / WampServer on port 3306.
    echo   3. Verify credentials in your .env file:
    echo        MYSQL_HOST=localhost
    echo        MYSQL_USER=root
    echo        MYSQL_PASSWORD=
    echo.
    echo  NOTE: The application will automatically fall back to SQLite when MySQL
    echo        is offline, so your development and testing is NEVER blocked!
    echo.
)

pause
