@echo off
title PledgeHub - Master Launcher
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║              PledgeHub Master Launcher v2.0                  ║
echo ║          Automated Complete Setup and Deployment            ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo.
echo This script will:
echo   [1] Complete setup (environment, dependencies, database)
echo   [2] Run migrations and seed test data
echo   [3] Execute test suite (optional)
echo   [4] Start both frontend and backend servers
echo   [5] Start health monitoring (optional)
echo.
echo ────────────────────────────────────────────────────────────────
echo.

:MENU
echo Please select an option:
echo.
echo   [1] Full Automated Setup (Recommended for first run)
echo   [2] Quick Start (Servers only - assumes setup complete)
echo   [3] Clean Install (Remove all dependencies and reinstall)
echo   [4] Production Build and Deploy
echo   [5] Run Tests Only
echo   [6] Reset Database
echo   [7] Start Health Monitor
echo   [8] View Documentation
echo   [9] Exit
echo.
set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto FULL_SETUP
if "%choice%"=="2" goto QUICK_START
if "%choice%"=="3" goto CLEAN_INSTALL
if "%choice%"=="4" goto PRODUCTION
if "%choice%"=="5" goto RUN_TESTS
if "%choice%"=="6" goto RESET_DB
if "%choice%"=="7" goto MONITOR
if "%choice%"=="8" goto DOCS
if "%choice%"=="9" goto EXIT

echo Invalid choice. Please try again.
echo.
goto MENU

:FULL_SETUP
echo.
echo ═══════════════════════════════════════════════════════════════
echo   FULL AUTOMATED SETUP
echo ═══════════════════════════════════════════════════════════════
echo.
echo This will perform a complete setup of PledgeHub.
echo Duration: Approximately 5-10 minutes
echo.
set /p confirm="Continue? (Y/N): "
if /i not "%confirm%"=="Y" goto MENU

echo.
echo Starting full automation...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\full-automation.ps1"

echo.
echo ✅ Setup complete!
echo.
echo Application is running at:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5001
echo.
pause
goto MENU

:QUICK_START
echo.
echo ═══════════════════════════════════════════════════════════════
echo   QUICK START
echo ═══════════════════════════════════════════════════════════════
echo.
echo Starting development servers...
echo.

start "Backend - PledgeHub" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend - PledgeHub" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Servers starting...
echo.
echo   Backend:  http://localhost:5001
echo   Frontend: http://localhost:5173
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:5173

goto MENU

:CLEAN_INSTALL
echo.
echo ═══════════════════════════════════════════════════════════════
echo   CLEAN INSTALLATION
echo ═══════════════════════════════════════════════════════════════
echo.
echo ⚠️  WARNING: This will remove all node_modules directories
echo     and reinstall all dependencies from scratch.
echo.
echo This fixes most dependency-related issues but takes longer.
echo Duration: Approximately 10-15 minutes
echo.
set /p confirm="Are you sure? (Y/N): "
if /i not "%confirm%"=="Y" goto MENU

echo.
echo Performing clean installation...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\full-automation.ps1" -CleanInstall

echo.
echo ✅ Clean installation complete!
echo.
pause
goto MENU

:PRODUCTION
echo.
echo ═══════════════════════════════════════════════════════════════
echo   PRODUCTION BUILD
echo ═══════════════════════════════════════════════════════════════
echo.
echo This will build the application for production deployment.
echo.
set /p confirm="Continue? (Y/N): "
if /i not "%confirm%"=="Y" goto MENU

echo.
echo Building for production...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\full-automation.ps1" -Production -SkipTests

echo.
echo ✅ Production build complete!
echo.
echo To start in production mode, run: start-production.bat
echo.
pause
goto MENU

:RUN_TESTS
echo.
echo ═══════════════════════════════════════════════════════════════
echo   RUN TESTS
echo ═══════════════════════════════════════════════════════════════
echo.
echo Running complete test suite...
echo.

cd backend
call npm test
if errorlevel 1 (
    echo.
    echo ❌ Some tests failed!
    echo.
) else (
    echo.
    echo ✅ All tests passed!
    echo.
)

echo.
echo Running integration tests...
node scripts\test-all-features.js

cd ..
echo.
pause
goto MENU

:RESET_DB
echo.
echo ═══════════════════════════════════════════════════════════════
echo   RESET DATABASE
echo ═══════════════════════════════════════════════════════════════
echo.
echo ⚠️  WARNING: This will DELETE ALL DATA in the database!
echo.
echo This will:
echo   - Drop and recreate all tables
echo   - Run all migrations
echo   - Seed test data
echo.
set /p confirm="Type 'RESET' to confirm: "
if not "%confirm%"=="RESET" (
    echo.
    echo ❌ Database reset cancelled.
    echo.
    pause
    goto MENU
)

echo.
echo Resetting database...
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\reset-database.ps1"

echo.
echo ✅ Database reset complete!
echo.
pause
goto MENU

:MONITOR
echo.
echo ═══════════════════════════════════════════════════════════════
echo   HEALTH MONITORING
echo ═══════════════════════════════════════════════════════════════
echo.
echo Starting automated health monitoring...
echo.
echo The monitor will:
echo   - Check backend every 30 seconds
echo   - Check frontend every 30 seconds
echo   - Auto-restart failed services
echo   - Log all events to monitor.log
echo.
echo Press Ctrl+C to stop monitoring
echo.
pause

powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\auto-monitor.ps1"

goto MENU

:DOCS
echo.
echo ═══════════════════════════════════════════════════════════════
echo   DOCUMENTATION
echo ═══════════════════════════════════════════════════════════════
echo.
echo Opening documentation...
echo.

if exist "docs\README.md" (
    start "" "docs\README.md"
) else (
    echo ❌ Documentation not found at docs\README.md
)

if exist "scripts\README.md" (
    start "" "scripts\README.md"
) else (
    echo ❌ Scripts documentation not found
)

if exist ".github\copilot-instructions.md" (
    start "" ".github\copilot-instructions.md"
) else (
    echo ❌ AI instructions not found
)

echo.
echo Available documentation:
echo   - docs\README.md                      - Main documentation
echo   - docs\API_DOCUMENTATION.md           - API reference
echo   - docs\DEPLOYMENT_GUIDE.md            - Deployment guide
echo   - docs\TROUBLESHOOTING.md             - Troubleshooting
echo   - scripts\README.md                   - Scripts guide
echo   - .github\copilot-instructions.md     - AI agent instructions
echo.
pause
goto MENU

:EXIT
echo.
echo Thank you for using PledgeHub!
echo.
echo Quick Tips:
echo   - Use 'start-dev.bat' for quick development start
echo   - Use 'run-tests.bat' to run tests quickly
echo   - Check logs\ directory for detailed logs
echo.
pause
exit

:EOF
