# Production Model Integration Contract & Discovered Schema
## SIH 2026 Problem Statement 26105: AI-Powered Continuous Cyber Risk Quantification & Investment Optimization Platform

---

## Overview

This contract documents the exact discovered schemas, input features, data types, and output contracts for the 5 production XGBoost machine learning model artifacts located in `CyberOptRQ_Production_Models`.

---

## 1. Discovered Artifact Inventory

| Model Name | Artifact Relative Path | Format | Model Class | Feature Count |
| :--- | :--- | :--- | :--- | :--- |
| **Model 1 (P1)** | `CyberOptRQ_Production_Models/Model_1/CyberOptRQ_Model1_FINAL_XGBoost.pkl` | Pickle (`.pkl`) | `xgboost.sklearn.XGBClassifier` | 26 Features |
| **Model 2 (P2)** | `CyberOptRQ_Production_Models/Model_2/CyberOptRQ_Model2_XGBoost.pkl` | Pickle (`.pkl`) | `xgboost.sklearn.XGBClassifier` | 15 Features |
| **Model 3 (P3)** | `CyberOptRQ_Production_Models/Model_3/CyberOptRQ_Model3_XGBoost.pkl` | Pickle (`.pkl`) | `xgboost.sklearn.XGBClassifier` | 12 Features |
| **Model 4 (P4)** | `CyberOptRQ_Production_Models/Model_4/CyberOptRQ_Model4_XGBoost.pkl` | Pickle (`.pkl`) | `xgboost.sklearn.XGBClassifier` | 47 Features |
| **Model 5 (Meta)** | `CyberOptRQ_Production_Models/Model_5/CyberOptRQ_Meta_XGBoost_FINAL_4INPUT.pkl` | Pickle (`.pkl`) | `xgboost.sklearn.XGBClassifier` | 4 Features |

---

## 2. Discovered Pipeline Flow

```
                      Raw Vulnerability / CVE / CVSS Data
                                       |
          +----------------------------+----------------------------+
          |                            |                            |
          v                            v                            v
  Model 1 (P1: NVD/CVE)       Model 2 (P2: EPSS Threat)   Model 4 (P4: ATT&CK Vector)
   [26 Input Features]         [15 Input Features]          [47 One-Hot Features]
          |                            |                            |
          +----------------------------+----------------------------+
                                       |
                                       v (P1 float output)
                              Model 3 (P3: Org Posture)
                               [12 Input Features]
                                       |
          +----------------------------+----------------------------+
          | (P1)                       | (P2)                       | (P3)                       | (P4)
          v                            v                            v                            v
                                  Model 5 (Meta Model)
                                  [4 Inputs: P1, P2, P3, P4]
                                       |
                                       v P5 Meta Output (Float 0.0 - 1.0)
                        Organization-Specific Risk Model
                                       |
                                       v Final Risk Score & EAL
                        Knapsack Investment Optimizer
                                       |
                                       v
                     Hyperledger Fabric Audit Transaction
```

---

## 3. Detailed Model Contracts

### P1 (Model 1): NVD / CVE Vulnerability Exploitation Model
- **Input Features (26)**:
  `cvss_base_score` (float), `cvss_exploitability_score` (float), `cvss_impact_score` (float), `vendor_count` (int), `product_count` (int), `reference_count` (int), `cve_tag_count` (int), `publication_year` (int), `cwe_count` (int), `cwe_noinfo` (int), `cwe_other` (int), `cwe_multiple` (int), `cwe_missing` (int), `vendor_missing` (int), `product_missing` (int), `cvss_missing` (int), `cvss_attack_vector` (category), `cvss_attack_complexity` (category), `cvss_privileges_required` (category), `cvss_user_interaction` (category), `cvss_scope` (category), `confidentiality_impact` (category), `integrity_impact` (category), `availability_impact` (category), `cvss_severity` (category), `cwe_primary` (category).
- **Processing Requirement**: Categorical string columns must be explicitly cast to pandas `category` dtype before inference.
- **Output Contract**: Class 1 probability `predict_proba(df1)[0, 1]` \(\in [0.0, 1.0]\) representing P1 vulnerability exploitation likelihood.

### P2 (Model 2): EPSS-Style Exploitation Risk Model
- **Input Features (15)**:
  `cvss_base_score` (float), `cvss_exploitability_score` (float), `cvss_impact_score` (float), `vendor_count` (int), `product_count` (int), `reference_count` (int), `cve_tag_count` (int), `cvss_attack_vector_encoded` (float), `cvss_attack_complexity_encoded` (float), `cvss_privileges_required_encoded` (float), `cvss_user_interaction_encoded` (float), `cvss_scope_encoded` (float), `confidentiality_impact_encoded` (float), `integrity_impact_encoded` (float), `availability_impact_encoded` (float).
- **Output Contract**: Class 1 probability `predict_proba(df2)[0, 1]` \(\in [0.0, 1.0]\) representing P2 EPSS threat score.

### P3 (Model 3): Organization-Aware Cyber Risk Model
- **Input Features (12)**:
  `xgb1_oof_probability` (float - P1 output), `epss` (float), `asset_criticality` (int/float), `internet_exposed` (int 0/1), `asset_count_affected` (int), `patch_status` (int), `control_strength` (int), `edr_coverage` (float), `mfa_coverage` (float), `privilege_exposure` (int), `historical_incidents` (int), `business_impact` (int).
- **Output Contract**: Class 1 probability `predict_proba(df3)[0, 1]` \(\in [0.0, 1.0]\) representing P3 organization exposure posture.

### P4 (Model 4): ATT&CK-Oriented Prototype Model
- **Input Features (47)**:
  Numeric scores (`cvss_base_score`, `cvss_exploitability_score`, `cvss_impact_score`, `vendor_count`, `product_count`, `reference_count`, `cve_tag_count`, `publication_year`) plus 39 binary one-hot encoded flags for attack vectors, complexity, privileges required, user interaction, scope, confidentiality/integrity/availability impact, and severity levels.
- **Output Contract**: Class 1 probability `predict_proba(df4)[0, 1]` \(\in [0.0, 1.0]\) representing P4 technique threat level.

### Model 5 (Meta Model): Stacking Ensemble Meta-Classifier
- **Input Features (4)**:
  `['P1', 'P2', 'P3', 'P4']` (where P1, P2, P3, P4 are float probabilities between 0.0 and 1.0 output by Models 1-4).
- **Output Contract**: Class 1 probability `predict_proba(df5)[0, 1]` \(\in [0.0, 1.0]\) representing P5 Meta Model exploitation probability.

---

## 4. Organization-Specific Adaptation Connection

The P5 Meta Model output connects directly to the `OrganizationSpecificRiskModel` adaptation engine:
\[
P_{\text{org\_adapted}} = P_{\text{meta}} \times \text{Exposure\_Factor} \times \left(\frac{\text{Asset\_Criticality}}{5.0}\right)^{0.5} \times \left(1.0 + 0.05 \times \min(\text{Incidents}, 5)\right)
\]
This produces the final enterprise exploitation probability fed into the Expected Annual Loss (EAL) engine and Knapsack investment optimizer.
