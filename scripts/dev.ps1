<#
PowerShell orchestrator to open frontend and backend dev servers in separate windows.

Usage:
- Place this file at scripts/dev.ps1 and run it from PowerShell:
    & 'c:\Users\HP\PledgeHub\scripts\dev.ps1'
- Customize paths or start commands by editing the variables below or by calling the script with parameters.

Behavior:
- Detects PowerShell Core (pwsh) and falls back to Windows PowerShell (powershell.exe).
- Opens two new terminal windows (one for frontend, one for backend) using Start-Process.
- If node_modules is missing in a project, runs `npm install` before starting the dev command.
- If a project folder is missing, prints an informative message and does not block the caller.
- Safe to run repeatedly: npm install runs only when node_modules is missing.

Notes:
- Default folders are "frontend" and "backend" located next to this script. Adjust $FrontendDir/$BackendDir as needed.
- Default start commands are "npm run dev". Change $FrontendStartCmd/$BackendStartCmd if your projects use different scripts.
#>

param(
    [string]$FrontendDir,
    [string]$BackendDir,
    [string]$FrontendStartCmd = 'npm run dev',
    [string]$BackendStartCmd  = 'npm run dev'
)

# Determine script root robustly
if ($PSScriptRoot) {
    $scriptRoot = Split-Path -Parent $PSScriptRoot
} else {
    $scriptRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Definition)
}

# Default project locations (relative to script root) if not provided
if (-not $FrontendDir) { $FrontendDir = Join-Path $scriptRoot 'frontend' }
if (-not $BackendDir)  { $BackendDir  = Join-Path $scriptRoot 'backend'  }

# Detect available PowerShell executable (prefer pwsh)
$pwshCmd = Get-Command pwsh -ErrorAction SilentlyContinue
if ($pwshCmd) {
    $shellExe = $pwshCmd.Source
} else {
    $powershellCmd = Get-Command powershell.exe -ErrorAction SilentlyContinue
    if ($powershellCmd) {
        $shellExe = $powershellCmd.Source
    }
}

if (-not $shellExe) {
    Write-Host "No PowerShell executable found (pwsh or powershell.exe). Aborting."
    return
}

function Start-DevWindow {
    param(
        [string]$ProjectPath,
        [string]$StartCmd,
        [string]$WindowTitle
    )

    if (-not (Test-Path -Path $ProjectPath -PathType Container)) {
        Write-Host "Folder not found: $ProjectPath. Skipping $WindowTitle (no new window will be opened)."
        return
    }

    # Escape single quotes in path for safe embedding in a single-quoted literal
    $escapedPath = $ProjectPath -replace "'", "''"
    $escapedCmd = $StartCmd -replace "'", "''"

    # Build a small command that:
    # - sets location,
    # - checks for node_modules and runs npm install if missing,
    # - runs the start command and keeps the window open (-NoExit).
    $commandBody = "Set-Location -LiteralPath '$escapedPath'; " +
                   "if (-not (Test-Path -LiteralPath (Join-Path -Path '$escapedPath' -ChildPath 'node_modules'))) { " +
                   "Write-Host 'node_modules not found - running npm install...'; npm install } " +
                   "else { Write-Host 'node_modules present - skipping install.' }; " +
                   "Write-Host '--- Starting: $escapedCmd ---'; " +
                   "Invoke-Expression '$escapedCmd'"

    # Pass arguments to Start-Process as an array to avoid quoting issues
    $argList = @('-NoProfile', '-NoExit', '-Command', $commandBody)

    try {
        Start-Process -FilePath $shellExe -ArgumentList $argList -WorkingDirectory $ProjectPath -WindowStyle Normal
        Write-Host "Launched $WindowTitle in a new window for ${ProjectPath}"
    } catch {
        Write-Host "Failed to start window for ${ProjectPath}: $_"
    }
}

# Non-blocking informational output
Write-Host "Using shell: $shellExe"
Write-Host "Frontend: $FrontendDir"
Write-Host "Backend : $BackendDir"
Write-Host "Frontend start command: $FrontendStartCmd"
Write-Host "Backend start command : $BackendStartCmd"
Write-Host "Opening dev windows... (this script will not block while they run)"

# Start frontend and backend windows (do not wait)
Start-DevWindow -ProjectPath $FrontendDir -StartCmd $FrontendStartCmd -WindowTitle 'Frontend Dev'
Start-DevWindow -ProjectPath $BackendDir  -StartCmd $BackendStartCmd  -WindowTitle 'Backend Dev'

# End of script — returns immediately while started processes continue in their own windows.