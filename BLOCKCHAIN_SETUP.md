# Hyperledger Fabric Local Setup & Bootstrap Guide
## SIH 2026 Problem Statement 26105: AI-Powered Continuous Cyber Risk Quantification & Investment Optimization Platform

---

## Environment Requirements

To run the local multi-node Hyperledger Fabric network:

- **Operating System**: Windows 10/11 with WSL2 enabled or Ubuntu Linux 20.04+.
- **Docker**: Docker Desktop version 4.15+ (with WSL2 integration active).
- **Docker Compose**: Version 2.10+.
- **Python**: 3.9+ with `.venv_org_risk` virtual environment.

---

## Step-by-Step Local Deployment Guide

### Step 1: Start Docker Desktop
Ensure Docker Desktop is running on your machine:
```powershell
docker ps
```
*If docker displays container headers, the Docker daemon is active.*

### Step 2: Bootstrap the Hyperledger Fabric Network
Run the automated network bootstrap script from the project root:

**On Windows (PowerShell):**
```powershell
.\fabric\scripts\bootstrap_network.ps1
```

**On Linux / macOS (Bash):**
```bash
chmod +x fabric/scripts/bootstrap_network.sh
./fabric/scripts/bootstrap_network.sh
```

#### What `bootstrap_network` does automatically:
1. Generates MSP crypto materials (certificates & private keys) for OrdererOrg, Org1MSP, and Org2MSP.
2. Generates channel genesis block and channel transaction artifacts for `cyber-risk-channel`.
3. Launches 6 Docker containers (`orderer1`, `orderer2`, `orderer3`, `peer0.org1`, `peer0.org2`, `cli`).
4. Creates channel `cyber-risk-channel` on the Raft ordering service.
5. Joins `peer0.org1` and `peer0.org2` to `cyber-risk-channel`.
6. Packages, installs, approves, and commits the `cyber_risk_audit` smart contract chaincode.
7. Executes `initLedger` to initialize genesis state.

---

## Verifying Network Health

Run the following command to check running Fabric containers:
```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected running containers (6 total):
- `orderer1.example.com`
- `orderer2.example.com`
- `orderer3.example.com`
- `peer0.org1.example.com`
- `peer0.org2.example.com`
- `cli`

---

## Starting the Backend API

Activate the virtual environment and start FastAPI:
```powershell
.\.venv_org_risk\Scripts\python.exe -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Verifying Honest Offline Status

If Docker Desktop is NOT running:
- The backend application and API endpoint `GET /blockchain/status` will report:
  `"fabric_network_running": false`
  `"message": "Fabric network offline: Docker daemon is not running..."`
- The system gracefully falls back to local indexing without faking consensus or claiming fake verification.
