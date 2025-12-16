Param(
    [string]$TargetHost = 'localhost',
    [int]$Port = 5001,
    [string]$UserEmail = 'test@example.com',
    [switch]$SkipEmail
)

function ConvertToJsonBody($obj) {
    return ($obj | ConvertTo-Json -Depth 5 -Compress)
}

 $base = "http://$($TargetHost):$Port"
Write-Host "Running api_test against" $base

# Track failures for exit code and summary
$failures = 0
$results = @()

try {
    $timestamp = [string](Get-Date).Ticks
    $uniqueEmail = "test.user.$timestamp@example.com"
    # Always 8 digits after +2567 for phone
    $uniquePhone = "+2567$($timestamp.PadLeft(8,'1').Substring(0,8))"
    $body = @{ email = $uniqueEmail; phone = $uniquePhone; password = 'Password123!'; name = 'Test User' }
    Write-Host "REGISTER PAYLOAD:" ($body | ConvertTo-Json -Compress)
    $r = $null
    try {
        $r = Invoke-RestMethod -Uri "$base/api/auth/register" -Method POST -ContentType "application/json" -Body (ConvertToJsonBody $body) -ErrorAction Stop
        Write-Host "REGISTER:"; $r | ConvertTo-Json -Depth 5
        $results += @{ step = 'register'; ok = $true; info = $r }
    } catch {
        Write-Host "REGISTER ERROR:" $_.Exception.Message
        if ($null -ne $_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "REGISTER ERROR BODY:" $responseBody
        }
        $results += @{ step = 'register'; ok = $false; info = $_.Exception.Message }
        $failures += 1
        Write-Host "Aborting: Registration failed."
        exit 1
    }

    # Promote user to admin using Node.js script
    $userId = $r.user.id
    if ($userId) {
        Write-Host "Promoting user $userId to admin via Node.js..."
        node backend/scripts/promote-user.js $userId admin
        Write-Host "User promoted to admin."
    }
} catch {
    Write-Host "REGISTER ERROR:" $_.Exception.Message
    $results += @{ step = 'register'; ok = $false; info = $_.Exception.Message }
    $failures += 1
}

try {
    $body = @{ identifier = $uniqueEmail; email = $uniqueEmail; password = 'Password123!' }
    $r2 = $null
    try {
        $r2 = Invoke-RestMethod -Uri "$base/api/auth/login" -Method POST -ContentType "application/json" -Body (ConvertToJsonBody $body) -ErrorAction Stop
        Write-Host "LOGIN:"; $r2 | ConvertTo-Json -Depth 5
        $results += @{ step = 'login'; ok = $true; info = $r2 }
        $authToken = $r2.token
        $authHeaders = @{ Authorization = "Bearer $authToken" }
    } catch {
        Write-Host "LOGIN ERROR:" $_.Exception.Message
        $results += @{ step = 'login'; ok = $false; info = $_.Exception.Message }
        $failures += 1
        Write-Host "Aborting: Login failed."
        exit 1
    }
} catch {
    Write-Host "LOGIN ERROR:" $_.Exception.Message
    $results += @{ step = 'login'; ok = $false; info = $_.Exception.Message }
    $failures += 1
}

try {
    # create pledge with all required fields (controller requires amount > 0 and expects donor_name, etc.)
    $pledgeBody = @{
        title = 'Test Pledge'
        name = 'Test Pledge'
        goal = 500
        amount = 100
        donor_name = 'Test User'
        donor_email = $uniqueEmail
        donor_phone = $uniquePhone
        purpose = 'Test automation'
        collection_date = (Get-Date).AddDays(7).ToString('yyyy-MM-dd')
        status = 'pending'
        message = 'Automated test pledge'
    }
    $r3 = Invoke-RestMethod -Uri "$base/pledges" -Method POST -ContentType "application/json" -Headers $authHeaders -Body (ConvertToJsonBody $pledgeBody) -ErrorAction Stop
    Write-Host "PLEDGE CREATED:"; $r3 | ConvertTo-Json -Depth 5
    $results += @{ step = 'create_pledge'; ok = $true; info = $r3 }
} catch {
    Write-Host "PLEDGE CREATE ERROR:" $_.Exception.Message
    $results += @{ step = 'create_pledge'; ok = $false; info = $_.Exception.Message }
    $failures += 1
}

try {
    $r4 = Invoke-RestMethod -Uri "$base/pledges" -Method GET -Headers $authHeaders -ErrorAction Stop
    Write-Host "ALL PLEDGES:"; $r4 | ConvertTo-Json -Depth 5
    $results += @{ step = 'list_pledges'; ok = $true; info = $r4 }
} catch {
    Write-Host "PLEDGE LIST ERROR:" $_.Exception.Message
    $results += @{ step = 'list_pledges'; ok = $false; info = $_.Exception.Message }
    $failures += 1
}

# Attempt to determine pledge id from last created pledge
$pledgeId = $null
if ($r3) {
    if ($r3.id) { $pledgeId = $r3.id }
    elseif ($r3.pledge -and $r3.pledge.id) { $pledgeId = $r3.pledge.id }
    elseif ($r3.pledgeId) { $pledgeId = $r3.pledgeId }
    elseif ($r3._id) { $pledgeId = $r3._id }
}

if (-not $pledgeId -and $r4) {
    # take first pledge id
    try {
        $first = $r4[0]
        if ($first) { $pledgeId = $first.id -or $first._id -or $first.pledgeId }
    } catch {}
}

if ($pledgeId) {
    try {
            $payBody = @{ userId = 1; pledgeId = $pledgeId; amount = 50; paymentMethod = 'manual' }
            $headers = @{}
            if ($SkipEmail) { $headers['X-Skip-Email'] = 'true' }
        $p = Invoke-RestMethod -Uri "$base/payments" -Method POST -ContentType "application/json" -Body (ConvertToJsonBody $payBody) -Headers $headers -ErrorAction Stop
        Write-Host "PAYMENT CREATED:"; $p | ConvertTo-Json -Depth 5
        $results += @{ step = 'create_payment'; ok = $true; info = $p }
    } catch {
        Write-Host "PAYMENT ERROR:" $_.Exception.Message
        $results += @{ step = 'create_payment'; ok = $false; info = $_.Exception.Message }
        $failures += 1
    }
} else {
    Write-Host "No pledge id available; skipping payment test."
    $results += @{ step = 'create_payment'; ok = $false; info = 'no_pledge_id' }
    $failures += 1
}

# Summary and exit code
Write-Host "`n===== api_test summary ====="
$results | ForEach-Object {
    if ($_.ok) { $status = 'OK' } else { $status = 'FAIL' }
    Write-Host ("{0,-16} : {1}" -f $_.step, $status)
}
if ($failures -gt 0) {
    Write-Host "`nFailures: $failures" -ForegroundColor Red
    Write-Host "Exiting with code 1"
    exit 1
} else {
    Write-Host "`nAll checks passed" -ForegroundColor Green
    Write-Host "Exiting with code 0"
    exit 0
}
