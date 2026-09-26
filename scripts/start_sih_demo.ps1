# SIH 2026 Demo Start Script for Windows
# Run as: .\scripts\start_sih_demo.ps1
# ============================================================
# Starts the backend (FastAPI) and frontend (Vite) servers
# in two separate windows and opens the browser.
# ============================================================

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  CyberOpt-RQ · SIH 2026 DEMO START" -ForegroundColor Cyan
Write-Host "  Offline Presentation Mode" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# ── Locate Python ──────────────────────────────────────────────────────────
$PythonCandidates = @("python", "python3", "C:\Python314\python.exe", "C:\Python313\python.exe", "C:\Python312\python.exe")
$PYTHON_EXE = $null
foreach ($candidate in $PythonCandidates) {
    try {
        $ver = & $candidate --version 2>&1
        if ($ver -match "Python 3") { $PYTHON_EXE = $candidate; break }
    } catch {}
}
if (-not $PYTHON_EXE) {
    Write-Host "  [ERROR] Python 3 not found. Run .\scripts\setup_sih_demo.ps1 first." -ForegroundColor Red
    exit 1
}

# ── Run setup check ─────────────────────────────────────────────────────────
if (-not (Test-Path "$ROOT\backend\.env")) {
    Write-Host "  [WARN] backend\.env not found. Running setup first..." -ForegroundColor Yellow
    & "$PSScriptRoot\setup_sih_demo.ps1"
}

# ── Start Backend ──────────────────────────────────────────────────────────
Write-Host "  [1/2] Starting FastAPI backend on http://localhost:8000 ..." -ForegroundColor Yellow
$backendCmd = "cd `"$ROOT\backend`" && `"$PYTHON_EXE`" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
Start-Process cmd -ArgumentList "/k `"title Backend (CyberOptRQ) && color 0A && $backendCmd`"" -WindowStyle Normal

# ── Wait for backend to be ready ───────────────────────────────────────────
Write-Host "  Waiting for backend to start..." -ForegroundColor Gray
$maxWait = 30
$started = $false
for ($i = 0; $i -lt $maxWait; $i++) {
    Start-Sleep -Seconds 1
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($resp.StatusCode -eq 200) { $started = $true; break }
    } catch {}
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/overview" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($resp.StatusCode -lt 500) { $started = $true; break }
    } catch {}
    Write-Host "  ...waiting ($($i+1)s)" -ForegroundColor Gray
}
if ($started) {
    Write-Host "  [OK] Backend is ready." -ForegroundColor Green
} else {
    Write-Host "  [WARN] Backend may still be starting. Continuing..." -ForegroundColor Yellow
}

# ── Start Frontend ─────────────────────────────────────────────────────────
Write-Host "  [2/2] Starting Vite frontend on http://localhost:5173 ..." -ForegroundColor Yellow
$frontendCmd = "cd `"$ROOT\frontend`" && npm run dev"
Start-Process cmd -ArgumentList "/k `"title Frontend (CyberOptRQ) && color 0B && $frontendCmd`"" -WindowStyle Normal

Start-Sleep -Seconds 4

# ── Open Browser ──────────────────────────────────────────────────────────
Write-Host "  Opening browser..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  SIH DEMO IS RUNNING" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend  →  http://localhost:5173" -ForegroundColor White
Write-Host "  Backend   →  http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs  →  http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "  DEMO LOGIN:" -ForegroundColor Cyan
Write-Host "    Click [BYPASS — Enter Demo] on the login screen" -ForegroundColor White
Write-Host "    OR click [Book a Live Demo] on the marketing page" -ForegroundColor White
Write-Host ""
Write-Host "  DEMO ROLES:" -ForegroundColor Cyan
Write-Host "    CISO  · CFO  · SOC  · Security  · IT" -ForegroundColor White
Write-Host ""
Write-Host "  ATTACK DEMO:" -ForegroundColor Cyan
Write-Host "    Use the 9-stage Demo Bar at the top of the dashboard" -ForegroundColor White
Write-Host "    Stage 6 = Launch Attack  |  Stage 8 = Remediate" -ForegroundColor White
Write-Host ""
Write-Host "  RESET:" -ForegroundColor Cyan
Write-Host "    Click [RESET DEMO] in the Demo Bar (top of screen)" -ForegroundColor White
Write-Host "    OR: POST http://localhost:8000/api/v1/demo/attack/reset" -ForegroundColor White
Write-Host ""
Write-Host "  HELP SYSTEM:" -ForegroundColor Cyan
Write-Host "    Click [ ? HELP ] in the top-right header" -ForegroundColor White
Write-Host "    Dashboard stays visible · target element highlighted · side panel explains" -ForegroundColor White
Write-Host ""
