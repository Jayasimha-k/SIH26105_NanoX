# Model Card: Organization Cyber Risk Quantification Model

## Model Overview
- **Model Name:** `organization-risk`
- **Version:** `0.1.0`
- **Architecture:** Ridge Linear Baseline & Tree Ensembles (Random Forest, Gradient Boosting, HistGradientBoosting, XGBoost) exported to portable ONNX Runtime binary (`model.onnx`).
- **Task:** Enterprise Cybersecurity Posture Assessment & Risk Score Quantification (0–100 scale).
- **Deployment Mode:** 100% Offline (air-gapped, zero external internet, zero cloud APIs, zero LLMs required).
- **Framework Alignment:** NIST Cybersecurity Framework (CSF) 2.0 & NIST SP 1301 Organizational Profiles.

---

## Data Classification & Provenance Audit
All data used within the platform is strictly categorized:

| Dataset Component | Classification | Provenance & Validation |
| :--- | :---: | :--- |
| **Organization Posture Training Set** | `SYNTHETIC` | 3,000 synthetic organization profiles generated via `data_generation.py`. Distributions calibrated against VERIS Community Database (VCDB) breach metrics across 8 sectors and 3 size tiers. Explicitly tagged `data_source = "SYNTHETIC"`. |
| **Vulnerability Repository** | `REAL` | 15 real, verified CVE records (e.g., CVE-2021-34473, CVE-2024-3094, CVE-2021-44228) extracted from NIST NVD and CISA KEV catalogs, cached locally in `data/threats/vulnerabilities.json`. |
| **CISA KEV Catalog** | `REAL` | 12 real CISA Known Exploited Vulnerability entries cached locally in `data/threats/cisa_kev.json`. |
| **Threat Events Database** | `REAL` | Historical nation-state and ransomware campaign events cached locally in `data/threats/threat_events.json`. |
| **Continuous Simulation Feed** | `DERIVED_SIMULATION` | Sequential simulation scenarios for the air-gapped demo, explicitly tagged with `DEMO-THREAT-*` identifiers in `data/threats/demo_threat_feed.json`. |

---

## Metric Audit: Why $R^2 = 0.9864$?
> [!IMPORTANT]
> **Audit Disclosure on High $R^2$**:
> The model achieves $R^2 = 0.9864$ (Holdout MAE: 2.305, RMSE: 2.952) because it was trained on synthetic data generated via calibrated NIST CSF 2.0 equations. The machine learning model is effectively learning the underlying continuous non-linear scoring function.
> **Real-World Expectation**: In real enterprise environments where posture surveys and telemetry contain subjective human error, missing values, and noise, real-world regression $R^2$ will typically range between 0.70 and 0.85. The high prototype score validates algorithmic fidelity and convergence, not real-world telemetry noise immunity.

---

## Model Evaluation Metrics (Holdout Test on 600 Unseen Samples)
- **Mean Absolute Error (MAE):** `2.305` points (on 0–100 scale)
- **Root Mean Squared Error (RMSE):** `2.952` points
- **Coefficient of Determination ($R^2$):** `0.9864`
- **Risk Level Classification Accuracy:** `93.07%` (Low, Moderate, High, Critical)

---

## Configurable Risk Weights & Level Thresholds
Configured in `config/risk_weights.json` based on empirical breach root causes:
- **Identity & Access Management:** 20% (Credential compromise drives >50% of initial access)
- **Vulnerability Management:** 18% (Exploit dwell time drives ransomware entry)
- **Protection & Segmentation:** 15% (Limits blast radius and lateral movement)
- **Detection & SIEM:** 15% (Halts dwell time before data exfiltration)
- **Recovery & Backups:** 14% (Air-gapped immutable backup prevents extortion loss)
- **Incident Response:** 10% (Reduces containment time and business outage)
- **Third-Party & Vendor Risk:** 5% (Restricts supply chain ingress)
- **Asset Discovery:** 3% (Eliminates unmanaged shadow IT)

### Risk Level Bands:
- **Low Risk:** $0.0 \le \text{Score} < 25.0$
- **Moderate Risk:** $25.0 \le \text{Score} < 50.0$
- **High Risk:** $50.0 \le \text{Score} < 75.0$
- **Critical Risk:** $75.0 \le \text{Score} \le 100.0$

---

## Cryptographic Blockchain Ledger & Verification
- **Cryptographic Standard:** SHA-256 block chaining (`block_hash`, `previous_hash`, `payload`).
- **Audit Limitation Notice:** Storing the blockchain inside SQLite does not guarantee physical file immutability if the database file itself is rewritten.
- **External Trust Anchor:** A separate out-of-band anchor file (`blockchain/trusted_root_anchor.json`) establishes genesis ground truth.
- **Verification Engine:** An independent verification function traverses all blocks to detect any modification of past risk records, immediately flagging `INTEGRITY VIOLATION ⚠`.

---

## Deterministic Explainability (Zero LLM)
Natural-language explanations are produced deterministically via structured templates in `explainer.py`. No remote calls to OpenAI, Claude, or Gemini are made. All reasoning is verifiable and reproducible.
