# PledgeHub Backup Restore Guide

## 1. Download Encrypted Backups from Google Drive
- Use rclone to download the latest encrypted backup files:
  ```powershell
  rclone copy gdrive:PledgeHubBackups C:\Users\HP\PledgeHub\db_backups
  ```
- Find the latest files (e.g., `pledgehub_db_YYYYMMDD_HHMMSS.sql.enc`, `.env_YYYYMMDD_HHMMSS.enc`)

## 2. Decrypt Backup Files with OpenSSL
- Open PowerShell in your project folder
- Run:
  ```powershell
  openssl enc -d -aes-256-cbc -in C:\Users\HP\PledgeHub\db_backups\pledgehub_db_YYYYMMDD_HHMMSS.sql.enc -out C:\Users\HP\PledgeHub\db_backups\restore.sql -k YourEncryptionPassword
  ```
- For .env file:
  ```powershell
  openssl enc -d -aes-256-cbc -in C:\Users\HP\PledgeHub\db_backups\.env_YYYYMMDD_HHMMSS.enc -out C:\Users\HP\PledgeHub\backend\.env -k YourEncryptionPassword
  ```

## 3. Restore MySQL Database
- Import the decrypted SQL file:
  ```powershell
  mysql -u root -p pledgehub_db < C:\Users\HP\PledgeHub\db_backups\restore.sql
  ```
- Enter your MySQL password when prompted

## 4. Restore .env/Config Files
- Copy the decrypted .env file to your backend folder if not already done

## Notes
- Always use the same encryption password for backup and restore
- Never share your encryption password or decrypted files publicly
- For troubleshooting, check for errors in OpenSSL or MySQL commands

---
If you need help with a specific restore scenario, ask for step-by-step assistance!
