# Restart Backend Server
Write-Host "🔄 Restarting backend server..." -ForegroundColor Cyan

# Kill any existing node processes on port 5001
$port = 5001
$processId = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($processId) {
    Write-Host "   Stopping existing server (PID: $processId)..." -ForegroundColor Yellow
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Change to backend directory
Set-Location backend

# Start the server
Write-Host "   Starting server..." -ForegroundColor Green
npm run dev
