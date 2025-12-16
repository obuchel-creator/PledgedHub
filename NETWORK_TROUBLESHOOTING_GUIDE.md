# Network & HTTP/2 Error Troubleshooting Guide

## Status Update (December 15, 2025)

### ✅ What's Working:
- **Database**: pledgehub_db created with all 6 tables
- **Backend Server**: Running on port 5001
- **AI Chatbot**: Integrated with WhatsApp Business API
- **Payment System**: MTN & Airtel integration configured
- **Professional UI**: Modern payment wizard for all users

### ⚠️ Current Issue: ERR_HTTP2_PROTOCOL_ERROR

This error occurs when the browser cannot properly communicate with the server using HTTP/2 protocol.

---

## Quick Fix Steps

### Step 1: Start Both Servers Properly

```powershell
# Open 2 PowerShell windows

# Window 1 - Backend
cd C:\Users\HP\PledgeHub\backend
npm run dev

# Window 2 - Frontend
cd C:\Users\HP\PledgeHub\frontend
npm run dev
```

**OR use the automated script:**

```powershell
cd C:\Users\HP\PledgeHub
.\scripts\dev.ps1
```

### Step 2: Verify Servers Are Running

```powershell
# Test backend
curl http://localhost:5001

# Test frontend
curl http://localhost:5173

# Check listening ports
Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -in @(5001, 5173)}
```

### Step 3: Clear Browser Cache

**Chrome/Edge:**
1. Press `Ctrl + Shift + Del`
2. Select "Cached images and files"
3. Click "Clear data"
4. Restart browser

**OR use Incognito Mode:**
- Press `Ctrl + Shift + N`
- Navigate to http://localhost:5173

### Step 4: Disable HTTP/2 in Browser (Temporary Fix)

**Chrome:**
```
chrome://flags/#enable-http2
Set to "Disabled"
Restart browser
```

**Edge:**
```
edge://flags/#enable-http2
Set to "Disabled"
Restart browser
```

---

## Common Causes & Solutions

### 1. **Frontend Not Running**

**Symptom:** Page doesn't load at all

**Solution:**
```powershell
cd C:\Users\HP\PledgeHub\frontend
npm run dev
```

**Expected Output:**
```
VITE v5.4.21  ready in 1661 ms
➜  Local:   http://localhost:5173/
```

---

### 2. **Backend Not Running**

**Symptom:** API calls fail, ERR_CONNECTION_REFUSED

**Solution:**
```powershell
cd C:\Users\HP\PledgeHub\backend
npm run dev
```

**Expected Output:**
```
Server running on port 5001
```

---

### 3. **Port Already in Use**

**Symptom:** "Port 5001 already in use" or "Port 5173 already in use"

**Find what's using the port:**
```powershell
Get-NetTCPConnection -LocalPort 5001 | Select-Object -ExpandProperty OwningProcess
Get-Process -Id <ProcessId>
```

**Kill the process:**
```powershell
Stop-Process -Id <ProcessId> -Force
```

**OR change the port:**

**Backend (.env):**
```bash
PORT=5002
```

**Frontend (vite.config.js):**
```javascript
export default defineConfig({
  server: {
    port: 5174
  }
})
```

---

### 4. **Windows Firewall Blocking**

**Check if Node is allowed:**
```powershell
# Run as Administrator
Get-NetFirewallApplicationFilter | Where-Object {$_.Program -like "*node*"}
```

**Add firewall rule:**
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Node.js Server" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow
```

---

### 5. **Antivirus Blocking Connections**

**Temporary Test:**
1. Disable antivirus temporarily
2. Try accessing http://localhost:5173
3. If it works, add Node.js to antivirus exclusions

**Windows Defender Exclusions:**
1. Windows Security → Virus & threat protection
2. Manage settings → Add exclusions
3. Add folder: `C:\Program Files\nodejs\`
4. Add folder: `C:\Users\HP\PledgeHub\`

---

### 6. **Corrupt Node Modules**

**Symptom:** Weird errors, missing modules

**Solution:**
```powershell
# Backend
cd C:\Users\HP\PledgeHub\backend
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force
npm install

