# Continual Learning & Model Governance Engine
## SIH Problem Statement 26105 (CyberOpt-RQ)

---

### Executive Summary

In enterprise cyber risk quantification, continuous reassessment must never be conflated with continual model learning:

* **Continuous Threat Intelligence**: Ingestion of telemetry from NVD CVEs, CISA KEV, FIRST EPSS, and MITRE ATT&CK into the system.
* **Continuous Risk Reassessment**: Dynamic recalculation of Expected Annual Loss (EAL) and asset risk scores based on newly discovered vulnerabilities or applied security controls.
* **Continual Learning**: Supervised adaptation of the Organization-Specific Risk Model weights strictly when **confirmed, ground-truth outcome evidence** (e.g., confirmed cyber incident or confirmed defended benign attempt) is validated by security analysts.

The **Continual Learning & Model Governance Engine** ensures that our architectural claim:
> *"Organization-Specific Risk Model → Self-learning: Continuously updates with new data"*

is technically, statistically, and cryptographically verified without destabilizing core production models.

---

### 1. Immutability of Production Pipeline Models

The following production foundation models remain **100% immutable and untouched** during continual learning:
1. **P1 — NVD CVSS Exploitability Baseline** (Random Forest Classifier)
2. **P2 — EPSS Exploit Prediction Scoring** (Gradient Boosting Classifier)
3. **P3 — Organization Adaptation Layer** (Contextual Risk Multiplier)
4. **P4 — MITRE ATT&CK Technique Mapper** (Matrix Alignment)
5. **P5 — Meta Ensemble Model** (Supervised Blending)
6. **P6 — Network Anomaly & Behavioral Model** (UNSW-NB15 Validated)
7. **Fusion v2 Layer** (Configured Evidence Weighting & Calibration)

Continual learning operates exclusively on the **Organization-Specific Risk Adaptation Layer**, enabling organizations (e.g., *Hospital A*) to adapt risk predictions to their unique threat exposure, control effectiveness, and historical loss experience.

---

### 2. Operational Evidence Lifecycle

```
[ New Threat / Incident Telemetry ]
                 ↓
      [ Evidence Collection ]
  (P1-P6 outputs, Fused Prob, Context, Controls)
                 ↓
       [ Outcome Confirmation ]
 (SOC / SecOps Verified Incident or Benign Outcome)
                 ↓
     [ Ground-Truth Dataset ]
  (SHA-256 Deduplication, N >= 15, Class Diversity)
                 ↓
   [ Candidate Adaptation Training ]
                 ↓
 [ Governance Validation & PSI Drift Checks ]
                 ↓
       [ Champion vs Candidate ]
       /                       \
   [ PASS ]                  [ FAIL ]
      ↓                         ↓
[ Promote Candidate ]      [ Reject & Retain Champion ]
      ↓
[ Hyperledger Fabric Audit ]
```

#### Evidence Qualification Rules:
1. **No Raw Feed Training**: Raw CVE announcements or unconfirmed threat alerts are strictly prohibited from entering the training dataset.
2. **Deterministic Deduplication**: Every evidence item is fingerprinted using a SHA-256 hash of its operational context. Duplicate items are rejected.
3. **Verified Ground Truth**: Records must have an explicit `target_label`:
   * `1` = `CONFIRMED_INCIDENT` (Loss event occurred, observed impact recorded)
   * `0` = `CONFIRMED_BENIGN` (Attack vector mitigated or false alarm verified)
4. **Minimum Sample Safeguard**: If fewer than 15 confirmed samples exist, or if all samples belong to a single class, training is aborted and the system reports `INSUFFICIENT_CONFIRMED_DATA`. The current Champion remains active.

---

### 3. Candidate Model Training & Validation Gates

The candidate model is a regularized L2 Logistic Regression adaptation model trained on standardized organization features:
* `fused_probability` (Output of Fusion v2)
* `p1_nvd`, `p2_epss`, `p3_org`, `p4_mitre`, `p5_meta`, `p6_network`
* `asset_criticality` (1.0 to 10.0 scale)
* `exposure_numeric` (0.05 Air-Gapped, 0.35 Internal, 1.00 Internet-Facing)
* `control_effectiveness` (0.0 to 1.0)
* `incident_history_count`
* `remediation_applied` (0 or 1)
* `impact_scale` (Financial loss in Millions INR)

#### Statistical Governance Gates:
To prevent model degradation or feedback loops, a candidate must pass all validation gates before promotion:
1. **Brier Calibration Gate**: Candidate Brier score must satisfy $Brier_{cand} \le Brier_{champ} + 0.05$. (Brier score measures probability calibration accuracy; lower is better).
2. **ROC-AUC Discriminative Gate**: Candidate ROC-AUC must satisfy $AUC_{cand} \ge \max(0.65, AUC_{champ} - 0.05)$.
3. **Prediction Stability (PSI) Gate**: Prediction PSI between Champion and Candidate must satisfy $PSI < 0.25$ to prevent catastrophic distribution collapse.
4. **F1 / Discriminative Threshold**: Candidate F1 score must remain $\ge 0.50$.

