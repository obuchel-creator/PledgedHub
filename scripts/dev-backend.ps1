# dev-backend.ps1
# Helper to start the backend dev server from the repository.
# - Computes $root and $backend relative to this script.
# - Runs `npm install` if package.json exists and node_modules is missing.
# - Prefers `npm run dev`, falls back to `npm start`, then `node index.js`.
# - Prints status messages and returns non-zero on fatal errors.

# Determine script directory
$scriptPath = $MyInvocation.MyCommand.Path
if (-not $scriptPath) {
    Write-Host "Error: Cannot determine script path. Run this file directly (not dot-sourced)." -ForegroundColor Red
    exit 1
}
$scriptDir = Split-Path -Parent $scriptPath

# Compute root and backend paths (scripts/ assumed alongside this file)
try {
    $root = (Resolve-Path (Join-Path $scriptDir '..')).Path
} catch {
    Write-Host "Error: Failed to resolve repository root relative to script dir '$scriptDir'." -ForegroundColor Red
    exit 1
}

$backend = Join-Path $root 'backend'

# If backend folder doesn't exist but package.json exists at root, use root as backend
if (-not (Test-Path $backend)) {
    if (Test-Path (Join-Path $root 'package.json')) {
        Write-Host "Note: backend/ not found, using repository root as backend." -ForegroundColor Yellow
        $backend = $root
    } else {
        Write-Host "Error: Backend directory not found at '$backend' and no package.json at repo root." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Repository root: $root"
Write-Host "Backend path:    $backend"

Push-Location $backend
try {
    # Ensure npm is available if needed
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Host "Error: 'npm' not found in PATH. Please install Node.js and npm." -ForegroundColor Red
        exit 1
    }

    $pkgPath = Join-Path $backend 'package.json'
    $hasPkg = Test-Path $pkgPath
    $pkg = $null

    if ($hasPkg) {
        try {
            $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
        } catch {
            Write-Host "Warning: package.json exists but could not be parsed: $($_.Exception.Message)" -ForegroundColor Yellow
            $pkg = $null
        }
    }

    # Install dependencies if package.json exists and node_modules missing
    $nodeModulesPath = Join-Path $backend 'node_modules'
    if ($hasPkg -and -not (Test-Path $nodeModulesPath)) {
        Write-Host "node_modules not found. Running 'npm install'..." -ForegroundColor Cyan
        & npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "'npm install' failed with exit code $LASTEXITCODE." -ForegroundColor Red
            exit $LASTEXITCODE
        }
    }

    # Decide which command to run
    $startCmd = $null
    if ($pkg -and $pkg.scripts -and $pkg.scripts.dev) {
        $startCmd = { param($a) & npm run dev -- $a }
        Write-Host "Selected: npm run dev" -ForegroundColor Green
    } elseif ($pkg -and $pkg.scripts -and $pkg.scripts.start) {
        $startCmd = { param($a) & npm start -- $a }
        Write-Host "Selected: npm start" -ForegroundColor Green
    } elseif (Test-Path (Join-Path $backend 'index.js')) {
        if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
            Write-Host "Error: 'node' not found in PATH. Please install Node.js." -ForegroundColor Red
            exit 1
        }
        $startCmd = { param($a) & node index.js $a }
        Write-Host "Selected: node index.js" -ForegroundColor Green
    } else {
        Write-Host "No runnable start script or index.js found." -ForegroundColor Yellow
        if ($pkg -and $pkg.scripts) {
            Write-Host "Available scripts in package.json:" -ForegroundColor Cyan
            $pkg.scripts.PSObject.Properties | ForEach-Object { Write-Host " - $($_.Name)" }
        }
        Write-Host "Fatal: Nothing to run. Add a 'dev' or 'start' script to package.json, or add index.js." -ForegroundColor Red
        exit 1
    }

    # Invoke chosen command and forward any arguments passed to this script
    if ($startCmd) {
        & $startCmd $args
        $exitCode = $LASTEXITCODE
        if ($exitCode -ne 0) {
            Write-Host "Process exited with code $exitCode." -ForegroundColor Red
        }
        exit $exitCode
    }

} finally {
    Pop-Location
}