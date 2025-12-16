<#
.SYNOPSIS
Build the frontend for production.

.DESCRIPTION
- Locates a frontend directory relative to this script (looks for "frontend" folder or package.json up to a few parent levels).
- Ensures node_modules are present (runs `npm install` when missing or when -ForceInstall is supplied).
- Runs `npm run build` and exits non-zero on failure.
- Reports the output location after build (defaults to ./dist; checks common alternatives).

.USAGE
.\build-frontend.ps1           # auto-detect frontend dir
.\build-frontend.ps1 -ForceInstall    # force npm install
.\build-frontend.ps1 -FrontendDir .\frontend

#>

param(
    [string]$FrontendDir = '',
    [switch]$ForceInstall
)

function Write-ErrAndExit {
    param([string]$Message, [int]$Code = 1)
    Write-Host ("ERROR: {0}" -f $Message) -ForegroundColor Red
    exit $Code
}

# Determine script directory (works in Windows PowerShell and PowerShell Core)
$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Definition }

function Resolve-FrontendDirectory {
    param([string]$Requested)

    if ($Requested) {
        $full = Resolve-Path -LiteralPath $Requested -ErrorAction SilentlyContinue
        if ($full) { return $full.Path }
        $candidate = Join-Path $ScriptDir $Requested
        $full2 = Resolve-Path -LiteralPath $candidate -ErrorAction SilentlyContinue
        if ($full2) { return $full2.Path }
        return $null
    }

    # Common candidates
    $candidates = @(
        Join-Path $ScriptDir 'frontend',
        Join-Path (Split-Path $ScriptDir -Parent) 'frontend',
        $ScriptDir,
        (Split-Path $ScriptDir -Parent)
    )

    foreach ($c in $candidates) {
        if (-not $c) { continue }
        if (Test-Path (Join-Path $c 'package.json')) { return (Resolve-Path $c).Path }
        if (Test-Path $c -PathType Container -and (Test-Path (Join-Path $c 'package.json'))) { return (Resolve-Path $c).Path }
        if (Test-Path (Join-Path $c 'frontend')) { return (Resolve-Path (Join-Path $c 'frontend')).Path }
    }

    # Last resort: check up to 3 parent levels for package.json
    $cur = $ScriptDir
    for ($i = 0; $i -lt 4; $i++) {
        if (-not $cur) { break }
        if (Test-Path (Join-Path $cur 'package.json')) { return (Resolve-Path $cur).Path }
        $maybeFrontend = Join-Path $cur 'frontend'
        if (Test-Path $maybeFrontend) { return (Resolve-Path $maybeFrontend).Path }
        $cur = Split-Path $cur -Parent
    }

    return $null
}

$ResolvedFrontend = Resolve-FrontendDirectory -Requested $FrontendDir
if (-not $ResolvedFrontend) {
    Write-ErrAndExit "Unable to locate frontend directory. Provide -FrontendDir or place a package.json in a 'frontend' folder or nearby."
}

Write-Host ("Frontend directory: {0}" -f $ResolvedFrontend)

# Verify npm is available
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCmd) {
    Write-ErrAndExit "npm not found in PATH. Install Node.js / npm and retry."
}

# Ensure node_modules
$nodeModulesPath = Join-Path $ResolvedFrontend 'node_modules'
$packageJsonPath = Join-Path $ResolvedFrontend 'package.json'
$needInstall = $false

if ($ForceInstall) {
    $needInstall = $true
    Write-Host "Force install requested."
}
elseif (-not (Test-Path $nodeModulesPath)) {
    $needInstall = $true
    Write-Host "node_modules not found; will run npm install."
}
else {
    # If package.json is newer than node_modules folder, recommend reinstall
    try {
        $pkgTime = (Get-Item $packageJsonPath -ErrorAction Stop).LastWriteTime
        $nmTime = (Get-Item $nodeModulesPath -ErrorAction Stop).LastWriteTime
        if ($pkgTime -gt $nmTime) {
            $needInstall = $true
            Write-Host "package.json is newer than node_modules; will run npm install."
        }
        else {
            Write-Host "node_modules present and up-to-date; skipping npm install."
        }
    } catch {
        # On any error, be conservative and install
        $needInstall = $true
        Write-Host "Could not verify node_modules timestamps; will run npm install."
    }
}

if ($needInstall) {
    Write-Host "Running npm install in $ResolvedFrontend ..."
    Push-Location $ResolvedFrontend
    try {
        & npm install
        $code = $LASTEXITCODE
        if ($code -ne 0) {
            Write-ErrAndExit "npm install failed with exit code $code." $code
        }
        Write-Host "npm install completed successfully."
    } catch {
        Write-ErrAndExit "npm install threw an exception: $_"
    } finally {
        Pop-Location
    }
}

# Run build
Write-Host "Running npm run build in $ResolvedFrontend ..."
Push-Location $ResolvedFrontend
try {
    & npm run build
    $buildCode = $LASTEXITCODE
    if ($buildCode -ne 0) {
        Write-ErrAndExit "npm run build failed with exit code $buildCode." $buildCode
    }
    Write-Host "Build completed successfully."
} catch {
    Write-ErrAndExit "npm run build threw an exception: $_"
} finally {
    Pop-Location
}

# Locate build output
$commonOutputs = @('dist','build','out','public','www')
$foundOutputs = @()
foreach ($name in $commonOutputs) {
    $candidate = Join-Path $ResolvedFrontend $name
    if (Test-Path $candidate) { $foundOutputs += (Resolve-Path $candidate).Path }
}

if ($foundOutputs.Count -gt 0) {
    Write-Host "Build output found at:"
    foreach ($p in $foundOutputs) { Write-Host "  $p" }
    exit 0
}

# If nothing matched, attempt to read potential output path from package.json (simple heuristic)
try {
    $pkg = Get-Content $packageJsonPath -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
    $hintPaths = @()
    if ($pkg -and $pkg.scripts -and $pkg.scripts.build) {
        $buildScript = $pkg.scripts.build
        # look for common tokens like "dist" or "build" in the build script
        foreach ($token in @('dist','build','out','public','www')) {
            if ($buildScript -and $buildScript -match $token) {
                $maybe = Join-Path $ResolvedFrontend $token
                if (Test-Path $maybe) { $hintPaths += (Resolve-Path $maybe).Path }
            }
        }
    }
    if ($hintPaths.Count -gt 0) {
        Write-Host "Heuristic build output found at:"
        foreach ($p in $hintPaths) { Write-Host "  $p" }
        exit 0
    }
} catch {
    # ignore JSON parse errors
}

# Final fallback
$defaultDist = Join-Path $ResolvedFrontend 'dist'
Write-Host "Build completed, but no standard output directory found."
Write-Host "Default expected location: $defaultDist"
Write-Host "If your build outputs to a different folder, inspect package.json or adjust this script."
exit 0