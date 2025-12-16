#!/usr/bin/env pwsh
<#
run-tests.ps1

PowerShell helper to run frontend/backend tests when a "test" script exists in package.json.

Usage:
    - Place this script in the repository root and run:
            ./scripts/run-tests.ps1
    - It will look for "frontend" and "backend" subfolders (if present).
    - For each folder, if package.json exists and defines a "test" script, it runs `npm test`.
    - The script prints which tests were executed, is tolerant of missing package.json or missing test scripts,
        and returns a non-zero exit code if any test run fails.

Notes:
    - Output from `npm test` is streamed to the console.
    - If `npm` is not available on PATH, the script will fail early with an explanatory message.
#>

# Folders to inspect (modify here if your repo uses different names)
$folders = @('frontend', 'backend')

# Ensure npm is available
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: 'npm' not found on PATH. Install Node/npm or ensure npm is on PATH." -ForegroundColor Red
        exit 127
}

$startDir = Get-Location
$failures = @()

foreach ($folder in $folders) {
        $folderPath = Join-Path $startDir $folder

        if (-not (Test-Path $folderPath -PathType Container)) {
                Write-Host "Skipping '$folder': folder not found."
                continue
        }

        $pkgJsonPath = Join-Path $folderPath 'package.json'
        if (-not (Test-Path $pkgJsonPath -PathType Leaf)) {
                Write-Host "Skipping '$folder': package.json not found."
                continue
        }

        # Read and parse package.json safely
        try {
                $pkg = Get-Content -Raw -Path $pkgJsonPath | ConvertFrom-Json
        } catch {
                Write-Host "Skipping '$folder': package.json could not be parsed (`$pkgJsonPath`)." -ForegroundColor Yellow
                continue
        }

        if (-not $pkg.PSObject.Properties.Name -contains 'scripts' -and -not $pkg.scripts) {
                Write-Host "Skipping '$folder': no 'scripts' section in package.json."
                continue
        }

        if (-not $pkg.scripts.test) {
                Write-Host "Skipping '$folder': no 'test' script defined in package.json."
                continue
        }

        Write-Host "=== Running 'npm test' in '$folder' ==="
        Push-Location $folderPath
        try {
                # Run npm test and let output stream to the console
                & npm test
                $exitCode = $LASTEXITCODE
        } catch {
                Write-Host "ERROR: Exception while running tests in '$folder': $_" -ForegroundColor Red
                $exitCode = 1
        } finally {
                Pop-Location
        }

        if ($exitCode -ne 0) {
                Write-Host "'npm test' in '$folder' failed with exit code $exitCode" -ForegroundColor Red
                $failures += [PSCustomObject]@{ Folder = $folder; ExitCode = $exitCode }
        } else {
                Write-Host "'npm test' in '$folder' completed successfully."
        }
}

if ($failures.Count -gt 0) {
        Write-Host ''
        Write-Host "Summary: Some tests failed:" -ForegroundColor Red
        foreach ($f in $failures) {
                Write-Host (" - {0}: exit code {1}" -f $f.Folder, $f.ExitCode)
        }
        # Return non-zero to indicate failure to CI or caller
        exit 1
}

Write-Host ''
Write-Host "Summary: All detected tests completed successfully."
exit 0