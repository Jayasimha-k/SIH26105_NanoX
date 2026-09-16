# Model Data Provenance Document

## SIH 2026 Problem Statement 26105
**Project:** AI-Powered Continuous Cyber Risk Quantification and Investment Optimization Platform  
**Component:** Organization-Level Cybersecurity Risk Machine Learning Model (`models/organization-risk/model.onnx`)

---

## 1. Dataset Identification & Provenance Summary

| Attribute | Specification |
| :--- | :--- |
| **Dataset Identifier** | `sample_organizations.csv` |
| **Primary Generator Script** | `data_generation.py` (Reproducible via Seed = 42) |
| **Data Classification** | **SYNTHETIC** |
| **Original Real-World Records** | 0 (No public empirical dataset pairs complete organization security controls with verified incident loss ground truth) |
| **Generated / Derived Records** | 3,000 total records |
| **Training Records ($N_{train}$)** | 2,400 records (80% holdout split) |
| **Test Records ($N_{test}$)** | 600 records (20% unseen holdout split) |
| **Total Feature Dimensions** | 54 input features (2 categorical, 22 boolean controls, 30 numeric metrics) |
| **Target Variable** | `risk_score` (Continuous float scale: $0.0 \le \text{Score} \le 100.0$) |
| **Derived Target Label** | `risk_level` (Categorical: `Low`, `Moderate`, `High`, `Critical`) |

---

## 2. Generation Methodology

### A. Feature Vector Construction
The 54 feature dimensions were constructed based directly on the **NIST Cybersecurity Framework (CSF) 2.0** core functions:
- **Demographics & Attack Surface (5 features):** `industry`, `organization_size`, `number_of_employees`, `number_of_endpoints`, `number_of_servers`.
- **Identity & Access Management (8 features):** `mfa_coverage`, `privileged_account_mfa`, `privileged_access_management`, `least_privilege_enforced`, `password_policy_score`, `access_review_frequency_days`, `sso_adoption_percentage`.
- **Asset Management & Governance (4 features):** `asset_inventory_coverage`, `asset_discovery_frequency_days`, `data_classification_implemented`, `critical_asset_identification`.
- **Protection & System Hardening (7 features):** `endpoint_protection_coverage`, `encryption_at_rest`, `encryption_in_transit`, `firewall_deployment`, `network_segmentation`, `security_awareness_training`, `secure_configuration_baselines`.
- **Vulnerability & Patch Management (6 features):** `vulnerability_scanning_frequency_days`, `patch_frequency_days`, `average_patch_delay`, `critical_vulnerability_remediation_time`, `penetration_testing_frequency_months`.
- **Detection & Security Operations (7 features):** `siem_deployed`, `security_monitoring`, `soc_coverage_hours`, `edr_coverage`, `log_retention_days`, `automated_alerting`, `mean_time_to_detect`.
- **Incident Response & Recovery (8 features):** `incident_response_plan`, `incident_response_testing`, `dedicated_ir_team`, `offline_backup`, `backup_frequency_hours`, `backup_testing_frequency_months`, `disaster_recovery_plan`, `recovery_time_objective_hours`, `recovery_point_objective_hours`, `mean_time_to_respond`.
- **Third-Party & Threat History (5 features):** `vendor_risk_management`, `third_party_access_controls`, `supply_chain_monitoring`, `previous_incidents_count`, `previous_data_breach`, `ransomware_history`.

### B. Distribution Conditioning
Features are conditionally sampled using size- and sector-stratified statistical distributions:
- **Organization Size Conditioning:** `number_of_employees` is drawn from size-specific log-normal distributions ($Small \sim \text{Lognormal}(3.5, 0.8)$, $Medium \sim \text{Lognormal}(6.5, 0.7)$, $Large \sim \text{Lognormal}(9.2, 0.6)$). Endpoints, servers, and cloud usage scale proportionally.
- **Baseline Maturity Skew:** Sampled using Beta distributions ($\text{Beta}(2.0, 3.5)$ for small orgs, $\text{Beta}(3.0, 3.0)$ for medium, $\text{Beta}(4.0, 2.0)$ for large enterprises).
- **Sector Modifiers:** Financial and energy sectors receive positive maturity shifts ($+0.05 \text{ to } +0.20$), while manufacturing and education receive negative shifts ($-0.05 \text{ to } -0.18$).

---

## 3. Target Variable Provenance (`risk_score`)

### Target Formulation
The target `risk_score` represents the **quantified overall organizational cybersecurity risk posture** on an indexed scale from $0.0$ (maximum security posture) to $100.0$ (critical exposure).

The ground truth was generated mathematically via:
$$\text{risk\_score} = \text{clip}\left(\text{BaselineRisk}(\mathbf{x}) + \mathcal{N}(0, \sigma^2) + \Delta_{industry} + \Delta_{size}, 0.0, 100.0\right)$$

Where:
1. $\text{BaselineRisk}(\mathbf{x})$ is the weighted composite risk across the 8 NIST CSF 2.0 categories calculated by [`baseline_risk_engine.py`](file:///c:/Users/Kishanraj/SIH26105/SIH26105_NanoX/baseline_risk_engine.py).
2. $\mathcal{N}(0, \sigma^2)$ is Gaussian measurement noise ($\sigma = 2.5$) injected to simulate assessment variance and prevent perfect deterministic collinearity.
3. $\Delta_{industry}$ and $\Delta_{size}$ are empirical risk calibration offsets informed by the **Verizon Data Breach Investigations Report (DBIR) / VERIS Community Database (VCDB)** breach incidence rates.

### Target Classification
- The target values were **neither manually labeled by human annotators nor scraped from real breach databases**.
- They were **generated mathematically** using a calibrated, weighted NIST CSF 2.0 scoring formulation.
- Consequently, the ML model functions as a **methodology-derived scoring surrogate** that efficiently approximates the complex multi-dimensional risk equation.

---

## 4. Scientific Boundary & Disclosure for Judges

> [!WARNING]
> **Scientific Disclosure for SIH Evaluators**:
> The training data is **100% SYNTHETIC**. The high model fidelity ($R^2 = 0.9864$) proves that the machine learning algorithm has converged on the underlying mathematical scoring methodology with high precision. It **does NOT constitute empirical proof of predicting real-world corporate data breaches**, which would require proprietary historical loss data that is legally protected and unavailable in public domains.
