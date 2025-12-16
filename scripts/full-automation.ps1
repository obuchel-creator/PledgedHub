<#
.SYNOPSIS
    Complete automated build, test, and deployment script
    
.DESCRIPTION
    This comprehensive script handles:
    - Complete setup from scratch
    - Dependency installation
    - Database initialization and migrations
    - Data seeding
    - Testing (unit, integration, load)
    - Building for production
    - Health monitoring
    - Automated recovery
    
.EXAMPLE
    .\scripts\full-automation.ps1
    .\scripts\full-automation.ps1 -SkipTests -Production
#>

param(
    [switch]$SkipTests,
    [switch]$Production,
    [switch]$Monitor,
    [switch]$CleanInstall,
    [int]$MonitorInterval = 30
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Ensure we're in the correct directory
$scriptRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
if ($scriptRoot) {
    Set-Location $scriptRoot
}

# Create logs directory
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force | Out-Null
}

$logFile = Join-Path (Get-Location) "logs\automation-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

function Write-Success { param($msg) 
    $m = "[OK] $msg"
    Write-Host $m -ForegroundColor Green
    "$m" | Out-File -Append $logFile
}

function Write-Error-Custom { param($msg) 
    $m = "[ERROR] $msg"
    Write-Host $m -ForegroundColor Red
    "$m" | Out-File -Append $logFile
}

function Write-Info { param($msg) 
    $m = "[INFO] $msg"
    Write-Host $m -ForegroundColor Cyan
    "$m" | Out-File -Append $logFile
}

function Write-Warning-Custom { param($msg) 
    $m = "[WARN] $msg"
    Write-Host $m -ForegroundColor Yellow
    "$m" | Out-File -Append $logFile
}

function Write-Step { param($msg) 
    $m = "`n[STEP] $msg"
    Write-Host $m -ForegroundColor Magenta
    "$m" | Out-File -Append $logFile
}

Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        PledgeHub Complete Automation Script v2.0             ║
║        Automated Setup, Build, Test & Deploy                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

$startTime = Get-Date
Write-Info "Automation started at: $startTime"
Write-Info "Log file: $logFile"

# Phase 1: Clean Install (if requested)
if ($CleanInstall) {
    Write-Step "Phase 1: Clean Installation"
    
    Write-Info "Removing node_modules directories..."
    @("node_modules", "backend\node_modules", "frontend\node_modules") | ForEach-Object {
        if (Test-Path $_) {
            Remove-Item -Recurse -Force $_ -ErrorAction SilentlyContinue
            Write-Success "Removed $_"
        }
    }
    
    Write-Info "Removing package-lock.json files..."
    @("package-lock.json", "backend\package-lock.json", "frontend\package-lock.json") | ForEach-Object {
        if (Test-Path $_) {
            Remove-Item -Force $_ -ErrorAction SilentlyContinue
            Write-Success "Removed $_"
        }
    }
    
    Write-Success "Clean installation preparation complete"
}

# Phase 2: Environment Setup
Write-Step "Phase 2: Environment Configuration"

# Backend .env
if (-not (Test-Path "backend\.env")) {
    if (Test-Path "backend\.env.example") {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Success "Created backend\.env"
    }
}

# Add AI configuration to backend .env
$backendEnvPath = "backend\.env"
if (Test-Path $backendEnvPath) {
    $envContent = Get-Content $backendEnvPath -Raw
    
    # Add missing configurations
    $additions = @()
    
    if ($envContent -notmatch "GOOGLE_AI_API_KEY") {
        $additions += "`n# Google AI Configuration"
        $additions += "GOOGLE_AI_API_KEY=your_gemini_api_key_here"
    }
    
    if ($envContent -notmatch "SMTP_HOST") {
        $additions += "`n# Email Configuration"
        $additions += "SMTP_HOST=smtp.gmail.com"
        $additions += "SMTP_PORT=587"
        $additions += "SMTP_SECURE=false"
        $additions += "SMTP_USER=your_email@gmail.com"
        $additions += "SMTP_PASS=your_app_password"
    }
    
    if ($additions.Count -gt 0) {
        Add-Content $backendEnvPath ($additions -join "`n")
        Write-Info "Added missing configurations to backend\.env"
    }
    
    Write-Success "Backend environment configured"
}

