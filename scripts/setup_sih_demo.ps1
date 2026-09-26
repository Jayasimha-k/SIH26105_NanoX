# SIH 2026 Demo Setup Script for Windows
# Run as: .\scripts\setup_sih_demo.ps1
# ============================================================
# Installs backend and frontend dependencies.
# Works entirely offline once dependencies are installed.
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  CyberOpt-RQ · SIH 2026 DEMO SETUP" -ForegroundColor Cyan
Write-Host "  PS 26105 — Cyber Risk Quantification Platform" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# ── Locate Python ──────────────────────────────────────────────────────────
$PythonCandidates = @(
    "python",
    "python3",
    "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
    "C:\Python314\python.exe",
    "C:\Python313\python.exe",
    "C:\Python312\python.exe"
)

$PYTHON_EXE = $null
foreach ($candidate in $PythonCandidates) {
    try {
        $ver = & $candidate --version 2>&1
        if ($ver -match "Python 3") {
            $PYTHON_EXE = $candidate
            Write-Host "  [OK] Python found: $ver ($candidate)" -ForegroundColor Green
            break
        }
    } catch {}
}

if (-not $PYTHON_EXE) {
    Write-Host "  [ERROR] Python 3.x not found. Please install Python 3.11 or newer." -ForegroundColor Red
    Write-Host "          Download: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# ── Locate Node.js ─────────────────────────────────────────────────────────
try {
    $nodeVer = & node --version 2>&1
    Write-Host "  [OK] Node.js found: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Node.js not found. Please install Node.js 18 or newer." -ForegroundColor Red
    Write-Host "          Download: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# ── Backend Dependencies ───────────────────────────────────────────────────
Write-Host ""
Write-Host "  [1/3] Installing backend Python dependencies..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\.."
try {
    & $PYTHON_EXE -m pip install -r backend/requirements.txt --quiet
    Write-Host "  [OK] Backend dependencies installed." -ForegroundColor Green
} catch {
    Write-Host "  [WARN] pip install had issues. Trying with --user flag..." -ForegroundColor Yellow
    & $PYTHON_EXE -m pip install -r backend/requirements.txt --user --quiet
    Write-Host "  [OK] Backend dependencies installed (user mode)." -ForegroundColor Green
}

# ── Frontend Dependencies ──────────────────────────────────────────────────
Write-Host ""
Write-Host "  [2/3] Installing frontend npm dependencies..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\frontend"
try {
    & node "$env:APPDATA\npm\node_modules\npm\bin\npm-cli.js" install 2>&1 | Out-Null
} catch {
    # fallback: use npm via cmd
    cmd /c "npm install" 2>&1 | Out-Null
}
Write-Host "  [OK] Frontend dependencies installed." -ForegroundColor Green

# ── Environment File ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "  [3/3] Checking environment configuration..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\.."

if (-not (Test-Path "backend\.env")) {
    if (Test-Path "backend\.env.example") {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "  [OK] Created backend\.env from .env.example (offline SIH mode)." -ForegroundColor Green
    } else {
        # Create minimal offline .env
        @"
# CyberOpt-RQ Backend Environment — SIH 2026 Offline Demo
DATABASE_MODE=sqlite
DATABASE_URL=sqlite:///./cyberopt_rq.db
SIH_DEMO_MODE=true
OFFLINE_MODE=true
SUPABASE_URL=
SUPABASE_KEY=
SECRET_KEY=sih2026-demo-secret-key-local-only
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
"@ | Out-File -FilePath "backend\.env" -Encoding utf8
        Write-Host "  [OK] Created backend\.env with offline SIH defaults." -ForegroundColor Green
    }
} else {
    Write-Host "  [OK] backend\.env already exists." -ForegroundColor Green
}

if (-not (Test-Path "frontend\.env")) {
    if (Test-Path "frontend\.env.example") {
        Copy-Item "frontend\.env.example" "frontend\.env"
        Write-Host "  [OK] Created frontend\.env from .env.example." -ForegroundColor Green
    } else {
        @"
# CyberOpt-RQ Frontend Environment — SIH 2026 Offline Demo
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
VITE_SIH_DEMO_MODE=true
VITE_OFFLINE_MODE=true
"@ | Out-File -FilePath "frontend\.env" -Encoding utf8
        Write-Host "  [OK] Created frontend\.env with offline defaults." -ForegroundColor Green
    }
} else {
    Write-Host "  [OK] frontend\.env already exists." -ForegroundColor Green
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  SETUP COMPLETE!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Next step: Run  .\scripts\start_sih_demo.ps1" -ForegroundColor Cyan
Write-Host ""
