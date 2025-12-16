@echo off
title PledgeHub Development Servers
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║            Starting PledgeHub Development Servers            ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Starting Backend Server...
start "Backend - PledgeHub" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
echo Starting Frontend Server...
start "Frontend - PledgeHub" cmd /k "cd frontend && npm run dev"
echo.
echo ✅ Servers starting...
echo.
echo 📍 Backend API: http://localhost:5001
echo 📍 Frontend App: http://localhost:5173
echo.
echo Press any key to open browser...
pause >nul
start http://localhost:5173
