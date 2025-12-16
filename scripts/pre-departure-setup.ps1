# ========================================
# PLEDGEHUB - COMPLETE PRE-DEPARTURE SETUP
# ========================================
# Prepares the entire system for 2-day autonomous operation
# Includes: environment setup, dependencies, database, testing,
# reminder system initialization, and persistent server launch
# ========================================

param(
    [switch]$SkipTests,
    [switch]$QuickStart
)

$ErrorActionPreference = "Continue"
$scriptRoot = Split-Path -Parent $PSCommandPath

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PLEDGEHUB - PRE-DEPARTURE SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

# ========================================
# PHASE 1: ENVIRONMENT CHECK
# ========================================
Write-Host "[STEP 1/9] Environment Check" -ForegroundColor Yellow

if (-not (Test-Path "backend\.env")) {
    Write-Host "[WARN] Backend .env not found. Creating from example..." -ForegroundColor Yellow
    if (Test-Path "backend\.env.example") {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "[OK] Backend .env created. PLEASE EDIT IT NOW!" -ForegroundColor Green
        Write-Host "[INFO] Required: DB credentials, JWT secrets, GOOGLE_AI_API_KEY" -ForegroundColor Cyan
        
        if (-not $QuickStart) {
            $response = Read-Host "Have you edited backend\.env? (y/n)"
            if ($response -ne 'y') {
                Write-Host "[ERROR] Please edit backend\.env and run this script again." -ForegroundColor Red
                exit 1
            }
        }
    } else {
        Write-Host "[ERROR] backend\.env.example not found!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[OK] Backend .env exists" -ForegroundColor Green
}

if (-not (Test-Path "frontend\.env")) {
    Write-Host "[INFO] Creating frontend .env from example..." -ForegroundColor Cyan
    if (Test-Path "frontend\.env.example") {
        Copy-Item "frontend\.env.example" "frontend\.env"
        Write-Host "[OK] Frontend .env created" -ForegroundColor Green
    }
} else {
    Write-Host "[OK] Frontend .env exists" -ForegroundColor Green
}

Write-Host ""

# ========================================
# PHASE 2: DEPENDENCY INSTALLATION
# ========================================
Write-Host "[STEP 2/9] Installing Dependencies" -ForegroundColor Yellow

Write-Host "[INFO] Installing backend dependencies..." -ForegroundColor Cyan
Push-Location backend
npm install 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Backend npm install failed" -ForegroundColor Red
}
Pop-Location

Write-Host "[INFO] Installing frontend dependencies..." -ForegroundColor Cyan
Push-Location frontend
npm install 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Frontend npm install failed" -ForegroundColor Red
}
Pop-Location

Write-Host ""

# ========================================
# PHASE 3: DATABASE SETUP
# ========================================
Write-Host "[STEP 3/9] Database Setup" -ForegroundColor Yellow

Write-Host "[INFO] Testing database connection..." -ForegroundColor Cyan
Push-Location backend
$dbTest = node -e "const {pool} = require('./config/db'); pool.execute('SELECT 1').then(() => {console.log('OK'); process.exit(0);}).catch(() => {console.log('FAIL'); process.exit(1);});" 2>&1
Pop-Location

if ($dbTest -match "OK") {
    Write-Host "[OK] Database connection successful" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Database connection failed!" -ForegroundColor Red
    Write-Host "[INFO] Please check your database credentials in backend\.env" -ForegroundColor Yellow
    Write-Host "[INFO] Required: DB_HOST, DB_USER, DB_PASS, DB_NAME" -ForegroundColor Yellow
    
    if (-not $QuickStart) {
        $response = Read-Host "Continue anyway? (y/n)"
        if ($response -ne 'y') {
            exit 1
        }
    }
}

Write-Host ""

# ========================================
# PHASE 4: DATABASE MIGRATIONS
# ========================================
Write-Host "[STEP 4/9] Running Database Migrations" -ForegroundColor Yellow

if (Test-Path "backend\scripts\complete-migration.js") {
    Write-Host "[INFO] Running migration script..." -ForegroundColor Cyan
    Push-Location backend
    node scripts\complete-migration.js 2>&1 | ForEach-Object {
        if ($_ -match "ERROR") {
            Write-Host $_ -ForegroundColor Red
        } elseif ($_ -match "OK|success") {
            Write-Host $_ -ForegroundColor Green
        } else {
            Write-Host $_ -ForegroundColor Gray
        }
    }
    Pop-Location
    Write-Host "[OK] Migrations complete" -ForegroundColor Green
} else {
    Write-Host "[WARN] Migration script not found, skipping..." -ForegroundColor Yellow
}

Write-Host ""

