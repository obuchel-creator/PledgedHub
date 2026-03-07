$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Write-Host "Starting frontend..."
Set-Location "C:\Users\HP\PledgeHub\frontend"
npm run dev
