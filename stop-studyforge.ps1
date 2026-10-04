$ErrorActionPreference = "Stop"
$ports = @(3000, 8000)
$stopped = @()

foreach ($port in $ports) {
    $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($listener in $listeners) {
        $processId = $listener.OwningProcess
        if ($processId -and $processId -notin $stopped) {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            $stopped += $processId
            Write-Host "Stopped service on port $port." -ForegroundColor Green
        }
    }
}

if (-not $stopped.Count) {
    Write-Host "StudyForge was not running."
} else {
    Write-Host "StudyForge has stopped." -ForegroundColor Cyan
}
