@echo off
REM ============================================================================
REM SIH 2026 Problem Statement 26105:
REM Hyperledger Fabric Blockchain Demonstration Launcher
REM ============================================================================

echo ============================================================================
echo   Hyperledger Fabric Multi-Node Blockchain Demonstration
echo   Raft (etcdraft) - Crash Fault Tolerant (CFT) ordering/consensus
echo ============================================================================
echo.

.venv_org_risk\Scripts\python.exe run_blockchain_demo.py

echo.
pause
