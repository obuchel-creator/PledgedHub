$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
$ports = @(5001)
foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        $procId = $c.OwningProcess
        if ($procId -gt 4) {
            Write-Host "Killing PID $procId on port $port"
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
}
Start-Sleep -Seconds 2
Write-Host "Starting backend..."
Set-Location "C:\Users\HP\PledgeHub"
npm run dev
