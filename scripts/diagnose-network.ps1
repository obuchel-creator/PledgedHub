# ============================================
# Browser & System Cleanup Script
# Run this to fix HTTP/2 and network issues
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PledgeHub System Cleanup & Diagnostics" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check if servers are running
Write-Host "[STEP 1] Checking if servers are running..." -ForegroundColor Yellow
$backendRunning = Get-NetTCPConnection -State Listen -LocalPort 5001 -ErrorAction SilentlyContinue
$frontendRunning = Get-NetTCPConnection -State Listen -LocalPort 5173 -ErrorAction SilentlyContinue

if ($backendRunning) {
    Write-Host "  ✓ Backend server is running on port 5001" -ForegroundColor Green
} else {
    Write-Host "  ✗ Backend server NOT running" -ForegroundColor Red
    Write-Host "    Run: cd backend; npm run dev" -ForegroundColor Yellow
}

if ($frontendRunning) {
    Write-Host "  ✓ Frontend server is running on port 5173" -ForegroundColor Green
} else {
    Write-Host "  ✗ Frontend server NOT running" -ForegroundColor Red
    Write-Host "    Run: cd frontend; npm run dev" -ForegroundColor Yellow
}

Write-Host ""

# 2. Check Windows Firewall status
Write-Host "[STEP 2] Checking Windows Firewall..." -ForegroundColor Yellow
try {
    $firewallProfiles = Get-NetFirewallProfile -ErrorAction SilentlyContinue
    foreach ($profile in $firewallProfiles) {
        $status = if ($profile.Enabled) { "ON" } else { "OFF" }
        $color = if ($profile.Enabled) { "Green" } else { "Gray" }
        Write-Host "  $($profile.Name) Profile: $status" -ForegroundColor $color
    }
    
    Write-Host ""
    Write-Host "  Checking Node.js firewall rules..." -ForegroundColor Cyan
    $nodeRules = Get-NetFirewallApplicationFilter -ErrorAction SilentlyContinue | Where-Object {$_.Program -like "*node*"}
    if ($nodeRules) {
        Write-Host "  ✓ Node.js has firewall rules configured" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ No Node.js firewall rules found" -ForegroundColor Yellow
        Write-Host "    This might block connections. Add rule? (Requires Admin)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ Cannot check firewall (need admin privileges)" -ForegroundColor Yellow
}

Write-Host ""

# 3. Check Windows Defender
Write-Host "[STEP 3] Checking Windows Defender..." -ForegroundColor Yellow
try {
    $defender = Get-MpComputerStatus -ErrorAction SilentlyContinue
    if ($defender) {
        Write-Host "  Antivirus Enabled: $($defender.AntivirusEnabled)" -ForegroundColor Cyan
        Write-Host "  Real-time Protection: $($defender.RealTimeProtectionEnabled)" -ForegroundColor Cyan
        Write-Host "  Network Protection: $($defender.NISEnabled)" -ForegroundColor Cyan
        
        if ($defender.RealTimeProtectionEnabled) {
            Write-Host ""
            Write-Host "  ⚠ Real-time protection may block Node.js" -ForegroundColor Yellow
            Write-Host "    Consider adding exclusions for:" -ForegroundColor Yellow
            Write-Host "    - C:\Program Files\nodejs\" -ForegroundColor Gray
            Write-Host "    - C:\Users\HP\PledgeHub\" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "  ⚠ Cannot check Windows Defender status" -ForegroundColor Yellow
}

Write-Host ""

# 4. Clear DNS cache
Write-Host "[STEP 4] Flushing DNS cache..." -ForegroundColor Yellow
try {
    ipconfig /flushdns | Out-Null
    Write-Host "  ✓ DNS cache cleared" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Failed to clear DNS cache" -ForegroundColor Red
}

Write-Host ""

# 5. Check browser processes
Write-Host "[STEP 5] Checking browser processes..." -ForegroundColor Yellow
$browsers = @("chrome", "msedge", "firefox", "brave")
$runningBrowsers = @()

foreach ($browser in $browsers) {
    $process = Get-Process -Name $browser -ErrorAction SilentlyContinue
    if ($process) {
        $runningBrowsers += $browser
        Write-Host "  • $browser is running (PID: $($process.Id -join ', '))" -ForegroundColor Cyan
    }
}

if ($runningBrowsers.Count -eq 0) {
    Write-Host "  No browsers currently running" -ForegroundColor Gray
}

Write-Host ""

# 6. Clear browser cache instructions
Write-Host "[STEP 6] Browser Cache Clearing Instructions" -ForegroundColor Yellow
Write-Host ""
Write-Host "  === Chrome / Edge ===" -ForegroundColor Cyan
Write-Host "  1. Press Ctrl + Shift + Del" -ForegroundColor White
Write-Host "  2. Select 'Cached images and files'" -ForegroundColor White
Write-Host "  3. Click 'Clear data'" -ForegroundColor White
Write-Host "  4. Restart browser" -ForegroundColor White
Write-Host ""
Write-Host "  === OR Use Incognito Mode ===" -ForegroundColor Cyan
Write-Host "  Press Ctrl + Shift + N" -ForegroundColor White
Write-Host ""

# 7. Disable HTTP/2 instructions
Write-Host "[STEP 7] Disable HTTP/2 in Browser (Temporary Fix)" -ForegroundColor Yellow
Write-Host ""
Write-Host "  === Chrome ===" -ForegroundColor Cyan
Write-Host "  1. Open: chrome://flags/#enable-http2" -ForegroundColor White
Write-Host "  2. Set to 'Disabled'" -ForegroundColor White
Write-Host "  3. Restart Chrome" -ForegroundColor White
Write-Host ""
Write-Host "  === Edge ===" -ForegroundColor Cyan
Write-Host "  1. Open: edge://flags/#enable-http2" -ForegroundColor White
Write-Host "  2. Set to 'Disabled'" -ForegroundColor White
Write-Host "  3. Restart Edge" -ForegroundColor White
Write-Host ""

# 8. Test localhost connectivity
Write-Host "[STEP 8] Testing localhost connectivity..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  Testing Backend (5001)..." -ForegroundColor Cyan
try {
    $backend = Test-NetConnection -ComputerName localhost -Port 5001 -WarningAction SilentlyContinue
    if ($backend.TcpTestSucceeded) {
        Write-Host "  ✓ Backend is accessible" -ForegroundColor Green
        
        # Try to make HTTP request
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5001" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            Write-Host "  ✓ Backend responds with HTTP $($response.StatusCode)" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠ Port is open but HTTP request failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ✗ Backend is NOT accessible" -ForegroundColor Red
        Write-Host "    Start it with: cd backend; npm run dev" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Cannot test backend connection" -ForegroundColor Red
}

Write-Host ""
Write-Host "  Testing Frontend (5173)..." -ForegroundColor Cyan
try {
    $frontend = Test-NetConnection -ComputerName localhost -Port 5173 -WarningAction SilentlyContinue
    if ($frontend.TcpTestSucceeded) {
        Write-Host "  ✓ Frontend is accessible" -ForegroundColor Green
        
        # Try to make HTTP request
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            Write-Host "  ✓ Frontend responds with HTTP $($response.StatusCode)" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠ Port is open but HTTP request failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ✗ Frontend is NOT accessible" -ForegroundColor Red
        Write-Host "    Start it with: cd frontend; npm run dev" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Cannot test frontend connection" -ForegroundColor Red
}

Write-Host ""

# 9. Offer to start servers
Write-Host "[STEP 9] Server Management" -ForegroundColor Yellow
Write-Host ""

if (-not $backendRunning -or -not $frontendRunning) {
    Write-Host "  Servers are not running. Would you like to start them?" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Option A: Start automatically (recommended)" -ForegroundColor Green
    Write-Host "    .\scripts\dev.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "  Option B: Start manually" -ForegroundColor Yellow
    Write-Host "    Window 1: cd backend; npm run dev" -ForegroundColor White
    Write-Host "    Window 2: cd frontend; npm run dev" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "  ✓ Both servers are running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Access your application at:" -ForegroundColor Cyan
    Write-Host "  → Frontend: http://localhost:5173" -ForegroundColor White
    Write-Host "  → Backend:  http://localhost:5001" -ForegroundColor White
    Write-Host ""
}

# 10. Summary and next steps
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SUMMARY AND NEXT STEPS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "If you still see ERR_HTTP2_PROTOCOL_ERROR:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Clear browser cache (Ctrl + Shift + Del)" -ForegroundColor White
Write-Host "2. Try incognito mode (Ctrl + Shift + N)" -ForegroundColor White
Write-Host "3. Disable HTTP/2:" -ForegroundColor White
Write-Host "   • Chrome: chrome://flags/#enable-http2" -ForegroundColor Gray
Write-Host "   • Edge: edge://flags/#enable-http2" -ForegroundColor Gray
Write-Host "4. Restart your browser completely" -ForegroundColor White
Write-Host "5. Try a different browser" -ForegroundColor White
Write-Host ""

Write-Host "If servers will not start:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Kill existing processes:" -ForegroundColor White
Write-Host "   Get-Process node | Stop-Process -Force" -ForegroundColor Gray
Write-Host "2. Start fresh:" -ForegroundColor White
Write-Host "   .\scripts\dev.ps1" -ForegroundColor Gray
Write-Host ""

Write-Host "For persistent issues:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Clean reinstall:" -ForegroundColor White
Write-Host "   cd backend; Remove-Item node_modules -Recurse -Force; npm install" -ForegroundColor Gray
Write-Host "   cd frontend; Remove-Item node_modules -Recurse -Force; npm install" -ForegroundColor Gray
Write-Host "2. Reset network:" -ForegroundColor White
Write-Host "   netsh int ip reset" -ForegroundColor Gray
Write-Host "   netsh winsock reset" -ForegroundColor Gray
Write-Host "   Restart computer" -ForegroundColor Gray
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Script completed! Check steps above." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Pause at end so user can read
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
