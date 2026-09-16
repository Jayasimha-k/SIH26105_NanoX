@echo off
TITLE CyberOpt-RQ Local Launcher
COLOR 0A

echo ================================================================
echo             CyberOpt-RQ (SIH PS-26105) Local Runner
echo ================================================================
echo.

SET ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%"

echo [1/4] Checking Python & Backend Dependencies...
python -m pip install -r "%ROOT_DIR%backend\requirements.txt" --quiet
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install backend Python dependencies.
    pause
    exit /b %ERRORLEVEL%
)

echo [2/4] Checking Frontend Dependencies (npm)...
if not exist "%ROOT_DIR%frontend\node_modules" (
    echo Installing node_modules in frontend...
    cd /d "%ROOT_DIR%frontend"
    call npm install
    cd /d "%ROOT_DIR%"
)

echo [3/4] Starting FastAPI Backend on port 8000...
start "CyberOpt Backend (FastAPI)" cmd /k "cd /d ""%ROOT_DIR%backend"" && python run.py"

:: Wait 3 seconds for backend initialization & database seeding
timeout /t 3 /nobreak >nul

echo [4/4] Starting React Frontend on port 5173...
start "CyberOpt Frontend (Vite)" cmd /k "cd /d ""%ROOT_DIR%frontend"" && npm run dev"

timeout /t 2 /nobreak >nul

echo.
echo ================================================================
echo                     SERVICES LAUNCHED
echo ================================================================
echo  - Frontend URL:  http://localhost:5173
echo  - Backend Docs:  http://localhost:8000/docs
echo  - WebSocket URL: ws://localhost:8000/ws/events
echo.
echo  Default Authenticated Accounts:
echo    * CISO Role:     Username: ciso_executive  ^| Password: CyberOpt@2026!
echo    * SOC Role:      Username: soc_analyst     ^| Password: CyberOpt@2026!
echo    * Security Role: Username: security_lead   ^| Password: CyberOpt@2026!
echo    * IT Role:       Username: it_remediation  ^| Password: CyberOpt@2026!
echo ================================================================
echo.

:: Open the browser to the application
start http://localhost:5173

echo Press any key to exit this launcher window (services will stay running).
pause >nul
