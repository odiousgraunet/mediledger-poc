@echo off
title MediLedger - Presentation Launcher
color 0E

echo ===============================================================================
echo            OPENING MEDILEDGER FINAL PRESENTATION ARTIFACTS
echo ===============================================================================
echo.
echo 1. Opening Interactive Browser Slide Deck (presentation.html)...
start "" "%~dp0presentation\presentation.html"
echo.
echo 2. Opening Microsoft PowerPoint Deck (MediLedger_Final_Presentation.pptx)...
start "" "%~dp0presentation\MediLedger_Final_Presentation.pptx"
echo.
echo Done!
timeout /t 3 >nul
exit
