$body = @{
    email = "testuser@example.com"
    password = "testpass123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Method Post -Uri "http://localhost:5001/api/auth/login" -Headers @{ "Content-Type" = "application/json" } -Body $body
    Write-Host "SUCCESS:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.Value__)"
    Write-Host "Message: $($_.ErrorDetails.Message)"
}
