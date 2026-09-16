#!/usr/bin/env bash
# ==============================================================================
# CyberOpt-RQ (SIH PS-26105) - Automated Platform Startup Script
# AI-Powered Continuous Cyber Risk Quantification & Investment Optimization
# ==============================================================================

set -e

# ANSI Color Codes
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Determine script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${CYAN}${BOLD}======================================================================${NC}"
echo -e "${CYAN}${BOLD}     CYBEROPT-RQ (SIH PS-26105) - PLATFORM STARTUP CONTROLLER        ${NC}"
echo -e "${CYAN}${BOLD}  Continuous Risk Quantification & PuLP Investment Optimization       ${NC}"
echo -e "${CYAN}${BOLD}======================================================================${NC}"
echo ""

# ------------------------------------------------------------------------------
# 1. Detect Python Environment
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[1/4] Detecting Python Environment...${NC}"

if [ -f "$SCRIPT_DIR/.venv_org_risk/Scripts/python.exe" ]; then
    PYTHON_BIN="$SCRIPT_DIR/.venv_org_risk/Scripts/python.exe"
elif [ -f "$SCRIPT_DIR/.venv_org_risk/bin/python" ]; then
    PYTHON_BIN="$SCRIPT_DIR/.venv_org_risk/bin/python"
elif [ -f "$SCRIPT_DIR/.venv/Scripts/python.exe" ]; then
    PYTHON_BIN="$SCRIPT_DIR/.venv/Scripts/python.exe"
elif [ -f "$SCRIPT_DIR/.venv/bin/python" ]; then
    PYTHON_BIN="$SCRIPT_DIR/.venv/bin/python"
elif command -v python3 &>/dev/null; then
    PYTHON_BIN="python3"
elif command -v python &>/dev/null; then
    PYTHON_BIN="python"
else
    echo -e "${RED}[ERROR] Python not found. Please install Python 3.10+ or set up a virtual environment.${NC}"
    exit 1
fi

echo -e "  ${GREEN}✓ Using Python:${NC} $($PYTHON_BIN --version 2>&1) [${PYTHON_BIN}]"

# ------------------------------------------------------------------------------
# 2. Check Hyperledger Fabric Status
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[2/4] Checking Hyperledger Fabric Blockchain...${NC}"

if command -v docker &>/dev/null && docker ps &>/dev/null; then
    ORDERER_COUNT=$(docker ps --filter "name=orderer" --format "{{.Names}}" | wc -l)
    PEER_COUNT=$(docker ps --filter "name=peer" --format "{{.Names}}" | wc -l)
    
    if [ "$ORDERER_COUNT" -ge 1 ] && [ "$PEER_COUNT" -ge 1 ]; then
        echo -e "  ${GREEN}✓ Hyperledger Fabric Active:${NC} $ORDERER_COUNT Orderer(s), $PEER_COUNT Peer(s) online."
    else
        echo -e "  ${YELLOW}! Fabric containers not detected. (Backend will run in standalone/local-audit mode)${NC}"
    fi
else
    echo -e "  ${YELLOW}! Docker daemon not running or not found. Fabric ledger checks skipped.${NC}"
fi

# ------------------------------------------------------------------------------
# 3. Check Frontend Dependencies
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[3/4] Checking Frontend Environment...${NC}"

if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
    echo -e "  Installing frontend npm packages..."
    (cd "$SCRIPT_DIR/frontend" && npm install)
fi
echo -e "  ${GREEN}✓ Frontend packages ready.${NC}"

# ------------------------------------------------------------------------------
# 4. Launch Backend & Frontend Services
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[4/4] Launching CyberOpt-RQ Services...${NC}"

# Cleanup handler for graceful shutdown
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping CyberOpt-RQ services...${NC}"
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    echo -e "${GREEN}All services stopped cleanly.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Start FastAPI Backend
echo -e "  Starting FastAPI backend on ${BOLD}http://localhost:8000${NC}..."
(
    cd "$SCRIPT_DIR/backend"
    exec "$PYTHON_BIN" -m uvicorn app.main:app --host 0.0.0.0 --port 8000
) &
BACKEND_PID=$!

# Wait briefly for backend port binding
sleep 2

# Start Vite Frontend
echo -e "  Starting Vite frontend on ${BOLD}http://localhost:5173${NC}..."
(
    cd "$SCRIPT_DIR/frontend"
    exec npm run dev
) &
FRONTEND_PID=$!

sleep 2

echo ""
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "${GREEN}${BOLD}               CYBEROPT-RQ PLATFORM SUCCESSFULLY STARTED              ${NC}"
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "  ${BOLD}Web Dashboard:${NC}    ${CYAN}http://localhost:5173${NC}"
echo -e "  ${BOLD}Backend API:${NC}      ${CYAN}http://localhost:8000${NC}"
echo -e "  ${BOLD}Interactive Docs:${NC} ${CYAN}http://localhost:8000/docs${NC}"
echo -e "  ${BOLD}WebSocket Feeds:${NC}  ${CYAN}ws://localhost:8000/ws/events${NC}"
echo ""
echo -e "${BOLD}Default Demo Credentials:${NC}"
echo -e "  • ${BOLD}CISO Role:${NC}     Username: ${CYAN}ciso_executive${NC}  | Password: ${CYAN}CyberOpt@2026!${NC}"
echo -e "  • ${BOLD}SOC Role:${NC}      Username: ${CYAN}soc_analyst${NC}     | Password: ${CYAN}CyberOpt@2026!${NC}"
echo -e "  • ${BOLD}Security Lead:${NC} Username: ${CYAN}security_lead${NC}   | Password: ${CYAN}CyberOpt@2026!${NC}"
echo -e "  • ${BOLD}IT Remediation:${NC}Username: ${CYAN}it_remediation${NC}  | Password: ${CYAN}CyberOpt@2026!${NC}"
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "Press ${BOLD}[CTRL+C]${NC} in this terminal to gracefully terminate all services."
echo ""

# Keep running and wait for background jobs
wait "$BACKEND_PID" "$FRONTEND_PID"
