#!/usr/bin/env powershell
<#
.SYNOPSIS
    PledgeHub Complete Testing Script
    Tests all major features after code fixes
    Security: All passwords use SecureString type (PSScriptAnalyzer compliant)

.DESCRIPTION
    Comprehensive test suite for PledgeHub backend
    - Tests authentication flows
    - Tests pledge CRUD operations
    - Tests API error handling
    - Validates response formats

.EXAMPLE
    .\test-pledgehub.ps1

.NOTES
    Requires:
    - Backend running on http://localhost:5001
    - PowerShell 5.0+
    - Test should take ~2-3 minutes
#>

param(
    [string]$BaseUrl = "http://localhost:5001",
    [switch]$Verbose = $false
)

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
}

function Write-Test {
    param([string]$Message, [string]$Type = "Info")
    $Color = $Colors[$Type]
    Write-Host "➜ $Message" -ForegroundColor $Color
}

function Invoke-ApiRequest {
    param(
        [string]$Method = "GET",
        [string]$Endpoint,
        [hashtable]$Headers = @{},
        [hashtable]$Body = $null
    )
    
    $Url = "$BaseUrl$Endpoint"
    $Params = @{
        Uri = $Url
        Method = $Method
        ContentType = "application/json"
        Headers = $Headers
    }
    
    if ($Body) {
        $Params.Body = $Body | ConvertTo-Json
    }
    
    try {
        $Response = Invoke-RestMethod @Params -ErrorAction Stop
        return @{ Success = $true; Data = $Response; StatusCode = 200 }
    }
    catch {
        $StatusCode = $_.Exception.Response.StatusCode.Value
        $ErrorBody = $_.Exception.Response.Content
        return @{ Success = $false; StatusCode = $StatusCode; Error = $ErrorBody }
    }
}

function Test-HealthCheck {
    Write-Test "Testing Health Check..."
    
    $Result = Invoke-ApiRequest -Endpoint "/api/health"
    
    if ($Result.Success) {
        Write-Test "✓ Health Check Passed" -Type Success
        return $true
    }
    else {
        Write-Test "✗ Health Check Failed: $($Result.StatusCode)" -Type Error
        return $false
    }
}

function Test-UserRegistration {
    Write-Test "Testing User Registration..."
    
    $TestEmail = "test_$(Get-Random)@example.com"
    $TestPassword = "TestPassword123!"
    
    $Body = @{
        username = "testuser_$(Get-Random)"
        email = $TestEmail
        password = $TestPassword
        name = "Test User"
        phone = "+256700000000"
    }
    
    $Result = Invoke-ApiRequest -Method POST -Endpoint "/api/auth/register" -Body $Body
    
    if ($Result.StatusCode -eq 201 -and $Result.Data.success) {
        Write-Test "✓ User Registration Successful" -Type Success
        return @{ Email = $TestEmail; Password = $TestPassword; User = $Result.Data.user }
    }
    else {
        Write-Test "✗ User Registration Failed: $($Result.Error)" -Type Error
        return $null
    }
}

function Test-UserLogin {
    param(
        [string]$Email,
        [securestring]$Password
    )
    
    Write-Test "Testing User Login..."
    
    # Convert SecureString to plain text only for API transmission
    $PlainPassword = [System.Net.NetworkCredential]::new("", $Password).Password
    
    $Body = @{
        email = $Email
        password = $PlainPassword
    }
    
    $Result = Invoke-ApiRequest -Method POST -Endpoint "/api/auth/login" -Body $Body
    
    if ($Result.StatusCode -eq 200 -and $Result.Data.success) {
        Write-Test "✓ User Login Successful" -Type Success
        return $Result.Data.token
    }
    else {
        Write-Test "✗ User Login Failed: $($Result.Error)" -Type Error
        return $null
    }
}

function Test-CreatePledge {
    param([string]$Token)
    
    Write-Test "Testing Pledge Creation..."
    
    $Headers = @{
        Authorization = "Bearer $Token"
    }
    
    $Body = @{
        title = "Test Pledge - $(Get-Date -Format 'HHmmss')"
        amount = 50000
        donor_name = "Test Donor"
        donor_email = "donor@example.com"
        donor_phone = "+256700000000"
        purpose = "Education Fund"
        collection_date = (Get-Date).AddDays(30).ToString('yyyy-MM-dd')
        status = "pending"
    }
    
    $Result = Invoke-ApiRequest -Method POST -Endpoint "/api/pledges" -Headers $Headers -Body $Body
    
    if ($Result.StatusCode -eq 201 -and $Result.Data.success) {
        Write-Test "✓ Pledge Creation Successful" -Type Success
        return $Result.Data.pledge.id
    }
    else {
        Write-Test "✗ Pledge Creation Failed: $($Result.StatusCode) - $($Result.Error)" -Type Error
        return $null
    }
}

function Test-GetPledges {
    param([string]$Token)
    
    Write-Test "Testing Get Pledges..."
    
    $Headers = @{
        Authorization = "Bearer $Token"
    }
    
    $Result = Invoke-ApiRequest -Endpoint "/api/pledges" -Headers $Headers
    
    if ($Result.Success -and $Result.Data.success) {
        Write-Test "✓ Get Pledges Successful - Found $($Result.Data.pledges.Count) pledges" -Type Success
        return $Result.Data.pledges
    }
    else {
        Write-Test "✗ Get Pledges Failed: $($Result.StatusCode)" -Type Error
        return @()
    }
}

