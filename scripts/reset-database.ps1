Write-Host "⚠️  WARNING: This will reset the database!" -ForegroundColor Yellow
$confirm = Read-Host "Type 'RESET' to confirm"
if ($confirm -eq "RESET") {
    Push-Location backend
    node scripts\complete-migration.js
    node scripts\seed-data.js
    Pop-Location
    Write-Host "✅ Database reset complete" -ForegroundColor Green
} else {
    Write-Host "❌ Reset cancelled" -ForegroundColor Red
}
