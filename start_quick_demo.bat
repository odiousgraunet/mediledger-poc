@echo off
title MediLedger - Instant In-Browser Demo
color 0B

echo ===============================================================================
echo            MEDILEDGER INSTANT 1-CLICK DEMO (ZERO SETUP REQUIRED)
echo ===============================================================================
echo.
echo Launching the MediLedger Web Application with In-Browser Blockchain Engine...
echo Browser will open automatically at: http://localhost:3000
echo.

start "" "http://localhost:3000"
cd "%~dp0frontend"
npm run dev

pause
