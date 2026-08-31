@echo off
title Ardhnarishwar AI Interview SaaS - Public Global URL
color 0B

echo ==============================================================================
echo   Starting Ardhnarishwar AI SaaS - Public HTTPS Global Tunnel
echo ==============================================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Vite Frontend Server on port 5173...
start "Ardhnarishwar-Vite" cmd /c "npm run dev -- --host"

timeout /t 3 >nul

echo [2/2] Opening Localhost & Generating Public Global HTTPS URL...
start "" "http://localhost:5173"

echo.
echo ==============================================================================
echo  LOCAL ACCESS:  http://localhost:5173
echo  GLOBAL ACCESS: Connecting to tunnel network...
echo ==============================================================================
echo.

npx --yes localtunnel --port 5173
