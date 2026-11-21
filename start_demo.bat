@echo off
title MediLedger - 1-Click System Launcher
color 0A

echo ===============================================================================
echo            MEDILEDGER 1-CLICK AUTONOMOUS LAUNCHER (MBA CAPSTONE)
echo ===============================================================================
echo.
echo Starting Ethereum Local Blockchain, Smart Contracts, Backend & Web Dashboard...
echo No Ethereum software download needed! All services run automatically.
echo.

node "%~dp0scripts\start_all.js"

pause
