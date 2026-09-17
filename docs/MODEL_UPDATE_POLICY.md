# CyberOpt-RQ: Enterprise Machine Learning & Threat Governance Policy

**Document ID:** GOV-POL-ML-2026-001  
**Project:** AI-Powered Continuous Cyber Risk Quantification & Investment Optimization Platform  
**SIH 2026 Problem Statement:** PS 26105 (Theme: Blockchain & Cybersecurity)  
**Team:** Nano X  
**Last Updated:** 2026-09-17  

---

## 1. Core Principle: Guarding Against Autonomous Feedback Loops

> [!CAUTION]
> **Prohibited Autonomous Drift Pipeline:**  
> Under NO circumstances should incoming external threat intelligence (newsletters, RSS feeds, security advisories) trigger automatic model retraining or autonomous modification of evidence fusion weights.
> 
> $$\text{New Threat Advisory} \centernot\implies \text{Auto-Retraining} \centernot\implies \text{Auto-Weight Mutation}$$

Automated retraining on live unverified threat feeds introduces severe adversarial vulnerabilities, including:
1. **Data Poisoning & Sybil Manipulation:** Adversaries publishing manipulated RSS feeds to degrade IDS detection thresholds.
2. **Concept Drift & Catastrophic Forgetting:** Overwriting base classifier tree distributions based on transient attack campaigns.
3. **Weight Instability:** Prematurely collapsing multi-modal defense-in-depth weights ($w_{P6}$) without rigorous hold-out validation.

---

## 2. Governance Lifecycle & Tiered Policy Matrix

| Operational Tier | Trigger Mechanism | Execution Mode | Authorization Level | Verification & Validation Protocol |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1: Threat Data Ingestion** | Scheduled cron, offline cache import, or RSS fetch | **AUTOMATIC** | Automated System Worker | Strict CVE syntax check (`CVE-\d{4}-\d{4,}`), cryptographic SHA-256 deduplication, and authoritative KEV/NVD cross-referencing. |
| **Tier 2: Risk Reassessment** | Validated new threat event entering repository | **AUTOMATIC** | Automated Pipeline with Audit | Matches affected enterprise assets, computes multi-modal inference ($P_1\dots P_4$, $P_5$ Meta-Ensemble, $P_6$ Behavioral Evidence, Fusion v2), recalculates EAL, and logs immutable transaction to Hyperledger Fabric. |
| **Tier 3: Model Retraining (P1–P6)** | Controlled research cycle or documented baseline shift | **CONTROLLED / MANUAL** | Lead ML Engineer & Security Architect Approval | Re-runs end-to-end data hygiene audit, feature leakage verification, chronological time-aware partitioning, IV recalculation, and hold-out evaluation before any artifact compilation. |
| **Tier 4: Fusion Weight Change** | Controlled empirical sweep on independent validation set | **CONTROLLED EXPERIMENT** | CISO & Lead Architect Sign-off | 21-point grid search maximizing composite validation utility ($\text{PR-AUC} \times \text{MCC} \times (1-\text{Brier}) \times (1-\text{ECE})$). Evaluated once on strictly untouched hold-out test set. Versioned JSON configuration created (`fusion_v*.json`). |
| **Tier 5: Model Version Promotion** | Staging benchmark sign-off | **FORMAL COMMITTEE APPROVAL** | Consortium Multi-Sig / Production Gate | Full reproducibility test, ONNX export verification, consortium chaincode validation, and backward-compatibility unit test suite passing 100%. |

---

## 3. Tier 1: Continuous Threat Data Ingestion Rules

1. **Offline-First Architecture:**  
   The platform operates in air-gapped / offline environments by default. Remote RSS/Atom URLs are configured in `config/threat_sources.json` and executed with non-blocking timeouts (4 seconds maximum). If disconnected, the system seamlessly ingests local cached threat feeds (`data/threats/demo_threat_feed.json`, `data/threats/vulnerabilities.json`).
2. **Provenance & Entity Integrity:**  
   - Threat records must never invent CVSS, EPSS, or exploitability metrics.
   - If an advisory mentions a syntactically valid CVE not yet reflected in the local authoritative cache, its status is set to `PENDING_VALIDATION`.
   - Synthetic demonstration events must use the explicit prefix `DEMO-THREAT-*` and status `VALIDATED_DEMO`.
3. **Cryptographic Deduplication:**  
   Every item is indexed by $\text{SHA-256}(\text{cve} \parallel \text{source} \parallel \text{title} \parallel \text{published\_at})$. Redundant articles across feeds are deduplicated at ingestion time.

---

## 4. Tier 2: Dynamic Multi-Modal Risk Reassessment Rules

When a threat reaches status `VALIDATED` or `VALIDATED_DEMO`:
1. **Affected Asset Resolution:** Correlate technology tags against the enterprise CMDB/Asset registry (`Asset` table).
2. **Pre-Breach Posture Assessment ($P_5$):** Evaluate vulnerability characteristics ($P_1$ CVSS/NVD, $P_2$ EPSS, $P_3$ CISA KEV, $P_4$ MITRE ATT&CK) through the meta-model XGBoost ensemble.
3. **Empirical Telemetry Assessment ($P_6$):** Evaluate behavioral flow characteristics from network telemetry using the 56-feature leak-free XGBoost classifier.
4. **Evidence Fusion ($P_{\text{fused}}$):** Apply active versioned weights (currently Fusion v2: $w_{P6}=0.90, w_{P5}=0.10$):
   $$P_{\text{fused}} = 0.10 \times P_5 + 0.90 \times P_6$$
5. **Loss Quantification & Optimization:** Recalculate Expected Annual Loss ($\text{EAL} = P_{\text{fused}} \times \text{Financial Impact}$) and evaluate optimal compensating controls via Knapsack PuLP solver.
6. **Immutable Ledger Anchoring:** Commit the reassessment event to Hyperledger Fabric via `FabricService.record_risk_assessment`. If the Fabric peer network is offline, queue the transaction in local tamper-evident audit storage.

---

## 5. Tier 3 & 4: Controlled Model Updates & Weight Changes

1. **Zero Overwrite Mandate:**  
   Existing production models ($P_1\dots P_5$) must NEVER be overwritten. Any newly trained model artifact must receive a unique semver file name (e.g. `CyberOptRQ_P6_v2.pkl`).
2. **Mandatory Leakage Audit:**  
   Before any new training run:
   - Verify absence of direct identifiers (`Flow ID`, `Source/Dest IP`, `Source/Dest Port`, `Timestamp`, file/capture IDs).
   - Purge operating system fingerprints (e.g. initial TCP window bytes) and collinear duplicates.
   - Enforce strictly group-aware or chronological time-aware partitioning.
3. **Controlled Fusion Configuration:**  
   Fusion weights are immutable runtime artifacts stored in `models/fusion/fusion_v[N].json`. Modifying weights requires a documented sweep report in `reports/p6_fusion_weight_sweep.md` and comparison against the baseline hold-out test set.

---

## 6. Audit & Compliance Verification

Every model update, fusion configuration, and threat reassessment is subject to audit via:
- Model Card: [MODEL_CARD.md](file:///c:/Users/Kishanraj/SIH26105/SIH26105_NanoX/MODEL_CARD.md)
- Data Provenance: [MODEL_DATA_PROVENANCE.md](file:///c:/Users/Kishanraj/SIH26105/SIH26105_NanoX/MODEL_DATA_PROVENANCE.md)
- Blockchain Ledger: Raft Consensus Channel `cyber-risk-channel`, Smart Contract `cyber_risk_audit`
