# Scientific Model Validation & Audit Report

## SIH 2026 Problem Statement 26105
**Project:** AI-Powered Continuous Cyber Risk Quantification and Investment Optimization Platform  
**Component:** Organization Cyber Risk Machine Learning Model (`models/organization-risk/model.onnx`)  
**Audit Date:** 2026-09-16  
**Audited Artifacts:** `sample_organizations.csv`, `train.py`, `models/organization-risk/model_pipeline.pkl`, `model.onnx`

---

## Executive Summary
This audit rigorously evaluates the scientific validity, data provenance, potential data leakage, cross-validation metrics, baseline comparisons, and classification performance of the Organization Cyber Risk Model.

```
+-------------------------------------------------------------------------------+
| FINAL AUDIT VERDICT:                                                          |
| MODEL STATUS: METHODOLOGY-DERIVED SCORING SURROGATE / SYNTHETIC-DATA PROTOTYPE|
| INTEGRATION STATUS: SAFE TO PROCEED INTO FULL MULTI-LAYER ARCHITECTURE       |
+-------------------------------------------------------------------------------+
```

---

## 1. Dataset Provenance
- **Dataset Source:** `sample_organizations.csv` generated via `data_generation.py`.
- **Classification:** **100% SYNTHETIC**.
- **Sample Count:** 3,000 total organization records.
- **Deduplication Audit:** Exact duplicate feature vectors across the dataset = **0 (0.00%)**.
- **Calibration Anchors:** Attribute distributions and loss dwell metrics calibrated against the **VERIS Community Database (VCDB)** and **NIST CSF 2.0** profiles across 8 industry sectors and 3 organizational size tiers.

---

## 2. Feature Provenance
- **Total Input Features:** 54 dimensions.
- **Categorical (2):** `industry` (8 classes), `organization_size` (3 classes).
- **Boolean Security Controls (22):** `offline_backup`, `privileged_account_mfa`, `privileged_access_management`, `least_privilege_enforced`, `data_classification_implemented`, `critical_asset_identification`, `firewall_deployment`, `network_segmentation`, `security_awareness_training`, `secure_configuration_baselines`, `siem_deployed`, `security_monitoring`, `automated_alerting`, `incident_response_plan`, `incident_response_testing`, `dedicated_ir_team`, `disaster_recovery_plan`, `vendor_risk_management`, `third_party_access_controls`, `supply_chain_monitoring`, `previous_data_breach`, `ransomware_history`.
- **Numerical Operational Metrics (30):** Continuous metrics representing employee count, endpoint density, patch delays, MFA coverage, scanning intervals, and recovery time objectives.

---

## 3. Target Variable Provenance (`risk_score`)
- **Nature of Target:** The continuous metric `risk_score` ($0.0 \le \text{Score} \le 100.0$) was **generated mathematically** through a calibrated weighted scoring formulation representing organizational vulnerability exposure, supplemented with Gaussian variance ($\sigma = 2.5$).
- **No Human Labelling:** Target values were not manually assigned or sourced from confidential enterprise breach insurance payout logs.

---

## 4. Train / Test Methodology & Leakage Audit

### A. Split Verification
- **Split Ratio:** 80% Training ($N_{train} = 2,400$), 20% Holdout Testing ($N_{test} = 600$).
- **Partitioning Strategy:** Random shuffle split with Seed = 42.
- **Cross-Split Overlap Audit:** Overlapping identical feature vectors between Train and Test = **0**.
- **Preprocessing Isolation:** `OneHotEncoder` and `StandardScaler` transformations within the `ColumnTransformer` were strictly fitted on the training split only during cross-validation folds and holdout evaluation, preventing out-of-sample data leakage.

### B. Leakage Assessment
- **Feature-Target Coupling:** The target `risk_score` was constructed from an equation that takes the same security control indicators (MFA, patching delay, backups) as inputs.
- **Audit Finding:** Because the model inputs are the constituent variables of the target generation equation, the machine learning model is learning an approximation of this methodology.
- **Scientific Implication:** This is **not a real-world predictive breach predictor**, but rather an **extremely high-fidelity, computationally efficient scoring surrogate**. Presenting it as a real-world breach forecasting model would be scientifically dishonest; presenting it as an offline, explainable posture scoring surrogate is scientifically sound and valid.

---

## 5. Cross-Validation Performance (5-Fold CV on 2,400 Training Samples)

All 5 folds were evaluated independently using `KFold(n_splits=5, shuffle=True, random_state=42)`:

| Metric | Fold 1 | Fold 2 | Fold 3 | Fold 4 | Fold 5 | Mean $\pm$ Std Dev |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Test $R^2$** | 0.9855 | 0.9849 | 0.9866 | 0.9855 | 0.9881 | **$0.9861 \pm 0.0011$** |
| **Test MAE** | 2.363 | 2.344 | 2.363 | 2.364 | 2.261 | **$2.339 \pm 0.039$** |
| **Test RMSE** | 2.957 | 2.970 | 3.066 | 3.032 | 2.879 | **$2.981 \pm 0.065$** |
| **Train $R^2$** | 0.9873 | 0.9875 | 0.9871 | 0.9873 | 0.9867 | **$0.9872 \pm 0.0003$** |

### Train-Test Generalization Gap
$$\text{Gap} = \text{Train } R^2 - \text{Test } R^2 = 0.9872 - 0.9861 = \mathbf{0.0011}$$
The near-zero generalization gap confirms that the model does not suffer from variance overfitting or fold instability on the generating distribution.

