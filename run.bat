@echo off
TITLE SIH 2026 PS 26105 - Cyber Risk Quantification & Investment Optimization (100%% Offline)
COLOR 0A

echo ======================================================================
echo       SIH 2026 PS 26105: CYBER RISK COMMAND CENTER
echo       AI-Powered Continuous Cyber Risk Quantification & Optimization
echo ======================================================================
echo   STATUS: 100%% OFFLINE (Air-Gapped Operation)
echo   LOCAL REPOSITORY: data/threats/ (Updated: 2026-09-16)
echo   BLOCKCHAIN AUDIT: Enabled (SHA-256 Ledger + Trusted Genesis Anchor)
echo ======================================================================
echo.

:: Detect Python environment
IF EXIST ".venv_org_risk\Scripts\python.exe" (
    SET PYTHON_EXE=.venv_org_risk\Scripts\python.exe
) ELSE (
    SET PYTHON_EXE=python
)

:MENU
echo SELECT OPERATION:
echo [1] Run Complete 10-Step Offline SIH Demonstration (Hospital A)
echo [2] Run Blockchain Cryptographic Tamper Detection Test
echo [3] Run Cross-Machine ONNX Model Portability Verifier
echo [4] Process Local Threat Intelligence Event (Scheduler)
echo [5] Re-Initialize & Seed Offline SQLite Database (cyber_risk.db)
echo [6] Exit
echo.
set /p choice=Enter choice [1-6]: 

IF "%choice%"=="1" GOTO DEMO
IF "%choice%"=="2" GOTO TAMPER
IF "%choice%"=="3" GOTO PORTABLE
IF "%choice%"=="4" GOTO SCHEDULER
IF "%choice%"=="5" GOTO SEED
IF "%choice%"=="6" GOTO END

echo Invalid choice. Please try again.
echo.
GOTO MENU

:DEMO
echo.
echo Launching 10-Step Air-Gapped Demonstration Flow...
%PYTHON_EXE% demo_offline_flow.py
pause
GOTO MENU

:TAMPER
echo.
echo Running Cryptographic Tamper Detection Test...
%PYTHON_EXE% tamper_test.py
pause
GOTO MENU

:PORTABLE
echo.
echo Verifying Model Portability & Zero-Cloud Determinism...
%PYTHON_EXE% verify_model_portability.py
pause
GOTO MENU

:SCHEDULER
echo.
echo Processing Local Threat Intelligence Record...
%PYTHON_EXE% scheduler.py --once
pause
GOTO MENU

:SEED
echo.
echo Re-initializing Local SQLite Database (cyber_risk.db)...
%PYTHON_EXE% database/db_manager.py
pause
GOTO MENU

:END
echo Exiting Cyber Risk Platform.
exit /b 0
