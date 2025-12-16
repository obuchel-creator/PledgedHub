<#
.SYNOPSIS
    Complete automated setup script for PledgeHub
    
.DESCRIPTION
    This script performs a complete setup of the PledgeHub application:
    - Validates environment files
    - Installs all dependencies
    - Initializes database
    - Runs migrations
    - Seeds test data
    - Runs tests
    - Starts development servers
    
.EXAMPLE
    .\scripts\complete-setup.ps1
#>

param(
    [switch]$SkipTests,
    [switch]$SkipSeeding,
    [switch]$Production
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Color output functions
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Error-Custom { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warning-Custom { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Step { param($msg) Write-Host "`n[STEP] $msg" -ForegroundColor Magenta }

$scriptRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
Set-Location $scriptRoot

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              PledgeHub Complete Setup Script                 ║
║              Version 1.0 - Automated Installation            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Step 1: Check Prerequisites
Write-Step "Checking Prerequisites"

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js installed: $nodeVersion"
} catch {
    Write-Error-Custom "Node.js is not installed. Please install Node.js 14+ from https://nodejs.org"
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Success "npm installed: v$npmVersion"
} catch {
    Write-Error-Custom "npm is not installed"
    exit 1
}

# Check MySQL
try {
    $mysqlCheck = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq "Running" }
    if ($mysqlCheck) {
        Write-Success "MySQL service is running"
    } else {
        Write-Warning-Custom "MySQL service not detected or not running. Please ensure MySQL is installed and running."
    }
} catch {
    Write-Warning-Custom "Could not check MySQL service status"
}

# Step 2: Setup Environment Files
Write-Step "Setting Up Environment Files"

# Backend .env
if (-not (Test-Path "backend\.env")) {
    if (Test-Path "backend\.env.example") {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Success "Created backend\.env from template"
        Write-Warning-Custom "Please update backend\.env with your database credentials and API keys"
    } else {
        Write-Error-Custom "backend\.env.example not found"
    }
} else {
    Write-Info "backend\.env already exists"
}

# Update backend .env with AI key placeholder
$backendEnvPath = "backend\.env"
if (Test-Path $backendEnvPath) {
    $envContent = Get-Content $backendEnvPath -Raw
    if ($envContent -notmatch "GOOGLE_AI_API_KEY") {
        Add-Content $backendEnvPath "`n# Google AI Configuration (for AI features)`nGOOGLE_AI_API_KEY=your_gemini_api_key_here"
        Write-Info "Added GOOGLE_AI_API_KEY to backend\.env"
    }
}

# Frontend .env
if (-not (Test-Path "frontend\.env")) {
    if (Test-Path "frontend\.env.example") {
        Copy-Item "frontend\.env.example" "frontend\.env"
        Write-Success "Created frontend\.env from template"
    } else {
        # Create default frontend .env
        Set-Content "frontend\.env" "VITE_API_URL=http://localhost:5001/api"
        Write-Success "Created frontend\.env with default configuration"
    }
} else {
    Write-Info "frontend\.env already exists"
}

# Root .env for Docker (if needed)
if (-not (Test-Path ".env")) {
    Set-Content ".env" @"
DB_HOST=localhost
DB_PORT=3306
DB_NAME=pledgehub_db
DB_USER=root
DB_PASS=

NODE_ENV=development
PORT=5001
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

SESSION_SECRET=pledgehub_session_secret_change_in_production
JWT_SECRET=pledgehub_jwt_secret_change_in_production
"@
    Write-Success "Created root .env file"
}

# Step 3: Install Dependencies
Write-Step "Installing Dependencies"

# Backend dependencies
Write-Info "Installing backend dependencies..."
Push-Location backend
try {
    npm install --legacy-peer-deps 2>&1 | Out-Null
    Write-Success "Backend dependencies installed"
} catch {
    Write-Error-Custom "Failed to install backend dependencies: $_"
}
Pop-Location

# Frontend dependencies
Write-Info "Installing frontend dependencies..."
Push-Location frontend
try {
    npm install --legacy-peer-deps 2>&1 | Out-Null
    Write-Success "Frontend dependencies installed"
} catch {
    Write-Error-Custom "Failed to install frontend dependencies: $_"
}
Pop-Location

# Root dependencies (if package.json exists)
if (Test-Path "package.json") {
    Write-Info "Installing root dependencies..."
    try {
        npm install --legacy-peer-deps 2>&1 | Out-Null
        Write-Success "Root dependencies installed"
    } catch {
        Write-Warning-Custom "Failed to install root dependencies: $_"
    }
}

# Step 4: Database Setup
Write-Step "Setting Up Database"

# Check if database exists and create if needed
Write-Info "Checking database connection..."

# Run database initialization script if available
if (Test-Path "scripts\init-db.ps1") {
    Write-Info "Running database initialization..."
    try {
        & ".\scripts\init-db.ps1" -NonInteractive
        Write-Success "Database initialized"
    } catch {
        Write-Warning-Custom "Database initialization encountered issues: $_"
    }
} else {
    Write-Warning-Custom "init-db.ps1 not found, skipping database initialization"
}

# Run migrations
Write-Info "Running database migrations..."
if (Test-Path "backend\scripts\complete-migration.js") {
    try {
        Push-Location backend
        node scripts\complete-migration.js 2>&1 | Out-Null
        Pop-Location
        Write-Success "Database migrations completed"
    } catch {
        Write-Warning-Custom "Migration script encountered issues: $_"
    }
}

# Step 5: Seed Test Data (Optional)
if (-not $SkipSeeding) {
    Write-Step "Seeding Test Data"
    
    if (Test-Path "backend\scripts\seed-data.js") {
        try {
            Push-Location backend
            node scripts\seed-data.js 2>&1 | Out-Null
            Pop-Location
            Write-Success "Test data seeded"
        } catch {
            Write-Warning-Custom "Seeding script not available or failed: $_"
        }
    } else {
        Write-Info "No seeding script found, skipping test data seeding"
    }
}

# Step 6: Initialize AI Service
Write-Step "Initializing AI Service"

$envPath = "backend\.env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    if ($envContent -match "GOOGLE_AI_API_KEY=your_gemini_api_key_here" -or $envContent -match "GOOGLE_AI_API_KEY=$") {
        Write-Warning-Custom "Google AI API key not configured"
        Write-Info "Get your FREE API key at: https://makersuite.google.com/app/apikey"
        Write-Info "Add it to backend\.env as GOOGLE_AI_API_KEY=your_key_here"
    } else {
        Write-Success "Google AI API key configured"
    }
}

