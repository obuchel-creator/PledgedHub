# PledgeHub - Cleanup and Restart Script
# Stops all node processes and restarts backend + frontend on correct ports

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   PledgeHub Cleanup & Restart Tool    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill all node processes
Write-Host "Step 1: Cleaning up existing node processes..." -ForegroundColor Yellow
try {
    $nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $count = ($nodeProcesses | Measure-Object).Count
        Write-Host "   Found $count node process(es)" -ForegroundColor Gray
        $nodeProcesses | ForEach-Object {
            Write-Host "   Stopping PID $($_.Id)..." -ForegroundColor Gray
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
        Write-Host "   All node processes stopped" -ForegroundColor Green
    } else {
        Write-Host "   No node processes found" -ForegroundColor Gray
    }
} catch {
    Write-Host "   Error stopping processes: $_" -ForegroundColor Yellow
}

Start-Sleep -Seconds 2

# Step 2: Verify ports are free
Write-Host ""
Write-Host "Step 2: Verifying ports are available..." -ForegroundColor Yellow
$portsToCheck = @(5001, 5173)
foreach ($port in $portsToCheck) {
    $connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "   Port $port still in use by PID $($connection.OwningProcess)" -ForegroundColor Yellow
        Write-Host "   Attempting to kill..." -ForegroundColor Gray
        Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "   Port $port is free" -ForegroundColor Green
    }
}

Start-Sleep -Seconds 2

# Step 3: Start Backend (separate window)
Write-Host ""
Write-Host "Step 3: Starting backend server..." -ForegroundColor Yellow
$backendPath = "C:\Users\HP\PledgeHub\backend"
$backendCmd = "cd '$backendPath'; Write-Host 'PledgeHub Backend Server' -ForegroundColor Cyan; npm run dev"

try {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
    Write-Host "   Backend server starting in new window (port 5001)" -ForegroundColor Green
} catch {
    Write-Host "   Failed to start backend: $_" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 5

# Step 4: Verify backend is running
Write-Host ""
Write-Host "Step 4: Verifying backend is ready..." -ForegroundColor Yellow
$maxAttempts = 10
$attempt = 0
$backendReady = $false

while ($attempt -lt $maxAttempts -and -not $backendReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5001/api/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            Write-Host "   Backend is ready!" -ForegroundColor Green
        }
    } catch {
        $attempt++
        Write-Host "   Waiting for backend... ($attempt/$maxAttempts)" -ForegroundColor Gray
        Start-Sleep -Seconds 1
    }
}

if (-not $backendReady) {
    Write-Host "   Backend may not be ready, but continuing..." -ForegroundColor Yellow
}

# Step 5: Start Frontend (separate window)
Write-Host ""
Write-Host "Step 5: Starting frontend server..." -ForegroundColor Yellow
$frontendPath = "C:\Users\HP\PledgeHub\frontend"
$frontendCmd = "cd '$frontendPath'; Write-Host 'PledgeHub Frontend Server' -ForegroundColor Cyan; npm run dev"

try {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
    Write-Host "   Frontend server starting in new window (port 5173)" -ForegroundColor Green
} catch {
    Write-Host "   Failed to start frontend: $_" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 5

# Step 6: Final status check
Write-Host ""
Write-Host "Step 6: Checking server status..." -ForegroundColor Yellow

# Check backend
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:5001/api/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($backendResponse.StatusCode -eq 200) {
        Write-Host "   Backend: ONLINE (http://localhost:5001)" -ForegroundColor Green
    }
} catch {
    Write-Host "   Backend: OFFLINE" -ForegroundColor Red
}

# Check frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "   Frontend: ONLINE (http://localhost:5173)" -ForegroundColor Green
    }
} catch {
    Write-Host "   Frontend: Starting up..." -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "          Setup Complete!               " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend: http://localhost:5173       " -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:5001       " -ForegroundColor Cyan
Write-Host ""
Write-Host "  Test Login Credentials:               " -ForegroundColor Cyan
Write-Host "  Email: testuser@example.com           " -ForegroundColor Cyan
Write-Host "  Pass:  testpass123                    " -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Both servers are running in separate windows." -ForegroundColor Green
Write-Host "Open your browser to: http://localhost:5173/login" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tip: Check the terminal windows for server logs" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
