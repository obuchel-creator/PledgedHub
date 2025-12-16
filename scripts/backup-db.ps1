# MySQL Database Backup Script for PledgeHub (Windows)
# Usage: Run this PowerShell script to back up your MySQL database to a timestamped .sql file.
# Customize DB_USER, DB_PASS, DB_NAME, and BACKUP_DIR as needed.

$DB_USER = "root"
$DB_PASS = "your_password"  # PSScriptAnalyzer: This variable is used in the mysqldump command below
$DB_NAME = "pledgehub_db"
$BACKUP_DIR = "C:\Users\HP\PledgeHub\db_backups"

if (!(Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $BACKUP_DIR "$DB_NAME`_$timestamp.sql"


$mysqldump = "mysqldump"

Write-Host "Backing up $DB_NAME to $backupFile ..."

# Use $DB_PASS in the command, properly quoted for PowerShell
& $mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup successful: $backupFile"
} else {
    Write-Host "Backup failed."
}