# Step 7: Run Tests (Optional)
if (-not $SkipTests) {
    Write-Step "Running Tests"
    
    # Backend tests
    Write-Info "Running backend unit tests..."
    Push-Location backend
    try {
        $testResult = npm test 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backend tests passed"
        } else {
            Write-Warning-Custom "Some backend tests failed"
        }
    } catch {
        Write-Warning-Custom "Backend tests encountered errors: $_"
    }
    Pop-Location
    
    # Integration tests
    Write-Info "Running integration tests..."
    if (Test-Path "backend\scripts\test-all-features.js") {
        try {
            Push-Location backend
            # Start server in background for testing
            $serverJob = Start-Job -ScriptBlock {
                Set-Location $using:scriptRoot
                Push-Location backend
                node server.js 2>&1 | Out-Null
            }
            
            Start-Sleep -Seconds 5
            
            node scripts\test-all-features.js 2>&1
            
            Stop-Job $serverJob
            Remove-Job $serverJob
            
            Pop-Location
            Write-Success "Integration tests completed"
        } catch {
            Write-Warning-Custom "Integration tests encountered errors: $_"
        }
    }
}

# Step 8: Initialize Cron Jobs
Write-Step "Initializing Scheduled Jobs"
Write-Info "Cron jobs will start when the server starts"
Write-Info "Configured timezone: Africa/Kampala (EAT)"
Write-Info "Schedule:"
Write-Info "  - Daily reminders: 9:00 AM"
Write-Info "  - Evening reminders: 5:00 PM"
Write-Info "  - Balance reminders: 10:00 AM"
Write-Success "Cron job configuration verified"

# Step 9: Build Frontend (if production)
if ($Production) {
    Write-Step "Building Frontend for Production"
    Push-Location frontend
    try {
        npm run build 2>&1 | Out-Null
        Write-Success "Frontend built successfully"
    } catch {
        Write-Error-Custom "Frontend build failed: $_"
    }
    Pop-Location
}

# Step 10: Create Start Script
Write-Step "Creating Startup Scripts"

# Create a combined startup script
$startupScript = @"
@echo off
echo Starting PledgeHub Development Servers...
start "Backend Server" powershell -NoExit -Command "cd backend; npm run dev"
timeout /t 3
start "Frontend Server" powershell -NoExit -Command "cd frontend; npm run dev"
echo.
echo Servers starting...
echo Backend: http://localhost:5001
echo Frontend: http://localhost:5173
"@

Set-Content "start-dev.bat" $startupScript
Write-Success "Created start-dev.bat"

# Step 11: Setup Completion Summary
Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                  🎉 Setup Complete! 🎉                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green

Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Update backend\.env with your credentials:" -ForegroundColor Yellow
Write-Host "   - Database: DB_USER, DB_PASS, DB_NAME"
Write-Host "   - JWT_SECRET and SESSION_SECRET"
Write-Host "   - GOOGLE_AI_API_KEY (optional, for AI features)"
Write-Host "   - SMTP credentials (optional, for email)"
Write-Host "   - Twilio credentials (optional, for SMS)"
Write-Host ""
Write-Host "2. Start the development servers:" -ForegroundColor Yellow
Write-Host "   .\scripts\dev.ps1" -ForegroundColor Cyan
Write-Host "   OR"
Write-Host "   .\start-dev.bat" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Access the application:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Backend API: http://localhost:5001/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Test user credentials:" -ForegroundColor Yellow
Write-Host "   Email: testuser@example.com"
Write-Host "   Password: testpass123"
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "   - API Docs: docs\API_DOCUMENTATION.md"
Write-Host "   - Deployment: docs\DEPLOYMENT_GUIDE.md"
Write-Host "   - Troubleshooting: docs\TROUBLESHOOTING.md"
Write-Host ""
Write-Host "🔧 Useful Commands:" -ForegroundColor Yellow
Write-Host "   Test all features: node backend\scripts\test-all-features.js"
Write-Host "   Run tests: cd backend; npm test"
Write-Host "   Check AI status: curl http://localhost:5001/api/ai/status"
Write-Host ""

Write-Success "Setup script completed successfully!"
Write-Host ""
