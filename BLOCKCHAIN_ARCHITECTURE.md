# Hyperledger Fabric Permissioned Network Architecture
## SIH 2026 Problem Statement 26105: AI-Powered Continuous Cyber Risk Quantification & Investment Optimization Platform

---

## Executive Summary

The **CyberOpt-RQ** platform integrates a genuine, local permissioned **Hyperledger Fabric v2.5** blockchain network to provide an immutable, multi-node cryptographic audit trail for enterprise cyber risk assessments, Knapsack budget optimization decisions, operational security remediations, and post-remediation reassessments.

---

## Network Topology & Component Architecture

```
                    AI Risk Engine (P1-P4 Ensemble)
                         |
                         v
                Organization Risk Model
                         |
                         v
                Expected Annual Loss (EAL) Engine
                         |
                         v
                Investment Optimizer (Knapsack)
                         |
                         v
                 Blockchain API (FastAPI Gateway)
                         |
                         v
              Hyperledger Fabric Gateway CLI/gRPC
                         |
       +-----------------+-----------------+
       |                                   |
  Orderer Network                     Peer Network
       |                                   |
 orderer1.example.com (Port 7050)    peer0.org1.example.com (Org1MSP)
 orderer2.example.com (Port 7054)    peer0.org2.example.com (Org2MSP)
 orderer3.example.com (Port 7056)          |
       |                             CouchDB State Database
  Raft (etcdraft)                          |
  CFT Consensus / Ordering          Replicated Ledger State
```

### Node Inventory & Roles

| Node Name | Container Name | Role | Port | Organization / MSP | Consensus / Database |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Orderer 1** | `orderer1.example.com` | Raft Consenter 1 | 7050 / 7053 | `OrdererMSP` | `etcdraft` Raft Ordering |
| **Orderer 2** | `orderer2.example.com` | Raft Consenter 2 | 7054 / 7055 | `OrdererMSP` | `etcdraft` Raft Ordering |
| **Orderer 3** | `orderer3.example.com` | Raft Consenter 3 | 7056 / 7057 | `OrdererMSP` | `etcdraft` Raft Ordering |
| **Peer 0 (Org1)** | `peer0.org1.example.com` | Endorsing & Committing Peer | 7051 / 9443 | `Org1MSP` (Risk Governance) | GoLevelDB / CouchDB State DB |
| **Peer 0 (Org2)** | `peer0.org2.example.com` | Endorsing & Committing Peer | 9051 / 9444 | `Org2MSP` (Regulatory/Audit) | GoLevelDB / CouchDB State DB |
| **CLI Admin** | `cli` | Admin & Lifecycle Mgmt | N/A | `Org1MSP` | Fabric Tools v2.5 |

---

## Consensus vs. Cryptographic Hashing: Clarification

> [!IMPORTANT]
> **Consensus Mechanism**: **Raft (etcdraft) — Crash Fault Tolerant (CFT) ordering/consensus**.
> Raft is the distributed consensus protocol used by the 3 ordering nodes to sequence transactions into blocks, elect a raft leader, and maintain state consistency across nodes even if 1 orderer node crashes (Quorum: 2 out of 3 active nodes).
>
> **Cryptographic Hashing**: **SHA-256**.
> SHA-256 is used exclusively for generating block hashes, state tree integrity (Merkle tree digests), and digital signatures via Fabric's Membership Service Provider (MSP) PKI hierarchy. **SHA-256 is hashing, NOT consensus.**

---

## Smart Contract / Chaincode (`cyber_risk_audit.js`)

The smart contract is packaged and deployed on channel `cyber-risk-channel`.

### Chaincode Interface Methods

1. `initLedger(ctx)`: Initializes genesis audit metadata.
2. `recordRiskAssessment(ctx, eventId, orgId, threatId, metaRisk, orgRisk, eal, detailsJson)`: Records AI risk assessment.
3. `recordInvestmentDecision(ctx, eventId, orgId, controlId, investmentCost, expectedReduction, rosi, detailsJson)`: Records portfolio optimizer decision.
4. `recordRemediation(ctx, eventId, orgId, assetId, actionTaken, verifiedBy, detailsJson)`: Records security patch/mitigation deployment.
5. `recordReassessment(ctx, eventId, orgId, previousRisk, newRisk, residualEal, detailsJson)`: Records post-remediation risk posture.
6. `getAuditEvent(ctx, eventId)`: Retrieves single audit event by ID.
7. `getOrganizationHistory(ctx, orgId)`: Retrieves full chronological timeline of events for an organization.
8. `getAssetHistory(ctx, assetId)`: Retrieves remediation history for a specific asset.
9. `getLatestRisk(ctx, orgId)`: Retrieves current latest risk score and EAL pointer.

---

## On-Chain vs. Off-Chain Data Boundary

| Data Element | Storage Location | Rationale |
| :--- | :--- | :--- |
| **Audit Payload (Event ID, Org ID, Risk %, EAL, Decision, Cost, Timestamp, MSP Signer)** | **On-Chain (Fabric Ledger)** | Immutable audit record, cross-organizational auditability, tamper-resistance. |
| **Raw Threat Feed Logs (CVEs, EPSS vectors)** | **Off-Chain (SQLite / Filesystem)** | Large volume JSON feeds; off-chain reference digest stored on-chain. |
| **ONNX Machine Learning Model Weights (`model.onnx`)** | **Off-Chain (Filesystem / S3)** | Binary file model weights; model version hash recorded on-chain. |
| **Detailed Vulnerability Scan Payloads** | **Off-Chain (SQLite DB)** | Detailed scanner logs; payload SHA-256 hash passed to chaincode. |

---

## End-to-End Transaction Flow

```
1. Threat Data Ingestion -> P1-P4 Risk Ensembles -> Meta Model -> Org-Specific Model -> EAL Engine (Off-Chain)
2. Investment Optimizer generates optimal control recommendation (Off-Chain)
3. Backend invokes Fabric Gateway Service via CLI/gRPC (Transaction Proposal)
4. Peer Org1 (`peer0.org1`) & Peer Org2 (`peer0.org2`) endorse transaction proposal using MSP certificates
5. Endorsed transaction submitted to Raft Ordering Service (`orderer1/2/3`)
6. Raft Consenter Leader sequences transaction into Block #N
7. Block #N broadcasted to all peers (`peer0.org1`, `peer0.org2`)
8. Peers validate transaction signatures & commit block to local CouchDB/LevelDB state store
9. Ledger history query confirms identical committed state on both Org1 and Org2 peers
```