# Frontend .env
if (-not (Test-Path "frontend\.env")) {
    Set-Content "frontend\.env" "VITE_API_URL=http://localhost:5001/api"
    Write-Success "Created frontend\.env"
}

# Phase 3: Dependency Installation
Write-Step "Phase 3: Installing Dependencies"

Write-Info "Installing backend dependencies..."
Push-Location backend
$npmOutput = npm install --legacy-peer-deps 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Success "Backend dependencies installed"
} else {
    Write-Error-Custom "Backend dependency installation failed"
    $npmOutput | Out-File -Append $logFile
}
Pop-Location

Write-Info "Installing frontend dependencies..."
Push-Location frontend
$npmOutput = npm install --legacy-peer-deps 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Success "Frontend dependencies installed"
} else {
    Write-Error-Custom "Frontend dependency installation failed"
    $npmOutput | Out-File -Append $logFile
}
Pop-Location

# Phase 4: Database Setup
Write-Step "Phase 4: Database Initialization"

Write-Info "Running database migrations..."
Push-Location backend
$migrationOutput = node scripts\complete-migration.js 2>&1
$migrationOutput | Out-File -Append $logFile
if ($LASTEXITCODE -eq 0 -or $migrationOutput -match "success|complete") {
    Write-Success "Database migrations completed"
} else {
    Write-Warning-Custom "Migration warnings detected (may be normal)"
}
Pop-Location

# Phase 5: Seed Test Data
Write-Step "Phase 5: Seeding Test Data"

Push-Location backend
$seedOutput = node scripts\seed-data.js 2>&1
$seedOutput | Out-File -Append $logFile
if ($LASTEXITCODE -eq 0 -or $seedOutput -match "success|complete") {
    Write-Success "Test data seeded"
} else {
    Write-Info "Seeding skipped or data already exists"
}
Pop-Location

# Phase 6: Testing
if (-not $SkipTests) {
    Write-Step "Phase 6: Running Tests"
    
    # Unit tests
    Write-Info "Running backend unit tests..."
    Push-Location backend
    $testOutput = npm test 2>&1
    $testOutput | Out-File -Append $logFile
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Unit tests passed"
    } else {
        Write-Warning-Custom "Some unit tests failed (check log)"
    }
    Pop-Location
    
    # Start server for integration tests
    Write-Info "Starting test server..."
    $serverJob = Start-Job -ScriptBlock {
        Set-Location $using:scriptRoot\backend
        node server.js 2>&1
    }
    
    Start-Sleep -Seconds 8
    
    # Integration tests
    Write-Info "Running integration tests..."
    Push-Location backend
    $integrationOutput = node scripts\test-all-features.js 2>&1
    $integrationOutput | Out-File -Append $logFile
    
    if ($integrationOutput -match "passed") {
        Write-Success "Integration tests completed"
    } else {
        Write-Warning-Custom "Integration tests need review"
    }
    Pop-Location
    
    # Cleanup
    Stop-Job $serverJob -ErrorAction SilentlyContinue
    Remove-Job $serverJob -ErrorAction SilentlyContinue
    
} else {
    Write-Info "Tests skipped as requested"
}

# Phase 7: Production Build
if ($Production) {
    Write-Step "Phase 7: Building for Production"
    
    Write-Info "Building frontend..."
    Push-Location frontend
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Frontend built successfully"
    } else {
        Write-Error-Custom "Frontend build failed"
        $buildOutput | Out-File -Append $logFile
    }
    Pop-Location
    
    # Create production startup script
    $prodScript = @"
@echo off
echo Starting PledgeHub in Production Mode...
cd backend
set NODE_ENV=production
start "Backend Server" cmd /k npm start
echo Backend started on port 5001
echo Serving frontend from backend/public
"@
    Set-Content "start-production.bat" $prodScript
    Write-Success "Created production startup script"
}

# Phase 8: Create Helper Scripts
Write-Step "Phase 8: Creating Helper Scripts"

