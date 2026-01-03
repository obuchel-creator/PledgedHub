# PledgeHub Backup Script Setup Guide

## 1. Install rclone (Google Drive integration)
- Download rclone for Windows: https://rclone.org/downloads/
- Extract and place `rclone.exe` in a folder (e.g., C:\rclone)
- Add the folder to your PATH (optional for easy access)

### Configure rclone for Google Drive:
1. Open PowerShell and run:
   ```powershell
   rclone config
   ```
2. Choose `n` for new remote, name it (e.g., `gdrive`)
3. Select `drive` as the storage type
4. Follow prompts to authenticate with Google (browser will open)
5. Accept permissions, finish setup

## 2. Install OpenSSL for Windows
- Download OpenSSL installer: https://slproweb.com/products/Win32OpenSSL.html
- Run installer and follow instructions
- Add OpenSSL to your PATH (or use full path in script)

## 3. Test the Backup Script
- Edit `mysql-backup-encrypted-gdrive.ps1` with your MySQL credentials and encryption password
- Open PowerShell in your project folder
- Run:
   ```powershell
   .\scripts\mysql-backup-encrypted-gdrive.ps1
   ```
- Check for backup files in `db_backups` and verify upload in Google Drive

## 4. Schedule Automatic Backups
- Open Windows Task Scheduler
- Create a new task:
   - Action: Run PowerShell with script path
   - Trigger: Daily, or as needed
   - Example Action:
     ```
     powershell.exe -File "C:\Users\HP\PledgeHub\scripts\mysql-backup-encrypted-gdrive.ps1"
     ```

## Notes
- Change the encryption password in the script and store it securely
- Never upload unencrypted backups or .env files to the cloud
- Restore instructions: Use OpenSSL to decrypt, then import SQL to MySQL

---
For help with restore or troubleshooting, ask for detailed steps!
