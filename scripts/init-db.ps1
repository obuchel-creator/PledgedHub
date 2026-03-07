<# 
.SYNOPSIS
Initialize a MySQL database from a SQL file.

.DESCRIPTION
Searches for common SQL init file paths, prompts for DB creds if not provided via env vars,
uses a temporary --defaults-extra-file to avoid exposing the password on the command line,
runs the SQL file via the mysql CLI and reports success/failure.
#>

# Ensure $PSScriptRoot is available
if (-not $PSScriptRoot) {
    $PSScriptRoot = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
}

#region Helpers
function Convert-SecureStringToPlain {
    param([System.Security.SecureString]$secure)
    if ($null -eq $secure) { return $null }
    $bstr = [System.IntPtr]::Zero
    try {
        $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        return [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    } finally {
        if ($bstr -ne [System.IntPtr]::Zero) {
            [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
        }
    }
}
function Prompt-IfNullOrEmpty {
    param(
        [string]$value,
        [string]$prompt,
        [bool]$secure = $false
    )
    if (-not [string]::IsNullOrEmpty($value)) { return $value }
    if ($secure) {
        $ss = Read-Host -Prompt $prompt -AsSecureString
        return Convert-SecureStringToPlain $ss
    } else {
        return Read-Host -Prompt $prompt
    }
}
#endregion

#region Find SQL file
$searchPaths = @(
    'backend/sql/init.sql',
    'backend/init.sql',
    'sql/init.sql',
    'init.sql'
)

$found = $null

# Determine repo root (parent of scripts folder) and current working dir
$repoRoot = if ($PSScriptRoot) { Split-Path -Path $PSScriptRoot -Parent } else { (Get-Location).ProviderPath }
$cwd = (Get-Location).ProviderPath

foreach ($p in $searchPaths) {
    $candidates = @()

    # path relative to the repository root
    if ($repoRoot) { $candidates += Join-Path $repoRoot $p }

    # path relative to current working directory
    $candidates += Join-Path $cwd $p

    # also allow the literal path (absolute or relative)
    $candidates += $p

    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            $found = (Resolve-Path $candidate).Path
            break
        }
    }

    if ($found) { break }
}

if (-not $found) {
    Write-Host "No initialization SQL file found in expected locations."
    Write-Host ""
    Write-Host "Searched paths:"
    foreach ($s in $searchPaths) { Write-Host "  - $s" }
    Write-Host ""
    Write-Host "Place your SQL init file in one of those locations or run the SQL manually:"
    Write-Host "  mysql -h <host> -u <user> -p <database> < /path/to/init.sql"
    Write-Host ""
    Write-Host "This script is exiting with code 0."
    exit 0
}

Write-Host "Found SQL init file: $found"
#endregion

#region Check mysql CLI
$mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlCmd) {
    Write-Host ""
    Write-Host "mysql CLI not found in PATH."
    Write-Host "Install the MySQL client or run the SQL manually using a tool of your choice."
    Write-Host ""
    Write-Host "Manual example:"
    Write-Host "  mysql -h <host> -u <user> -p <database> < `"$found`""
    exit 1
}
#endregion

#region Gather connection info (avoid reserved $Host and similar names)
$envHost = $env:DATABASE_HOST
$envName = $env:DATABASE_NAME
$envUser = $env:DATABASE_USER
$envPass = $env:DATABASE_PASS

# Use distinct variable names so we don't clash with PowerShell automatic variables
$dbHost = Prompt-IfNullOrEmpty -value $envHost -prompt "Database host (default: localhost)" -secure:$false
if ([string]::IsNullOrEmpty($dbHost)) { $dbHost = 'localhost' }

$dbName = Prompt-IfNullOrEmpty -value $envName -prompt "Database name" -secure:$false
if ([string]::IsNullOrEmpty($dbName)) {
    Write-Host "Database name is required. Aborting."
    exit 2
}

$dbUser = Prompt-IfNullOrEmpty -value $envUser -prompt "Database user (default: root)" -secure:$false
if ([string]::IsNullOrEmpty($dbUser)) { $dbUser = 'root' }

# For password prefer env var, otherwise secure prompt
if (-not [string]::IsNullOrEmpty($envPass)) {
    $dbPassword = $envPass
} else {
    $ss = Read-Host -Prompt "Database password (input hidden; leave blank for no password)" -AsSecureString
    $dbPassword = Convert-SecureStringToPlain $ss
}
#endregion

#region Create temporary defaults file and run mysql (use $dbHost/$dbName/$dbUser)
$tempFile = [IO.Path]::Combine([IO.Path]::GetTempPath(), ([IO.Path]::GetRandomFileName() + '.cnf'))
try {
    $lines = @("[client]")
    if ($dbUser)    { $lines += "user=$dbUser" }
    if ($dbPassword -ne $null -and $dbPassword -ne '') { $lines += "password=$dbPassword" }
    if ($dbHost)    { $lines += "host=$dbHost" }

    # Write with ASCII to avoid BOM issues
    Set-Content -Path $tempFile -Value $lines -Encoding ASCII

    Write-Host ""
    Write-Host "Running SQL file against database '$dbName' on host '$dbHost' as user '$dbUser'..."
    Write-Host "Please wait..."

    $escapedDefaults = $tempFile -replace '"','\"'
    $escapedSql = $found -replace '"','\"'
    $dbArg = if ($dbName) { '"' + ($dbName -replace '"','\"') + '"' } else { '""' }

    $cmd = "mysql --defaults-extra-file=""$escapedDefaults"" $dbArg < ""$escapedSql"""
    $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $cmd -NoNewWindow -Wait -PassThru

    if ($proc.ExitCode -eq 0) {
        Write-Host "Database initialization completed successfully."
        exit 0
    } else {
        Write-Host "mysql exited with code $($proc.ExitCode). Initialization may have failed."
        exit $proc.ExitCode
    }
} catch {
    Write-Host "An error occurred: $($_.Exception.Message)"
    exit 3
} finally {
    try { Remove-Item -Path $tempFile -ErrorAction SilentlyContinue } catch {}
    if ($dbPassword) { $dbPassword = $null }
}
#endregion

