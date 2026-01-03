# MySQL and Config Backup Script (Encrypted, Google Drive)
#
# This PowerShell script will:
# 1. Dump your MySQL database to a local backup file
# 2. Encrypt the backup and .env/config files
# 3. Upload encrypted files to Google Drive using rclone
#
# --- CONFIGURATION ---
$MySQLUser = "root"
$MySQLPassword = "your_password"
$MySQLDatabase = "pledgehub_db"
$BackupDir = "$PSScriptRoot\db_backups"
$DateString = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupDir\${MySQLDatabase}_$DateString.sql"
$EncryptedBackupFile = "$BackupFile.enc"
$EnvFile = "$PSScriptRoot\backend\.env"
$EncryptedEnvFile = "$BackupDir\.env_$DateString.enc"
$EncryptionPassword = "ChangeThisToAStrongPassword"  # Store securely!
$RcloneRemote = "gdrive:PledgeHubBackups"  # rclone remote:path

# --- Ensure backup directory exists ---
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

# --- Dump the MySQL database ---
Write-Host "Backing up MySQL database..."
$env:MYSQL_PWD = $MySQLPassword
mysqldump -u $MySQLUser $MySQLDatabase > $BackupFile
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backup failed!"
    exit 1
}

# --- Encrypt the backup file ---
Write-Host "Encrypting database backup..."
openssl enc -aes-256-cbc -salt -in $BackupFile -out $EncryptedBackupFile -k $EncryptionPassword
if ($LASTEXITCODE -ne 0) {
    Write-Host "Encryption failed!"
    exit 1
}

# --- Encrypt the .env file ---
if (Test-Path $EnvFile) {
    Write-Host "Encrypting .env file..."
    openssl enc -aes-256-cbc -salt -in $EnvFile -out $EncryptedEnvFile -k $EncryptionPassword
    if ($LASTEXITCODE -ne 0) {
        Write-Host ".env encryption failed!"
        exit 1
    }
}

# --- Upload encrypted files to Google Drive ---
Write-Host "Uploading encrypted files to Google Drive..."
rclone copy $EncryptedBackupFile $RcloneRemote
if (Test-Path $EncryptedEnvFile) {
    rclone copy $EncryptedEnvFile $RcloneRemote
}

# --- Clean up old backups (keep last 14 days) ---
Get-ChildItem $BackupDir -Filter "*.enc" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-14) } | Remove-Item

Write-Host "Backup and upload process complete."
