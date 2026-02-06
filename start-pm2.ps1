# PledgeHub PM2 Startup Script
Write-Host "🚀 Starting PledgeHub with PM2..." -ForegroundColor Green

# Kill existing Node processes
Write-Host "Stopping existing Node processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 2

# Install PM2 if not installed
Write-Host "Checking PM2 installation..." -ForegroundColor Cyan
$pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2Installed) {
    Write-Host "Installing PM2..." -ForegroundColor Yellow
    npm install -g pm2
}

# Start backend
Write-Host "Starting backend server..." -ForegroundColor Cyan
Set-Location backend
pm2 start server.js --name pledgehub-backend --log-date-format "HH:mm:ss"
Set-Location ..

# Start frontend
Write-Host "Starting frontend server..." -ForegroundColor Cyan
Set-Location frontend
pm2 start npm --name pledgehub-frontend -- run dev
Set-Location ..

# Show status
Write-Host "`n✅ Servers started successfully!" -ForegroundColor Green
pm2 list

Write-Host "`n📊 Useful PM2 commands:" -ForegroundColor Yellow
Write-Host "  pm2 logs           - View all logs"
Write-Host "  pm2 logs --lines 50 - View last 50 lines"
Write-Host "  pm2 monit          - Monitor processes"
Write-Host "  pm2 stop all       - Stop all servers"
Write-Host "  pm2 restart all    - Restart all servers"
Write-Host "  pm2 delete all     - Remove all processes"

Write-Host "`n🌐 Open your browser to: http://localhost:5173" -ForegroundColor Green
