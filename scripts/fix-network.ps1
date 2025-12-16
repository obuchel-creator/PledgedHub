# Network Diagnostics Script for PledgeHub
# Checks system status and provides troubleshooting steps

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  PledgeHub Network Diagnostics" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check servers
Write-Host "[1] Checking servers..." -ForegroundColor Yellow
$backendRunning = Get-NetTCPConnection -State Listen -LocalPort 5001 -ErrorAction SilentlyContinue
$frontendRunning = Get-NetTCPConnection -State Listen -LocalPort 5173 -ErrorAction SilentlyContinue

if ($backendRunning) {
    Write-Host "  OK Backend running on port 5001" -ForegroundColor Green
} else {
    Write-Host "  FAIL Backend NOT running" -ForegroundColor Red
}

if ($frontendRunning) {
    Write-Host "  OK Frontend running on port 5173" -ForegroundColor Green
} else {
    Write-Host "  FAIL Frontend NOT running" -ForegroundColor Red
}

Write-Host ""

# Step 2: Check firewall
Write-Host "[2] Checking Windows Firewall..." -ForegroundColor Yellow
$profiles = Get-NetFirewallProfile -ErrorAction SilentlyContinue
if ($profiles) {
    foreach ($p in $profiles) {
        Write-Host "  $($p.Name): $($p.Enabled)" -ForegroundColor Cyan
    }
} else {
    Write-Host "  Cannot check firewall" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Flush DNS
Write-Host "[3] Flushing DNS cache..." -ForegroundColor Yellow
ipconfig /flushdns | Out-Null
Write-Host "  OK DNS cache cleared" -ForegroundColor Green

Write-Host ""

# Step 4: Test connectivity
Write-Host "[4] Testing connectivity..." -ForegroundColor Yellow

if ($backendRunning) {
    Write-Host "  Testing backend..." -ForegroundColor Cyan
    $test = Test-NetConnection -ComputerName localhost -Port 5001 -WarningAction SilentlyContinue
    if ($test.TcpTestSucceeded) {
        Write-Host "  OK Backend accessible" -ForegroundColor Green
    }
}

if ($frontendRunning) {
    Write-Host "  Testing frontend..." -ForegroundColor Cyan
    $test = Test-NetConnection -ComputerName localhost -Port 5173 -WarningAction SilentlyContinue
    if ($test.TcpTestSucceeded) {
        Write-Host "  OK Frontend accessible" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  MANUAL STEPS REQUIRED" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 1: Clear Browser Cache" -ForegroundColor Yellow
Write-Host "  - Press Ctrl + Shift + Del" -ForegroundColor White
Write-Host "  - Select 'Cached images and files'" -ForegroundColor White
Write-Host "  - Click 'Clear data'" -ForegroundColor White
Write-Host ""

Write-Host "STEP 2: Try Incognito Mode" -ForegroundColor Yellow
Write-Host "  - Press Ctrl + Shift + N" -ForegroundColor White
Write-Host "  - Go to http://localhost:5173" -ForegroundColor White
Write-Host ""

Write-Host "STEP 3: Disable HTTP/2 (Chrome)" -ForegroundColor Yellow
Write-Host "  - Open: chrome://flags/#enable-http2" -ForegroundColor White
Write-Host "  - Set to 'Disabled'" -ForegroundColor White
Write-Host "  - Restart Chrome" -ForegroundColor White
Write-Host ""

Write-Host "STEP 4: Disable HTTP/2 (Edge)" -ForegroundColor Yellow
Write-Host "  - Open: edge://flags/#enable-http2" -ForegroundColor White
Write-Host "  - Set to 'Disabled'" -ForegroundColor White
Write-Host "  - Restart Edge" -ForegroundColor White
Write-Host ""

if (-not $backendRunning -or -not $frontendRunning) {
    Write-Host "SERVERS NOT RUNNING - Start them:" -ForegroundColor Red
    Write-Host "  Option A: .\scripts\dev.ps1" -ForegroundColor White
    Write-Host "  Option B: Manual start" -ForegroundColor White
    Write-Host "    Window 1: cd backend; npm run dev" -ForegroundColor Gray
    Write-Host "    Window 2: cd frontend; npm run dev" -ForegroundColor Gray
} else {
    Write-Host "SERVERS ARE RUNNING!" -ForegroundColor Green
    Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
    Write-Host "  Backend:  http://localhost:5001" -ForegroundColor White
}

Write-Host ""
Write-Host "Press Enter to continue..."
$null = Read-Host