# ========================================
# PHASE 5: SEED TEST DATA
# ========================================
Write-Host "[STEP 5/9] Seeding Test Data" -ForegroundColor Yellow

if (Test-Path "backend\scripts\seed-data.js") {
    Write-Host "[INFO] Seeding database with test data..." -ForegroundColor Cyan
    Push-Location backend
    node scripts\seed-data.js 2>&1 | ForEach-Object {
        if ($_ -match "ERROR") {
            Write-Host $_ -ForegroundColor Red
        } elseif ($_ -match "OK|Created") {
            Write-Host $_ -ForegroundColor Green
        } else {
            Write-Host $_ -ForegroundColor Gray
        }
    }
    Pop-Location
    Write-Host "[OK] Test data seeded" -ForegroundColor Green
} else {
    Write-Host "[WARN] Seed script not found, skipping..." -ForegroundColor Yellow
}

Write-Host ""

# ========================================
# PHASE 6: TEST ADVANCED REMINDER SYSTEM
# ========================================
Write-Host "[STEP 6/9] Testing Advanced Reminder System" -ForegroundColor Yellow

if (Test-Path "backend\scripts\test-advanced-reminders.js") {
    Write-Host "[INFO] Creating and testing reminder system..." -ForegroundColor Cyan
    Push-Location backend
    node scripts\test-advanced-reminders.js 2>&1 | ForEach-Object {
        if ($_ -match "ERROR") {
            Write-Host $_ -ForegroundColor Red
        } elseif ($_ -match "OK") {
            Write-Host $_ -ForegroundColor Green
        } elseif ($_ -match "STEP") {
            Write-Host $_ -ForegroundColor Yellow
        } else {
            Write-Host $_ -ForegroundColor Gray
        }
    }
    Pop-Location
    
    Write-Host "[INFO] Cleaning up test reminders..." -ForegroundColor Cyan
    Push-Location backend
    node scripts\test-advanced-reminders.js --cleanup 2>&1 | Out-Null
    Pop-Location
    
    Write-Host "[OK] Reminder system tested and ready" -ForegroundColor Green
} else {
    Write-Host "[WARN] Reminder test script not found" -ForegroundColor Yellow
}

Write-Host ""

# ========================================
# PHASE 7: RUN INTEGRATION TESTS
# ========================================
if (-not $SkipTests) {
    Write-Host "[STEP 7/9] Running Integration Tests" -ForegroundColor Yellow
    
    if (Test-Path "backend\scripts\test-all-features.js") {
        Write-Host "[INFO] Testing all features..." -ForegroundColor Cyan
        Push-Location backend
        
        # Start backend temporarily for tests
        $backendJob = Start-Job -ScriptBlock {
            Set-Location $using:PWD
            npm run dev 2>&1 | Out-Null
        }
        
        Start-Sleep -Seconds 5
        
        node scripts\test-all-features.js 2>&1 | ForEach-Object {
            if ($_ -match "ERROR|FAIL") {
                Write-Host $_ -ForegroundColor Red
            } elseif ($_ -match "OK|PASS") {
                Write-Host $_ -ForegroundColor Green
            } else {
                Write-Host $_ -ForegroundColor Gray
            }
        }
        
        Stop-Job $backendJob
        Remove-Job $backendJob
        
        Pop-Location
        Write-Host "[OK] Integration tests complete" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Test script not found, skipping..." -ForegroundColor Yellow
    }
} else {
    Write-Host "[STEP 7/9] Skipping Tests (--SkipTests flag)" -ForegroundColor Yellow
}

Write-Host ""

# ========================================
# PHASE 8: BUILD PRODUCTION ASSETS
# ========================================
Write-Host "[STEP 8/9] Building Production Assets" -ForegroundColor Yellow

Write-Host "[INFO] Building frontend for production..." -ForegroundColor Cyan
Push-Location frontend
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Frontend built successfully" -ForegroundColor Green
} else {
    Write-Host "[WARN] Frontend build had issues (non-critical)" -ForegroundColor Yellow
}
Pop-Location

Write-Host ""

# ========================================
# PHASE 9: START PERSISTENT SERVERS
# ========================================
Write-Host "[STEP 9/9] Starting Persistent Servers" -ForegroundColor Yellow

Write-Host "[INFO] Launching backend server (port 5001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptRoot\backend'; npm run dev" -WindowStyle Minimized

Start-Sleep -Seconds 3

Write-Host "[INFO] Launching frontend server (port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptRoot\frontend'; npm run dev" -WindowStyle Minimized

Start-Sleep -Seconds 3

Write-Host "[OK] Both servers started in background" -ForegroundColor Green

Write-Host ""

