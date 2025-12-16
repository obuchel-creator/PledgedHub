@echo off
REM ========================================
REM PLEDGEHUB - PERSISTENT SERVER LAUNCHER
REM ========================================
REM This script starts both backend and frontend servers
REM in persistent mode that survives terminal closures.
REM ========================================

echo.
echo ========================================
echo PLEDGEHUB PERSISTENT SERVER LAUNCHER
echo ========================================
echo.

cd /d "%~dp0"

echo [INFO] Starting Backend Server (Port 5001)...
start "PledgeHub Backend" /MIN cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo [INFO] Starting Frontend Server (Port 5173)...
start "PledgeHub Frontend" /MIN cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo [OK] Both servers started in background!
echo.
echo ========================================
echo SERVER STATUS
echo ========================================
echo Backend:  http://localhost:5001
echo Frontend: http://localhost:5173
echo.
echo [INFO] Servers running in minimized windows
echo [INFO] To stop: Close the minimized windows or use Task Manager
echo.
echo ========================================
echo ADVANCED REMINDER SCHEDULE
echo ========================================
echo Long-Term (2+ months):   Wednesdays 2 PM
echo Mid-Term (30-60 days):   Tuesdays/Fridays 10 AM
echo Final Week (1-7 days):   Daily 9 AM
echo Due Today:               Daily 8 AM
echo Overdue:                 Daily 5 PM
echo Balance Reminders:       Daily 10 AM
echo ========================================
echo.

pause