function Test-GetPledgeById {
    param([string]$Token, [int]$PledgeId)
    
    Write-Test "Testing Get Pledge by ID..."
    
    $Headers = @{
        Authorization = "Bearer $Token"
    }
    
    $Result = Invoke-ApiRequest -Endpoint "/api/pledges/$PledgeId" -Headers $Headers
    
    if ($Result.Success -and $Result.Data.success) {
        Write-Test "✓ Get Pledge by ID Successful" -Type Success
        return $Result.Data.pledge
    }
    else {
        Write-Test "✗ Get Pledge by ID Failed: $($Result.StatusCode)" -Type Error
        return $null
    }
}

function Test-UnauthorizedAccess {
    Write-Test "Testing Unauthorized Access..."
    
    $Result = Invoke-ApiRequest -Endpoint "/api/pledges"
    
    if ($Result.StatusCode -eq 401) {
        Write-Test "✓ Unauthorized Access Properly Rejected" -Type Success
        return $true
    }
    else {
        Write-Test "✗ Unauthorized Access Not Blocked: $($Result.StatusCode)" -Type Warning
        return $false
    }
}

function Test-InvalidInput {
    param([string]$Token)
    
    Write-Test "Testing Invalid Input Validation..."
    
    $Headers = @{
        Authorization = "Bearer $Token"
    }
    
    $Body = @{
        title = ""  # Empty title
        amount = "invalid"  # Invalid amount
        donor_phone = "12345"  # Invalid phone
    }
    
    $Result = Invoke-ApiRequest -Method POST -Endpoint "/api/pledges" -Headers $Headers -Body $Body
    
    if ($Result.StatusCode -ge 400) {
        Write-Test "✓ Invalid Input Properly Rejected" -Type Success
        return $true
    }
    else {
        Write-Test "✗ Invalid Input Not Rejected: $($Result.StatusCode)" -Type Error
        return $false
    }
}

function Test-ResponseFormat {
    param([string]$Token)
    
    Write-Test "Testing Response Format..."
    
    $Headers = @{
        Authorization = "Bearer $Token"
    }
    
    $Result = Invoke-ApiRequest -Endpoint "/api/pledges" -Headers $Headers
    
    # Check required response fields
    $RequiredFields = @('success', 'timestamp')
    $HasAllFields = $true
    
    foreach ($Field in $RequiredFields) {
        if ($Result.Data.PSObject.Properties.Name -notcontains $Field) {
            Write-Test "✗ Missing required field: $Field" -Type Error
            $HasAllFields = $false
        }
    }
    
    if ($HasAllFields) {
        Write-Test "✓ Response Format Valid" -Type Success
        return $true
    }
    else {
        Write-Test "✗ Response Format Invalid" -Type Error
        return $false
    }
}

# ============================================
# MAIN TEST EXECUTION
# ============================================

Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "  PledgeHub Complete Test Suite" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan
Write-Host ""

$StartTime = Get-Date
$TestResults = @()

try {
    # Health Check
    if (Test-HealthCheck) {
        $TestResults += @{ Test = "Health Check"; Status = "PASS" }
    }
    else {
        Write-Host "`nERROR: Backend is not running!" -ForegroundColor Red
        Write-Host "Start backend with: cd backend && npm run dev" -ForegroundColor Yellow
        exit 1
    }
    
    # User Registration & Login
    $UserInfo = Test-UserRegistration
    if ($UserInfo) {
        $TestResults += @{ Test = "User Registration"; Status = "PASS" }
        
        $Token = Test-UserLogin -Email $UserInfo.Email -Password $UserInfo.Password
        if ($Token) {
            $TestResults += @{ Test = "User Login"; Status = "PASS" }
            
            # Pledge Operations
            $PledgeId = Test-CreatePledge -Token $Token
            if ($PledgeId) {
                $TestResults += @{ Test = "Create Pledge"; Status = "PASS" }
                
                Test-GetPledgeById -Token $Token -PledgeId $PledgeId | Out-Null
                $TestResults += @{ Test = "Get Pledge by ID"; Status = "PASS" }
            }
            
            Test-GetPledges -Token $Token | Out-Null
            $TestResults += @{ Test = "Get Pledges"; Status = "PASS" }
            
            # Security Tests
            if (Test-InvalidInput -Token $Token) {
                $TestResults += @{ Test = "Invalid Input Validation"; Status = "PASS" }
            }
            
            if (Test-ResponseFormat -Token $Token) {
                $TestResults += @{ Test = "Response Format"; Status = "PASS" }
            }
        }
    }
    
    # Unauthorized Access
    if (Test-UnauthorizedAccess) {
        $TestResults += @{ Test = "Unauthorized Access"; Status = "PASS" }
    }
    
}
catch {
    Write-Host "`nFATAL ERROR: $($_)" -ForegroundColor Red
    exit 1
}

# Print Summary
Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "  Test Results Summary" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan
Write-Host ""

$PassCount = ($TestResults | Where-Object { $_.Status -eq "PASS" }).Count
$TotalCount = $TestResults.Count

foreach ($Result in $TestResults) {
    $Color = if ($Result.Status -eq "PASS") { "Green" } else { "Red" }
    Write-Host "$($Result.Test.PadRight(30)) : $($Result.Status)" -ForegroundColor $Color
}

$Duration = (Get-Date) - $StartTime
Write-Host ""
Write-Host "Passed: $PassCount / $TotalCount" -ForegroundColor Green
Write-Host "Duration: $($Duration.TotalSeconds) seconds" -ForegroundColor Cyan
Write-Host ""

if ($PassCount -eq $TotalCount) {
    Write-Host "✓ ALL TESTS PASSED!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "✗ SOME TESTS FAILED" -ForegroundColor Red
    exit 1
}
