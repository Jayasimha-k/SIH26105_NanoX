# Hyperledger Fabric & Blockchain FAQ
## SIH 2026 Problem Statement 26105: AI-Powered Continuous Cyber Risk Quantification & Investment Optimization Platform

---

## 1. What is the difference between SHA-256 and Blockchain Consensus?

- **SHA-256**: A cryptographic hash function that maps data to a fixed 256-bit hash value. It provides data integrity and link verification (e.g. hash of block N-1 included in block N header). **SHA-256 is hashing, NOT consensus.**
- **Raft (etcdraft) Consensus**: A distributed consensus algorithm where multiple ordering nodes agree on transaction ordering, elect leaders, and replicate state logs across independent servers. In Hyperledger Fabric, Raft ensures Crash Fault Tolerance (CFT) across orderers.

---

## 2. Why use Hyperledger Fabric instead of Ethereum or Public Blockchains?

1. **Permissioned Access**: Cyber risk scores, asset vulnerabilities, and financial loss metrics (EAL) are sensitive corporate data that cannot be published on a public blockchain like Ethereum or Bitcoin.
2. **High Throughput & Zero Gas Fees**: Fabric provides instant finality with zero gas costs per transaction, making it scalable for continuous real-time risk quantification.
3. **Pluggable Architecture**: Supports enterprise Raft consensus, channels for private communication between specific organizations, and fine-grained MSP role-based access control.

---

## 3. How does the AI Risk Engine interact with Hyperledger Fabric?

The AI Risk Engine (P1-P4 threat ensembles, Meta Model, and Organization-Specific Risk Model) runs off-chain for high performance.
When an AI risk score or budget optimization recommendation is finalized:
1. The backend API forms an audit event transaction payload.
2. The transaction payload is submitted to the Hyperledger Fabric network.
3. Peer nodes endorse the proposal, Raft orderers sequence it into a block, and all participating organization peers record the immutable audit entry.

---

## 4. What happens if a node fails?

Hyperledger Fabric uses **Raft (etcdraft) — Crash Fault Tolerant (CFT) ordering/consensus**.
For a 3-node orderer network (`orderer1`, `orderer2`, `orderer3`), the quorum required to maintain consensus is:
\[
\text{Quorum} = \left\lfloor \frac{N}{2} \right\rfloor + 1 = \left\lfloor \frac{3}{2} \right\rfloor + 1 = 2 \text{ nodes}
\]
If 1 orderer node crashes or goes offline, the remaining 2 orderers maintain consensus, transaction ordering, and block commitment without any interruption. When the offline orderer recovers, it automatically synchronizes its Raft log.

---

## 5. What data is stored on-chain vs. off-chain?

- **On-Chain**: Structured audit records containing `event_id`, `organization_id`, `event_type`, `meta_risk`, `organization_risk`, `expected_annual_loss_inr`, `recommended_control_id`, `investment_cost_inr`, `timestamp`, `recorded_by_msp`, and `tx_id`.
- **Off-Chain**: Heavy machine learning model binaries (`model.onnx`), raw threat intelligence feeds, full database backups, and raw vulnerability scan logs.
