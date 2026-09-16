# Hyperledger Fabric Mentor Demonstration Guide
## SIH 2026 Problem Statement 26105: AI-Powered Continuous Cyber Risk Quantification & Investment Optimization Platform

---

## Overview

This guide details how to present and demonstrate the **Hyperledger Fabric Permissioned Multi-Node Blockchain Network** to evaluators and mentors.

---

## Single-Command Mentor Demo

Run the automated mentor demonstration script:

```powershell
.\.venv_org_risk\Scripts\python.exe run_blockchain_demo.py
```

### Demonstration Script Flow

The script automatically executes the complete 12-step cycle:

1. **Environment & Network Status Inspection**:
   - Inspects active containers, orderers, peers, channel, and consensus status.
2. **AI Ensemble Risk Assessment Calculation**:
   - Ingests threat vector (CVE-2023-44487), calculates P1-P4 scores, Meta Model risk score (85.0%), and Org-Adapted Risk (77.5%, EAL ₹34.6M).
3. **Submission of Transaction A (`RISK_ASSESSMENT`)**:
   - Submits `recordRiskAssessment()` transaction to Fabric ledger.
4. **Knapsack Investment Optimization Execution**:
   - Optimizes ₹1,000,000.00 budget ceiling to select controls (`CTRL-1` EDR, `CTRL-2` Patching), calculating expected risk reduction (11.3 pts) and ROSI (311.69%).
5. **Submission of Transaction B (`INVESTMENT_DECISION`)**:
   - Submits `recordInvestmentDecision()` transaction to Fabric ledger.
6. **Security Remediation Execution**:
   - Records patch application on exposed transaction gateway asset (`AST-A-01`).
7. **Submission of Transaction C (`REMEDIATION`)**:
   - Submits `recordRemediation()` transaction to Fabric ledger.
8. **Post-Remediation Reassessment**:
   - Recalculates risk posture post-patch (Risk: 52.4%, Residual EAL ₹18.0M).
9. **Submission of Transaction D (`REASSESSMENT`)**:
   - Submits `recordReassessment()` transaction to Fabric ledger.
10. **Ledger Query from Peer Org 1 (`peer0.org1`)**:
    - Queries timeline of committed events for `ORG-HOSP-A` from primary governance peer.
11. **Ledger Query from Peer Org 2 (`peer0.org2`)**:
    - Queries timeline of committed events for `ORG-HOSP-A` from independent regulatory peer, proving state replication across organizations.
12. **Consensus & Architecture Verification Report**:
    - Generates diagnostic summary highlighting Raft CFT ordering, SHA-256 block hashing, and status.

---

## Controlled Orderer Node Failure Test (Raft Quorum Demonstration)

To demonstrate **Raft Crash Fault Tolerance (CFT)** to mentors:

### Step 1: Verify 3 Active Orderers
```powershell
docker ps --filter "name=orderer"
```

### Step 2: Stop Orderer 3 (`orderer3.example.com`)
```powershell
docker stop orderer3.example.com
```

### Step 3: Submit New Transaction
Submit a new transaction via API or script.
**Result**: The network continues operating normally because Raft Quorum requires \(\lfloor N/2 \rfloor + 1 = \lfloor 3/2 \rfloor + 1 = 2\) active orderers out of 3. `orderer1` and `orderer2` maintain consensus and commit the block successfully.

### Step 4: Restart Orderer 3
```powershell
docker start orderer3.example.com
```
`orderer3` automatically catches up with the latest blocks via Raft log replication!

---

## Direct CLI Chaincode Queries (For Deep Inspection)

Mentors can inspect the raw ledger state directly inside the Fabric `cli` container:

### Query Organization Audit Event Timeline:
```powershell
docker exec cli peer chaincode query -C cyber-risk-channel -n cyber_risk_audit -c '{"function":"getOrganizationHistory","Args":["ORG-HOSP-A"]}'
```

### Query Latest Risk Posture:
```powershell
docker exec cli peer chaincode query -C cyber-risk-channel -n cyber_risk_audit -c '{"function":"getLatestRisk","Args":["ORG-HOSP-A"]}'
```
