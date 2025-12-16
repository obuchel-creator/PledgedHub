#!/usr/bin/env pwsh
# dev-frontend.ps1 - start the frontend dev server (Vite)
# Safe to run from PowerShell / pwsh. Idempotent: only runs npm install if node_modules is missing.

Set-StrictMode -Version Latest

# Resolve script directory in a way that works in pwsh and Windows PowerShell
if ($PSScriptRoot) {
    $scriptDir = $PSScriptRoot
} else {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
}

# Repo root is one level up from the scripts folder (adjust if your layout differs)
try {
    $root = (Resolve-Path (Join-Path $scriptDir '..')).Path
} catch {
    Write-Error "Unable to resolve repository root from script location '$scriptDir'."
    exit 1
}

$frontend = Join-Path $root 'frontend'

Write-Host "Repository root: $root"
Write-Host "Frontend folder: $frontend"

if (-not (Test-Path $frontend -PathType Container)) {
    Write-Error "Frontend folder not found at '$frontend'. Please ensure the 'frontend' directory exists."
    exit 1
}

# Ensure npm is available
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm is not installed or not available on PATH. Install Node.js/npm and try again."
    exit 1
}

$nodeModules = Join-Path $frontend 'node_modules'
if (-not (Test-Path $nodeModules -PathType Container)) {
    Write-Host "node_modules not found in frontend. Running 'npm install'..."
    Push-Location $frontend
    try {
        & npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "'npm install' failed with exit code $LASTEXITCODE."
            exit $LASTEXITCODE
        }
        Write-Host "'npm install' completed successfully."
    } catch {
        Write-Error "An error occurred while running 'npm install': $_"
        exit 1
    } finally {
        Pop-Location
    }
} else {
    Write-Host "node_modules found. Skipping 'npm install'."
}

# Start the dev server
Write-Host "Starting frontend dev server (npm run dev) in '$frontend'..."
Push-Location $frontend
try {
    & npm run dev
    $exitCode = $LASTEXITCODE
} catch {
    Write-Error "Failed to start dev server: $_"
    $exitCode = 1
} finally {
    Pop-Location
}

if ($exitCode -ne 0) {
    Write-Error "Dev server exited with code $exitCode."
}
exit $exitCode