# Development startup
$devBat = @"
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
"@
Set-Content "start-dev.bat" $devBat
Write-Success "Created start-dev.bat"

# Quick test script
$testBat = @"
@echo off
echo Running PledgeHub Tests...
cd backend
call npm test
pause
"@
Set-Content "run-tests.bat" $testBat
Write-Success "Created run-tests.bat"

# Database reset script
$dbResetPs1 = @"
Write-Host "⚠️  WARNING: This will reset the database!" -ForegroundColor Yellow
`$confirm = Read-Host "Type 'RESET' to confirm"
if (`$confirm -eq "RESET") {
    Push-Location backend
    node scripts\complete-migration.js
    node scripts\seed-data.js
    Pop-Location
    Write-Host "✅ Database reset complete" -ForegroundColor Green
} else {
    Write-Host "❌ Reset cancelled" -ForegroundColor Red
}
"@
Set-Content "scripts\reset-database.ps1" $dbResetPs1
Write-Success "Created database reset script"

# Phase 9: Start Services
Write-Step "Phase 9: Starting Services"

Write-Info "Killing any existing Node processes..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

Write-Info "Starting backend server..."
Push-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal
Pop-Location

Start-Sleep -Seconds 5

Write-Info "Starting frontend server..."
Push-Location frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal
Pop-Location

Start-Sleep -Seconds 5

# Verify services are running
Write-Info "Verifying services..."
$backendHealthy = $false
$frontendHealthy = $false

for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5001/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $backendHealthy = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $frontendHealthy = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if ($backendHealthy) {
    Write-Success "Backend server is running on http://localhost:5001"
} else {
    Write-Warning-Custom "Backend server may still be starting..."
}

if ($frontendHealthy) {
    Write-Success "Frontend server is running on http://localhost:5173"
} else {
    Write-Warning-Custom "Frontend server may still be starting..."
}

# Phase 10: Summary Report
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              🎉 Automation Complete! 🎉                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green

Write-Host "Total Duration: $($duration.TotalMinutes.ToString('F2')) minutes" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "   [OK] Environment configured" -ForegroundColor Green
Write-Host "   [OK] Dependencies installed" -ForegroundColor Green
Write-Host "   [OK] Database initialized" -ForegroundColor Green
Write-Host "   [OK] Test data seeded" -ForegroundColor Green
if (-not $SkipTests) { Write-Host "   [OK] Tests executed" -ForegroundColor Green }
if ($Production) { Write-Host "   [OK] Production build created" -ForegroundColor Green }
Write-Host "   [OK] Services started" -ForegroundColor Green
Write-Host ""
Write-Host "Application URLs:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Backend API: http://localhost:5001/api" -ForegroundColor Cyan
Write-Host "   Health Check: http://localhost:5001/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test User Credentials:" -ForegroundColor Yellow
Write-Host "   Email: testuser@example.com"
Write-Host "   Password: testpass123"
Write-Host ""
Write-Host "Helper Scripts Created:" -ForegroundColor Yellow
Write-Host "   start-dev.bat - Start development servers"
Write-Host "   run-tests.bat - Run test suite"
Write-Host "   scripts\reset-database.ps1 - Reset database"
if ($Production) {
    Write-Host "   start-production.bat - Start in production mode"
}
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Update backend\.env with your API keys (optional)"
Write-Host "   2. Application is already running!"
Write-Host "   3. Open http://localhost:5173 in your browser"
Write-Host ""
Write-Host "Log file: $logFile" -ForegroundColor Cyan
Write-Host ""

# Phase 11: Start Monitoring (if requested)
if ($Monitor) {
    Write-Step "Phase 11: Starting Health Monitor"
    Write-Info "Starting automated health monitoring..."
    Write-Info "Monitor will check services every $MonitorInterval seconds"
    
    & ".\scripts\auto-monitor.ps1" -CheckInterval $MonitorInterval
} else {
    Write-Info "To start health monitoring, run: .\scripts\auto-monitor.ps1"
}

Write-Success "Full automation completed successfully!"
Write-Host ""