---

### 4. Population Stability Index (PSI) Drift Detection

Drift monitoring runs locally across all input features and predictions against a baseline reference distribution:

$$PSI = \sum_{i=1}^{k} (Actual_i - Expected_i) \times \ln\left(\frac{Actual_i}{Expected_i}\right)$$

* **Adaptive Binning**: Bins adapt to empirical sample sizes to avoid empty bin log blowouts.
* **Laplace Smoothing**: Discrete frequencies use $(count + 0.5) / (N + 0.5k)$.
* **Configurable Drift Thresholds**:
  * $PSI < 0.10$: **`STABLE`** — Normal operational variation.
  * $0.10 \le PSI < 0.25$: **`MONITOR`** — Moderate shift; monitor telemetry before retraining.
  * $PSI \ge 0.25$: **`LEARNING_RECOMMENDED`** — Significant feature/prediction shift; triggers candidate training recommendation.

---

### 5. Hyperledger Fabric Distributed Audit Ledger

Every candidate promotion event is permanently anchored to the Hyperledger Fabric blockchain consortium:
* **Privacy by Design**: No raw training data or model binary weights are placed on-chain.
* **Cryptographic Hashes**: Only metadata, training dataset SHA-256 hash, model artifact SHA-256 hash, validation metrics, approval decision, and timestamp are committed.
* **Immutable Audit Trail**: Enables external regulators and auditors (e.g., CERT-In, RBI Cyber Security Framework, ISO 27001) to verify model lineage and tamper-resistance.

#### Anchored Event Payload Schema:
```json
{
  "event_type": "MODEL_GOVERNANCE_PROMOTION",
  "organization_id": "Hospital A",
  "previous_model_version": "v1.0.0",
  "promoted_candidate_version": "v1.1.0",
  "training_sample_count": 20,
  "dataset_hash": "3f60d7ca9810ca13d03cd0136de276f3...",
  "artifact_hash": "a4acf91d49bb2d86a5a7611e70d5415b...",
  "validation_metrics": {
    "roc_auc": 1.0000,
    "pr_auc": 1.0000,
    "f1": 1.0000,
    "brier_score": 0.0117,
    "ece": 0.1074
  },
  "governance_decision": "APPROVED",
  "approved_by": "CISO_GOVERNANCE_BOARD",
  "fabric_tx_id": "MODEL-AUDIT-545A7E361EB5",
  "timestamp": "2026-09-17T06:30:58.544Z"
}
```

---

### 6. API Endpoints

The engine exposes dedicated endpoints under `/api/learning`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/learning/status` | Current champion, candidate, sample counts, and drift overview. |
| `GET` | `/learning/evidence` | Operational evidence records with confirmation filters. |
| `POST` | `/learning/evidence` | Ingest operational telemetry evidence with SHA-256 deduplication. |
| `POST` | `/learning/confirm-outcome` | Analyst outcome confirmation (`CONFIRMED_INCIDENT` or `CONFIRMED_BENIGN`). |
| `POST` | `/learning/train-candidate` | Train candidate adaptation model on verified evidence ($N \ge 15$). |
| `POST` | `/learning/validate-candidate` | Evaluate Champion vs Candidate governance gates and prediction drift. |
| `POST` | `/learning/promote` | Promote approved candidate to Champion and anchor to Hyperledger Fabric. |
| `GET` | `/learning/models` | Chronological model lineage history with hashes and Fabric TX IDs. |
| `GET` | `/learning/drift` | Feature and prediction PSI drift reports. |
| `POST` | `/learning/seed-demo` | Seed deterministic offline demo evidence (`DEMO-INCIDENT-*`). |

---

### 7. Deterministic Offline Demonstration

To verify end-to-end functionality in an air-gapped test environment:
```powershell
& ".venv_org_risk\Scripts\python.exe" demo_continual_learning.py
```
This script executes:
1. Inspects Baseline Champion `v1.0.0`.
2. Seeds 25 deterministic demo evidence items (`DEMO-INCIDENT-001` to `025`, marked `OFFLINE_DEMO_SEED`).
3. Computes Population Stability Index (PSI) drift.
4. Trains Candidate Model.
5. Evaluates multi-dimensional Governance Gates (ROC-AUC, PR-AUC, Brier score, PSI).
6. Promotes Candidate to Champion.
7. Anchors immutable audit transaction to Hyperledger Fabric.