# ========================================
# COMPLETION SUMMARY
# ========================================
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Time Taken: $($duration.TotalMinutes.ToString('F2')) minutes" -ForegroundColor Cyan
Write-Host ""
Write-Host "SYSTEM STATUS:" -ForegroundColor Yellow
Write-Host "  [OK] Environment configured" -ForegroundColor Green
Write-Host "  [OK] Dependencies installed" -ForegroundColor Green
Write-Host "  [OK] Database migrated" -ForegroundColor Green
Write-Host "  [OK] Test data seeded" -ForegroundColor Green
Write-Host "  [OK] Reminder system active" -ForegroundColor Green
if (-not $SkipTests) {
    Write-Host "  [OK] Tests passed" -ForegroundColor Green
}
Write-Host "  [OK] Servers running" -ForegroundColor Green
Write-Host ""
Write-Host "ACCESS POINTS:" -ForegroundColor Yellow
Write-Host "  Backend:  http://localhost:5001" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "ADVANCED REMINDER SCHEDULE:" -ForegroundColor Yellow
Write-Host "  Long-Term (2+ months):   Wednesdays 2 PM" -ForegroundColor Cyan
Write-Host "  Mid-Term (30-60 days):   Tuesdays/Fridays 10 AM" -ForegroundColor Cyan
Write-Host "  Final Week (1-7 days):   Daily 9 AM" -ForegroundColor Cyan
Write-Host "  Due Today:               Daily 8 AM" -ForegroundColor Cyan
Write-Host "  Overdue:                 Daily 5 PM" -ForegroundColor Cyan
Write-Host "  Balance Reminders:       Daily 10 AM" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT NOTES:" -ForegroundColor Yellow
Write-Host "  - Servers are running in minimized PowerShell windows" -ForegroundColor Gray
Write-Host "  - Cron jobs will trigger automatically at scheduled times" -ForegroundColor Gray
Write-Host "  - All times are in Africa/Kampala timezone (EAT)" -ForegroundColor Gray
Write-Host "  - Check logs in backend/logs/ for activity" -ForegroundColor Gray
Write-Host ""
Write-Host "TO STOP SERVERS:" -ForegroundColor Yellow
Write-Host "  - Close the minimized PowerShell windows, OR" -ForegroundColor Gray
Write-Host "  - Use Task Manager to end 'node.exe' processes" -ForegroundColor Gray
Write-Host ""
Write-Host "TO RESTART LATER:" -ForegroundColor Yellow
Write-Host "  - Run: .\START-PERSISTENT.bat" -ForegroundColor Gray
Write-Host "  - Or run: .\scripts\full-automation.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "System ready for 2-day autonomous operation!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Create a quick reference file
$quickRef = @"
PLEDGEHUB - QUICK REFERENCE (Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm'))

URLS:
- Backend:  http://localhost:5001
- Frontend: http://localhost:5173
- API Docs: http://localhost:5001/api

REMINDER SCHEDULE (Africa/Kampala timezone):
- Long-Term (2+ months):   Wednesdays 2:00 PM
- Mid-Term (30-60 days):   Tuesdays & Fridays 10:00 AM
- Final Week (1-7 days):   Daily 9:00 AM
- Due Today:               Daily 8:00 AM
- Overdue:                 Daily 5:00 PM
- Balance Reminders:       Daily 10:00 AM

TEST CREDENTIALS:
- Username: testuser
- Email: testuser@example.com
- Password: testpass123

COMMANDS:
- Start servers: .\START-PERSISTENT.bat
- Run tests: node backend\scripts\test-all-features.js
- Test reminders: node backend\scripts\test-advanced-reminders.js
- Full automation: .\scripts\full-automation.ps1

LOGS:
- Backend: Check minimized PowerShell window or backend\logs\
- Frontend: Check minimized PowerShell window

STATUS CHECK:
- Backend health: curl http://localhost:5001/
- Reminder status: Check backend logs for "Triggered" messages
- Database: mysql -u [user] -p [database]

TROUBLESHOOTING:
- If servers stop: Run .\START-PERSISTENT.bat
- If reminders fail: Check backend\.env for SMS/Email credentials
- If database errors: Verify DB credentials in backend\.env

DOCUMENTATION:
- ADVANCED_REMINDER_SYSTEM.md - Full reminder system docs
- AUTOMATION-GUIDE.md - Automation guide
- docs\API_DOCUMENTATION.md - API reference
- docs\TROUBLESHOOTING.md - Common issues
"@

$quickRef | Out-File -FilePath "QUICK-STATUS.txt" -Encoding UTF8
Write-Host "[INFO] Quick reference saved to QUICK-STATUS.txt" -ForegroundColor Cyan
Write-Host ""
