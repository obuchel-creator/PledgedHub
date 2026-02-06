#!/usr/bin/env pwsh
# Quick Test Runner - No Cypress or Vite needed!

Write-Host "`n🧪 PledgeHub Test Suite`n" -ForegroundColor Cyan

$originalLocation = Get-Location

try {
    Set-Location "$PSScriptRoot\backend"
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host "📋 Option 1: Backend Integration Tests (Fast)" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host "Tests: Auth, Pledges, Campaigns, AI, Analytics, Reminders, Payments"
    Write-Host "Duration: ~30-60 seconds"
    Write-Host "Command: node scripts\test-all-features.js`n"
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host "🎯 Option 2: Jest Unit Tests" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host "Tests: Controllers, Models, Services (Mocked)"
    Write-Host "Duration: ~10-20 seconds"
    Write-Host "Command: npm test`n"
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host "📊 Option 3: Jest with Coverage" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host "Tests: Full unit tests + coverage report"
    Write-Host "Duration: ~20-30 seconds"
    Write-Host "Command: npm run test:coverage`n"
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host "🌐 Option 4: Playwright E2E (Frontend Required)" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host "Tests: Full user workflows (requires servers running)"
    Write-Host "Duration: ~2-3 minutes"
    Write-Host "Command: cd ..\frontend; npx playwright test`n"
    
    Write-Host "`n" -NoNewline
    $choice = Read-Host "Choose test to run (1-4, or Enter to skip)"
    
    switch ($choice) {
        "1" {
            Write-Host "`n🚀 Running Backend Integration Tests...`n" -ForegroundColor Green
            node scripts\test-all-features.js
        }
        "2" {
            Write-Host "`n🚀 Running Jest Unit Tests...`n" -ForegroundColor Green
            npm test
        }
        "3" {
            Write-Host "`n🚀 Running Jest with Coverage...`n" -ForegroundColor Green
            npm run test:coverage
        }
        "4" {
            Write-Host "`n⚠️  Starting Playwright requires both servers running." -ForegroundColor Yellow
            Write-Host "Please run .\scripts\dev.ps1 first, then run: npx playwright test`n"
        }
        default {
            Write-Host "`n✅ Test menu shown. Run manually with commands above.`n" -ForegroundColor Cyan
        }
    }
    
} finally {
    Set-Location $originalLocation
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "📚 Quick Reference:" -ForegroundColor Cyan
Write-Host "  • Backend only: cd backend; node scripts\test-all-features.js"
Write-Host "  • Unit tests: cd backend; npm test"
Write-Host "  • With coverage: cd backend; npm run test:coverage"
Write-Host "  • E2E (needs servers): cd frontend; npx playwright test"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Blue
