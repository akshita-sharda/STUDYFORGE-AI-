param([switch]$NoBrowser)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendRoot = Join-Path $projectRoot "backend"
$frontendRoot = Join-Path $projectRoot "frontend"
$venvPythonPath = Join-Path $backendRoot ".venv\Scripts\python.exe"
$runRoot = Join-Path $projectRoot ".studyforge-run"

$systemPythonPath = (Get-Command py.exe -ErrorAction Stop).Source
$pythonPath = $null

foreach ($candidate in @($venvPythonPath, $systemPythonPath)) {
    if (-not (Test-Path -LiteralPath $candidate)) {
        continue
    }
    $candidateReady = $false
    try {
        & $candidate -c "import fastapi, uvicorn, fitz, sklearn" 2>$null
        $candidateReady = $LASTEXITCODE -eq 0
    } catch {
        # A stale virtual environment can point at a removed Python install.
        # Ignore it and try the system Python below.
        $candidateReady = $false
    }
    if ($candidateReady) {
        $pythonPath = $candidate
        break
    }
}

if (-not $pythonPath) {
    $pythonPath = $systemPythonPath
    Write-Host "  Installing backend requirements..." -ForegroundColor Yellow
    & $pythonPath -m pip install -r (Join-Path $backendRoot "requirements.txt")
    if ($LASTEXITCODE -ne 0) {
        throw "Could not install the backend requirements. Run the command again after checking your internet connection."
    }
}

if ($pythonPath -eq $systemPythonPath -and $venvPythonPath -ne $systemPythonPath) {
    Write-Host "  Using the system Python because the project environment is unavailable or incomplete." -ForegroundColor Yellow
}

$npmCommand = Get-Command npm.cmd -ErrorAction Stop
New-Item -ItemType Directory -Path $runRoot -Force | Out-Null

function Get-PortProcess([int]$Port) {
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty OwningProcess
}

function Wait-ForUrl([string]$Name, [string]$Url, [int]$Seconds = 45) {
    $deadline = (Get-Date).AddSeconds($Seconds)
    do {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 3
            if ($response.StatusCode -eq 200) {
                Write-Host "  Ready: $Name" -ForegroundColor Green
                return
            }
        } catch {
            Start-Sleep -Milliseconds 700
        }
    } while ((Get-Date) -lt $deadline)
    throw "$Name did not become ready. Check the logs in $runRoot"
}

Write-Host "Starting StudyForge..." -ForegroundColor Magenta
$started = @{}

if (Get-PortProcess 8000) {
    Write-Host "  Backend is already running on port 8000."
} else {
    $backend = Start-Process -FilePath $pythonPath -ArgumentList @("-m","uvicorn","app.main:app","--reload","--port","8000") -WorkingDirectory $backendRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runRoot "backend.log") -RedirectStandardError (Join-Path $runRoot "backend-error.log")
    $started.backend = $backend.Id
}

if (Get-PortProcess 3000) {
    Write-Host "  Frontend is already running on port 3000."
} else {
    $frontend = Start-Process -FilePath $npmCommand.Source -ArgumentList @("run","dev","--","--port","3000") -WorkingDirectory $frontendRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runRoot "frontend.log") -RedirectStandardError (Join-Path $runRoot "frontend-error.log")
    $started.frontend = $frontend.Id
}

$started | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runRoot "processes.json") -Encoding UTF8
Wait-ForUrl "backend" "http://127.0.0.1:8000/health"
Wait-ForUrl "frontend" "http://127.0.0.1:3000"

Write-Host ""
Write-Host "StudyForge is running at http://127.0.0.1:3000" -ForegroundColor Cyan
Write-Host "Use STOP-STUDYFORGE.cmd when you are finished."

if (-not $NoBrowser) {
    Start-Process "http://127.0.0.1:3000"
}
