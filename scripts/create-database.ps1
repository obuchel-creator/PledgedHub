# Create PledgeHub Database
# This script creates the database and runs all migrations

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  PledgeHub Database Setup" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# MySQL path
$mysqlPath = "C:\tools\mysql\current\bin\mysql.exe"

# Check if MySQL exists
if (-not (Test-Path $mysqlPath)) {
    Write-Host "ERROR: MySQL not found at $mysqlPath" -ForegroundColor Red
    Write-Host "Checking alternative path..." -ForegroundColor Yellow
    $mysqlPath = "c:\wamp64\bin\mysql\mysql5.7.36\bin\mysql.exe"
    
    if (-not (Test-Path $mysqlPath)) {
        Write-Host "ERROR: MySQL not found. Please install MySQL." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Found MySQL at: $mysqlPath" -ForegroundColor Green
Write-Host ""

# Database credentials
$dbHost = "localhost"
$dbUser = "root"
$dbPass = ""
$dbName = "pledgehub_db"

Write-Host "Step 1: Creating database '$dbName'..." -ForegroundColor Yellow

if ($dbPass -eq "") {
    # No password
    $createDbCmd = "CREATE DATABASE IF NOT EXISTS $dbName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    echo $createDbCmd | & $mysqlPath -h $dbHost -u $dbUser
} else {
    # With password
    $createDbCmd = "CREATE DATABASE IF NOT EXISTS $dbName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    echo $createDbCmd | & $mysqlPath -h $dbHost -u $dbUser -p$dbPass
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Database '$dbName' created!" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to create database" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Running database migrations..." -ForegroundColor Yellow

# Check if init-database.sql exists
if (Test-Path "$PSScriptRoot\..\init-database.sql") {
    Write-Host "Running init-database.sql..." -ForegroundColor Cyan
    
    if ($dbPass -eq "") {
        Get-Content "$PSScriptRoot\..\init-database.sql" | & $mysqlPath -h $dbHost -u $dbUser $dbName
    } else {
        Get-Content "$PSScriptRoot\..\init-database.sql" | & $mysqlPath -h $dbHost -u $dbUser -p$dbPass $dbName
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Database schema created!" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Some errors occurred during migration" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Step 3: Verifying tables..." -ForegroundColor Yellow

if ($dbPass -eq "") {
    $tables = & $mysqlPath -h $dbHost -u $dbUser $dbName -e "SHOW TABLES;"
} else {
    $tables = & $mysqlPath -h $dbHost -u $dbUser -p$dbPass $dbName -e "SHOW TABLES;"
}

Write-Host "Tables in database:" -ForegroundColor Cyan
Write-Host $tables

Write-Host ""
Write-Host "=======================================" -ForegroundColor Green
Write-Host "  Database Setup Complete!" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Add MTN credentials to backend\.env" -ForegroundColor White
Write-Host "2. Add Airtel credentials to backend\.env" -ForegroundColor White
Write-Host "3. Run: .\scripts\pre-departure-setup.ps1 -QuickStart" -ForegroundColor White
Write-Host ""
