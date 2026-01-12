# PowerShell script to drop the 'title' column from the 'pledges' table in the 'pledgehub_db' database
# Usage: .\drop-title-column.ps1


# Always resolve backend/.env relative to the script location
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$envFile = Join-Path $scriptDir "..\backend\.env" | Resolve-Path -ErrorAction SilentlyContinue
if ($envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^(\w+)=(.*)$") {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
} else {
    Write-Host "Could not find backend/.env file."
}

$DB_HOST = $env:DB_HOST
$DB_USER = $env:DB_USER
$DB_PASS = $env:DB_PASS
$DB_NAME = $env:DB_NAME

if (-not $DB_HOST -or -not $DB_USER -or -not $DB_NAME) {
    Write-Host "Missing DB credentials. Please check your backend/.env file."
    exit 1
}

$mysqlCmd = "mysql -h $DB_HOST -u $DB_USER"
if ($DB_PASS) { $mysqlCmd += " -p`"$DB_PASS`"" }
$mysqlCmd += " $DB_NAME -e 'ALTER TABLE pledges DROP COLUMN title;'"

Write-Host "Running: $mysqlCmd"
Invoke-Expression $mysqlCmd

Write-Host "✅ 'title' column dropped from pledges table (if it existed)."
