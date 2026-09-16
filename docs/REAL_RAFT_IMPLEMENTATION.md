# Real Hyperledger Fabric Raft Implementation & Consensus Architecture
## SIH 2026 Problem Statement 26105: AI-Powered Continuous Cyber Risk Quantification & Investment Optimization Platform

---

## 1. Consensus vs. Cryptographic Hashing: Clarification

> [!IMPORTANT]
> **Consensus Mechanism**: **Raft (etcdraft) — Crash Fault Tolerant (CFT) ordering/consensus**.
> Raft is the distributed consensus protocol used by the 3 ordering nodes to sequence transactions into blocks, elect a Raft leader, and maintain log replication across independent nodes even if 1 orderer node crashes (Quorum: 2 out of 3 active nodes).
>
> **Cryptographic Hashing**: **SHA-256**.
> SHA-256 is used exclusively for generating block hashes, state tree integrity (Merkle tree digests), and digital signatures via Fabric's Membership Service Provider (MSP) PKI hierarchy. **SHA-256 is hashing, NOT consensus.**

---

## 2. Network Topology & Ordering Service Specification

```
                CyberOptRQ Backend Gateway
                            |
                            v
                     Fabric Gateway
                            |
            +---------------+---------------+
            |                               |
     Ordering Service                     Peers
            |                               |
    +-------+-------+               +-------+-------+
    |       |       |               |               |
 orderer1 orderer2 orderer3       peer0.org1      peer0.org2
 (Pt 7050)(Pt 7054)(Pt 7056)       (Org1MSP)       (Org2MSP)
    \       |       /
     \      |      /
      ---- Raft ----
```

### Configured Raft Consenters (`fabric/configtx.yaml`)
```yaml
Orderer:
  OrdererType: etcdraft
  EtcdRaft:
    Consenters:
      - Host: orderer1.example.com
        Port: 7050
        ClientTLSCert: crypto-config/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/server.crt
        ServerTLSCert: crypto-config/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/server.crt
      - Host: orderer2.example.com
        Port: 7054
        ClientTLSCert: crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/server.crt
        ServerTLSCert: crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/server.crt
      - Host: orderer3.example.com
        Port: 7056
        ClientTLSCert: crypto-config/ordererOrganizations/example.com/orderers/orderer3.example.com/tls/server.crt
        ServerTLSCert: crypto-config/ordererOrganizations/example.com/orderers/orderer3.example.com/tls/server.crt
```

---

## 3. Fabric Transaction Lifecycle

1. **Transaction Proposal**: Client gateway submits proposed transaction to endorsing peers (`peer0.org1`, `peer0.org2`).
2. **Chaincode Endorsement**: Endorsing peers simulate execution against state database and return signed proposal response.
3. **Submit to Ordering Service**: Client packages endorsed transaction payload and submits to Raft Ordering Service (`orderer1/2/3`).
4. **Raft Leader Consensus & Block Creation**: Raft leader orders transactions chronologically, packs them into Block #N, and replicates Raft log across consenter nodes.
5. **Block Delivery & Validation**: Orderers deliver Block #N to `peer0.org1` and `peer0.org2`.
6. **Ledger Commit**: Peers validate signatures, check read-write sets, and commit block to local state store.

---

## 4. Crash Fault Tolerance (CFT) & Failure Recovery

For a 3-node Raft orderer cluster:
\[
\text{Quorum} = \left\lfloor \frac{N}{2} \right\rfloor + 1 = \left\lfloor \frac{3}{2} \right\rfloor + 1 = 2 \text{ nodes}
\]

- **Node Crash Simulation**: Stopping `orderer3.example.com` (`docker stop orderer3.example.com`) reduces active orderers from 3 to 2.
- **Continued Operation**: Because 2 active nodes meet the Raft Quorum requirement (2/3), the cluster continues ordering transactions and committing blocks without interruption.
- **Recovery & Re-Sync**: Restarting `orderer3.example.com` (`docker start orderer3.example.com`) allows `orderer3` to automatically catch up with missing Raft logs.

---

## 5. Verification Commands

To verify the Raft network:
```powershell
.\.venv_org_risk\Scripts\python.exe scripts/verify_raft_network.py
```

To run the Raft failure recovery demonstration:
```powershell
.\.venv_org_risk\Scripts\python.exe scripts/demo_raft_failure.py
```

To run the full pipeline demonstration:
```powershell
.\.venv_org_risk\Scripts\python.exe demo_full_raft.py
```
