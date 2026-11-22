@echo off
title MediLedger - Open Word Documents
color 0B

echo ===============================================================================
echo            OPENING EDITABLE MICROSOFT WORD & PRESENTATION FILES
echo ===============================================================================
echo.
echo 1. Opening MediLedger Business Case Report (.docx)...
start "" "%~dp0docs\MediLedger_Business_Case_Report.docx"
echo.
echo 2. Opening MediLedger Technical Documentation (.docx)...
start "" "%~dp0docs\MediLedger_Technical_Documentation.docx"
echo.
echo 3. Opening MediLedger Demonstration Guide (.docx)...
start "" "%~dp0docs\MediLedger_Demonstration_Guide.docx"
echo.
echo 4. Opening MediLedger Master Academic Report (.docx)...
start "" "%~dp0docs\MediLedger_Master_Academic_Report.docx"
echo.
echo All Word files opened! You can now edit, format, or print them.
timeout /t 3 >nul
exit
