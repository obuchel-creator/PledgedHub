# MySQL Backup and Cloud Upload Script for PledgeHub
#
# This PowerShell script will:
# 1. Dump your MySQL database to a local backup file
# 2. (Optional) Upload the backup to a cloud storage provider
#
# --- CONFIGURATION ---
# Set these variables before running
$MySQLUser = "root"
$MySQLPassword = "your_password"
$MySQLDatabase = "pledgehub_db"
$BackupDir = "$PSScriptRoot\db_backups"
$DateString = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupDir\${MySQLDatabase}_$DateString.sql"

# --- Ensure backup directory exists ---
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

# --- Dump the MySQL database ---
Write-Host "Backing up MySQL database..."
$env:MYSQL_PWD = $MySQLPassword
mysqldump -u $MySQLUser $MySQLDatabase > $BackupFile
if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup successful: $BackupFile"
} else {
    Write-Host "Backup failed!"
    exit 1
}

# --- Upload to cloud (Dropbox example) ---
# Requires Dropbox CLI or rclone. Uncomment and configure as needed.
# $DropboxPath = "/PledgeHubBackups/${MySQLDatabase}_$DateString.sql"
# rclone copy $BackupFile dropbox:$DropboxPath
# if ($LASTEXITCODE -eq 0) {
#     Write-Host "Uploaded to Dropbox: $DropboxPath"
# } else {
#     Write-Host "Cloud upload failed!"
# }

# --- Clean up old backups (keep last 14 days) ---
Get-ChildItem $BackupDir -Filter "${MySQLDatabase}_*.sql" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-14) } | Remove-Item

Write-Host "Backup process complete."
