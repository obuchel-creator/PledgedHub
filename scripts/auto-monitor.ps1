<#
.SYNOPSIS
    Automated deployment and health check script
    
.DESCRIPTION
    Monitors the application health and automatically restarts services if needed.
    Performs continuous health checks and logging.
    
.EXAMPLE
    .\scripts\auto-monitor.ps1
    .\scripts\auto-monitor.ps1 -CheckInterval 60
#>

param(
    [int]$CheckInterval = 30,  # Seconds between health checks
    [string]$LogFile = "monitor.log",
    [switch]$EmailAlerts,
    [string]$AlertEmail = ""
)

$ErrorActionPreference = "Continue"
$scriptRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
Set-Location $scriptRoot

# Color output functions
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Error-Custom { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warning-Custom { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }

function Log-Message {
    param($message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $message" | Out-File -Append -FilePath $LogFile
    Write-Info "$timestamp - $message"
}

function Check-Backend {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5001/health" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

function Check-Frontend {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

function Check-Database {
    try {
        Push-Location backend
        $result = node -e "const {pool} = require('./config/db'); pool.execute('SELECT 1').then(() => {console.log('OK'); process.exit(0);}).catch(() => process.exit(1));" 2>&1
        Pop-Location
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

function Restart-BackendServer {
    Log-Message "Attempting to restart backend server..."
    
    # Kill existing process
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.Path -like "*backend*"
    } | Stop-Process -Force
    
    Start-Sleep -Seconds 2
    
    # Start new process
    Push-Location backend
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Hidden
    Pop-Location
    
    Start-Sleep -Seconds 5
    Log-Message "Backend server restarted"
}

function Restart-FrontendServer {
    Log-Message "Attempting to restart frontend server..."
    
    # Kill existing process
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.Path -like "*frontend*"
    } | Stop-Process -Force
    
    Start-Sleep -Seconds 2
    
    # Start new process
    Push-Location frontend
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Hidden
    Pop-Location
    
    Start-Sleep -Seconds 5
    Log-Message "Frontend server restarted"
}

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║            PledgeHub Automated Monitor & Manager             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Log-Message "Monitor started with $CheckInterval second interval"
Log-Message "Log file: $LogFile"

$consecutiveFailures = @{
    Backend = 0
    Frontend = 0
    Database = 0
}

Write-Info "Starting health checks (Ctrl+C to stop)..."

while ($true) {
    $allHealthy = $true
    
    # Check Backend
    if (Check-Backend) {
        $consecutiveFailures.Backend = 0
    } else {
        $consecutiveFailures.Backend++
        $allHealthy = $false
        
        if ($consecutiveFailures.Backend -eq 1) {
            Write-Warning-Custom "Backend health check failed"
            Log-Message "Backend health check failed"
        }
        
        if ($consecutiveFailures.Backend -ge 3) {
            Write-Error-Custom "Backend failed 3 consecutive checks - attempting restart"
            Log-Message "Backend failed 3 consecutive checks - attempting restart"
            Restart-BackendServer
            $consecutiveFailures.Backend = 0
        }
    }
    
    # Check Frontend
    if (Check-Frontend) {
        $consecutiveFailures.Frontend = 0
    } else {
        $consecutiveFailures.Frontend++
        $allHealthy = $false
        
        if ($consecutiveFailures.Frontend -eq 1) {
            Write-Warning-Custom "Frontend health check failed"
            Log-Message "Frontend health check failed"
        }
        
        if ($consecutiveFailures.Frontend -ge 3) {
            Write-Error-Custom "Frontend failed 3 consecutive checks - attempting restart"
            Log-Message "Frontend failed 3 consecutive checks - attempting restart"
            Restart-FrontendServer
            $consecutiveFailures.Frontend = 0
        }
    }
    
    # Check Database
    if (Check-Database) {
        $consecutiveFailures.Database = 0
    } else {
        $consecutiveFailures.Database++
        $allHealthy = $false
        
        if ($consecutiveFailures.Database -eq 1) {
            Write-Warning-Custom "Database connection failed"
            Log-Message "Database connection failed"
        }
        
        if ($consecutiveFailures.Database -ge 3) {
            Write-Error-Custom "Database connection failed 3 times - please check MySQL service"
            Log-Message "Database connection critical - manual intervention needed"
        }
    }
    
    if ($allHealthy) {
        $timestamp = Get-Date -Format "HH:mm:ss"
        Write-Host "[$timestamp] ✓ All systems healthy" -ForegroundColor Green
    }
    
    Start-Sleep -Seconds $CheckInterval
}