---

## 6. Benchmark Comparison Against Simple Baselines

Evaluated on the completely unseen holdout test set ($N_{test} = 600$):

| Model / Benchmark | MAE | RMSE | $R^2$ | Relative RMSE Reduction |
| :--- | :---: | :---: | :---: | :---: |
| **1. Dummy Mean Predictor** | 21.444 | 25.317 | -0.0010 | Baseline (0.0%) |
| **2. Deterministic Rule Engine** | 2.922 | 4.516 | 0.9681 | 82.2% over Mean |
| **3. Trained ML Pipeline (Ridge)** | **2.305** | **2.952** | **0.9864** | **88.3% over Mean (34.6% over Rule)** |

### Utility Assessment
The ML Pipeline achieves a **34.6% reduction in RMSE** compared to the uncalibrated deterministic rule engine, successfully capturing non-linear size and industry scaling adjustments.

---

## 7. Categorical Classification Metrics (Risk Bands)

The continuous `risk_score` predictions were mapped to standard SIH / NIST risk categories:
- `Low`: $[0.0, 25.0)$
- `Moderate`: $[25.0, 50.0)$
- `High`: $[50.0, 75.0)$
- `Critical`: $[75.0, 100.0]$

### Multi-Class Performance Summary ($N_{test} = 600$)
- **Overall Accuracy:** **95.67%**
- **Balanced Accuracy:** **95.63%**

| Category | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| **Low** | 0.9529 | 0.9529 | 0.9529 | 85 |
| **Moderate** | 0.9719 | 0.9611 | 0.9665 | 180 |
| **High** | 0.9508 | 0.9508 | 0.9508 | 183 |
| **Critical** | 0.9481 | 0.9605 | 0.9542 | 152 |
| **Macro Average** | **0.9559** | **0.9563** | **0.9561** | **600** |

### Confusion Matrix

```
                Predicted ->
Actual       | Low      | Moderate | High     | Critical | Total
-------------+----------+----------+----------+----------+-------
Low          | 81       | 4        | 0        | 0        | 85
Moderate     | 4        | 173      | 3        | 0        | 180
High         | 0        | 1        | 174      | 8        | 183
Critical     | 0        | 0        | 6        | 146      | 152
-------------+----------+----------+----------+----------+-------
Total        | 85       | 178      | 183      | 154      | 600
```

> **Key Reliability Finding:**
> 100% of prediction errors occurred strictly between **adjacent severity tiers** (e.g. 4 Low instances predicted as Moderate, 6 Critical instances predicted as High near the 75.0 boundary). There were **zero catastrophic misclassifications** (e.g., no Critical risk organization was ever misclassified as Low or Moderate).

---

## 8. Architectural Layer Separation

To ensure the model is not overloaded or misrepresented, the platform implements strict separation of responsibilities across three independent layers:

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1: Organization ML Model (models/organization-risk/)   │
│ - Portable ONNX pipeline assessing whole-organization       │
│   cybersecurity posture baseline (0–100 scale).             │
│ - Independent of external assets and threats.               │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 2: Dynamic Threat + Asset Risk Engine                 │
│ - Correlates local threat records against asset inventory.  │
│ - Evaluates exposure (Internet-Facing vs Internal),         │
│   vulnerability weaponization (CVSS, EPSS, CISA KEV),       │
│   and asset criticality (1.0–10.0).                         │
│ - Dynamically recalculates composite risk.                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 3: Investment Optimization & Blockchain Audit         │
│ - 0-1 Knapsack budget optimizer allocating capital controls.│
│ - SHA-256 blockchain ledger with out-of-band anchor.       │
│ - Dynamic risk timeline reassessment upon remediation.      │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Model Limitations

1. **Synthetic Training Distribution:** The model was trained on synthetic data generated from calibrated NIST CSF 2.0 distributions. It should not be presented to judges as an empirical insurance actuarial model.
2. **Tabular Assessment Granularity:** Inputs represent survey-level control statuses and operational metrics rather than live packet-level telemetry.
3. **Threshold Sensitivity:** Misclassifications are localized around category boundaries (24.5–25.5, 49.5–50.5, 74.5–75.5 points).

---

## 10. Correct Description of What the Model Proves

- **What it PROVES:**
  1. The machine learning architecture accurately models multi-variable cybersecurity posture relationships across 54 features with an $R^2$ of 0.9861 and MAE of 2.339 points.
  2. The pipeline can be exported to an air-gapped ONNX binary and run deterministically on any offline laptop in under 5 milliseconds.
  3. The model serves as a reliable, explainable scoring surrogate for evaluating baseline organizational resilience.
- **What it DOES NOT PROVE:**
  1. It does not prove that real-world breach likelihoods follow this exact probability distribution in live corporate networks.
  2. It does not replace real-time asset-level threat correlation (which is handled by Layer 2).

---

## Final Audit Determination

```
================================================================================
MODEL CLASSIFICATION:
  >> METHODOLOGY-DERIVED SCORING SURROGATE / SYNTHETIC-DATA PROTOTYPE
================================================================================

INTEGRATION SAFETY DECISION:
  >> SAFE TO PROCEED WITH INTEGRATION.
  
The model is scientifically sound, free of data leakage across train/test splits,
exhibits 95.67% classification accuracy, and cleanly interfaces with Layer 2
(Threat-Asset Correlation) and Layer 3 (Investment Optimization & Blockchain).
================================================================================
```