# Frontend
cd C:\Users\HP\PledgeHub\frontend
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force
npm install
```

---

### 7. **CORS Issues**

**Symptom:** "Access-Control-Allow-Origin" errors in console

**Already Fixed in server.js**, but verify:

```javascript
// backend/server.js
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
```

---

### 8. **Vite Proxy Configuration**

**Check frontend/vite.config.js:**

```javascript
export default defineConfig({
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

---

## Advanced Troubleshooting

### Check Network Stack

```powershell
# Reset network stack (Run as Administrator)
netsh int ip reset
netsh winsock reset
ipconfig /flushdns
```

**Restart computer after running these commands.**

### Check Hosts File

```powershell
notepad C:\Windows\System32\drivers\etc\hosts
```

**Should contain:**
```
127.0.0.1       localhost
::1             localhost
```

### Test with Different Browsers

1. **Chrome** - http://localhost:5173
2. **Firefox** - http://localhost:5173
3. **Edge** - http://localhost:5173

If one browser works, it's a browser-specific issue.

### Use Different Ports

**Test if it's a port-specific issue:**

```powershell
# Start on different ports
cd backend
$env:PORT=5002; npm run dev

cd frontend
# Edit vite.config.js to use port 5174
npm run dev
```

---

## HTTP/2 Specific Fixes

### Option 1: Force HTTP/1.1 in Vite

**frontend/vite.config.js:**
```javascript
export default defineConfig({
  server: {
    https: false,  // Disable HTTPS
    http2: false,   // Force HTTP/1.1
    port: 5173
  }
})
```

### Option 2: Use HTTPS Properly

**Install mkcert for local HTTPS:**

```powershell
# Install mkcert
choco install mkcert

# Create local CA
mkcert -install

# Generate certificates
cd C:\Users\HP\PledgeHub\frontend
mkcert localhost 127.0.0.1 ::1
```

**Update vite.config.js:**
```javascript
import fs from 'fs';

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('./localhost-key.pem'),
      cert: fs.readFileSync('./localhost.pem')
    },
    port: 5173
  }
})
```

---

## Emergency: Use Alternative Development Server

If Vite continues to fail, use alternative:

```powershell
cd C:\Users\HP\PledgeHub\frontend
npm install -g serve
npm run build
serve -s dist -l 5173
```

---

## Monitoring & Debugging

### Real-Time Network Monitoring

**Backend logs:**
```powershell
cd C:\Users\HP\PledgeHub\backend
npm run dev
# Watch for errors in console
```

**Frontend logs:**
```powershell
cd C:\Users\HP\PledgeHub\frontend
npm run dev
# Watch for errors in console
```

**Browser DevTools:**
1. Press `F12`
2. Go to "Network" tab
3. Refresh page
4. Look for failed requests (red)
5. Click on failed request to see error details

### Check Backend API Directly

```powershell
# Test various endpoints
curl http://localhost:5001
curl http://localhost:5001/api/test
curl http://localhost:5001/api/campaigns
```

---

## Current System Status Check

Run this comprehensive check:

```powershell
Write-Host "=== PledgeHub System Status Check ===" -ForegroundColor Cyan

# 1. Check Node.js
Write-Host "`n1. Node.js Version:" -ForegroundColor Yellow
node --version

# 2. Check if servers are running
Write-Host "`n2. Running Node Processes:" -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName

# 3. Check listening ports
Write-Host "`n3. Listening Ports:" -ForegroundColor Yellow
Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -in @(5001, 5173)} | Format-Table LocalPort, State

# 4. Test backend connection
Write-Host "`n4. Backend Test:" -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest -Uri "http://localhost:5001" -UseBasicParsing -TimeoutSec 2
  Write-Host "  ✓ Backend responding (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
  Write-Host "  ✗ Backend not responding" -ForegroundColor Red
}

# 5. Test frontend connection
Write-Host "`n5. Frontend Test:" -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 2
  Write-Host "  ✓ Frontend responding (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
  Write-Host "  ✗ Frontend not responding" -ForegroundColor Red
}

# 6. Check firewall
Write-Host "`n6. Firewall Status:" -ForegroundColor Yellow
Get-NetFirewallProfile | Select-Object Name, Enabled

Write-Host "`n=== End of Status Check ===" -ForegroundColor Cyan
```

---

## Next Steps Based on Error

### If you see "ERR_HTTP2_PROTOCOL_ERROR":

1. **Clear browser cache** (most common fix)
2. **Disable HTTP/2 in browser** (temporary workaround)
3. **Force HTTP/1.1 in Vite config** (permanent fix)
4. **Use incognito mode** (quick test)

### If you see "ERR_CONNECTION_REFUSED":

1. **Start the servers** (they're not running)
2. **Check if ports are blocked**
3. **Check firewall rules**

### If you see "ERR_NETWORK_CHANGED":

1. **Restart network adapter**
2. **Reset network stack**
3. **Restart computer**

### If you see "CORS Error":

1. **Check backend CORS config** (already fixed)
2. **Verify proxy settings in Vite**
3. **Use same port for frontend/backend** (not recommended)

---

## Contact & Support

**If issue persists:**

1. **Save error logs:**
   ```powershell
   # Backend logs
   cd backend
   npm run dev > backend-log.txt 2>&1

   # Frontend logs
   cd frontend
   npm run dev > frontend-log.txt 2>&1
   ```

2. **Take screenshot of:**
   - Browser console (F12 → Console tab)
   - Browser network tab (F12 → Network tab)
   - PowerShell error messages

3. **System info:**
   ```powershell
   systeminfo | Select-String "OS Name", "OS Version"
   node --version
   npm --version
   ```

---

## Summary: Quick Commands

```powershell
# Stop everything
Get-Process node | Stop-Process -Force

# Clean install
cd C:\Users\HP\PledgeHub\backend
Remove-Item node_modules -Recurse -Force; npm install
cd ..\frontend
Remove-Item node_modules -Recurse -Force; npm install

# Start fresh
cd C:\Users\HP\PledgeHub
.\scripts\dev.ps1
```

**Access the app:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001

---

**Last Updated:** December 15, 2025  
**Status:** ✅ System operational, troubleshooting HTTP/2 error

