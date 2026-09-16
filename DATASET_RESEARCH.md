# Cybersecurity Dataset Research & Availability Analysis
**Project:** SIH 2026 — Problem Statement 26105: AI-Powered Continuous Cyber Risk Quantification & Investment Optimization Platform  
**Component:** Organization-Level Cyber Risk Assessment ML Prototype  
**Date:** September 2026  

---

## Executive Summary

To build an organization-level cyber risk quantification model, we conducted a rigorous investigation across government repositories, academic databases, Hugging Face, Kaggle, and open-source breach databases. 

Our investigation confirms a critical finding in cybersecurity data science: **No publicly downloadable dataset exists that contains complete organization-level security posture features (e.g., MFA coverage %, patch delay days, EDR adoption) paired with empirical ground-truth risk loss labels.**

While security incident databases (such as VERIS/VCDB) contain thousands of breach records, they record *incidents* rather than whole-organization security posture metrics. Conversely, cybersecurity frameworks and survey tools (such as NIST CSCS and NIST SP 1301) provide questionnaires and posture schemas, but their underlying raw response databases are strictly confidential and NOT publicly downloadable.

To solve this without fabricating dataset availability or making unsupported claims, we adopt a **Defensible Hybrid Architecture**:
1. **Posture Schema:** Derived directly from **NIST CSF 2.0 / NIST SP 1301** and **NIST CSCS**.
2. **Likelihood & Impact Parameters:** Calibrated using empirical incident parameters from **VERIS Community Database (VCDB)**.
3. **Transparent Baseline Engine:** Expert-derived NIST CSF domain weighting model.
4. **Reproducible Synthetic Generation:** Generating synthetic enterprise posture profiles explicitly marked with `data_source = "SYNTHETIC"`.
5. **Offline ML & ONNX Plugin:** Multi-model training (Random Forest, Gradient Boosting, XGBoost) exported to **ONNX Runtime** for zero-cloud offline deployment.

---

## 1. Detailed Investigation of Searched Sources

### 1. NIST Cyber Supply Chain Survey (CSCS) Tool
- **URL:** [https://csrc.nist.gov/Projects/cybersecurity-risk-analytics/cscs-tool](https://csrc.nist.gov/Projects/cybersecurity-risk-analytics/cscs-tool)
- **Questionnaire Available:** Yes. Organizations can download the complete questionnaire (in PDF/online format) to gather information across cybersecurity supply chain categories.
- **Extractable Features:** Third-party access controls, vendor risk assessment frequency, supply chain monitoring, software bill of materials (SBOM), software integrity checking.
- **Publicly Downloadable Raw Data:** **NO.** Entries are anonymized and retained internally by NIST for internal research and survey refinement. NIST does not provide a downloadable public ML training dataset.
- **CSF Categories Represented:** ID.SC (Supply Chain Risk Management), PR.DS (Data Security), PR.AC (Access Control), GOVERN (C-SCRM Governance).
- **Licensing/Usage:** NIST public domain guidance. Questionnaire methodology can be freely used to structure our organization feature schema.

### 2. NIST Organizational Profiles / CSF 2.0 (NIST SP 1301)
- **URL:** [https://csrc.nist.gov/pubs/sp/1301/final](https://csrc.nist.gov/pubs/sp/1301/final)
- **Purpose:** Guidelines for creating Current Posture vs. Target Posture profiles across NIST CSF 2.0 functions (GOVERN, IDENTIFY, PROTECT, DETECT, RESPOND, RECOVER).
- **Extractable Schema:** Defines organizational dimensions including Asset Management, Identity Governance, Vulnerability Remediation SLAs, Detection Coverage, Incident Response Readiness, and Recovery Capabilities.
- **Downloadable ML Dataset:** N/A (Standard specification document, not a tabular dataset).

### 3. NIST Cyber Incident Data Analysis Repository (CIDAR)
- **URL:** [https://csrc.nist.gov/Projects/cybersecurity-risk-analytics/cidar](https://csrc.nist.gov/Projects/cybersecurity-risk-analytics/cidar)
- **Purpose:** Proof-of-concept research repository where organizations anonymously share incident data for aggregated statistical analytics.
- **Publicly Downloadable Raw Data:** **NO.** CIDAR provides a downloadable User Guide and Survey Questionnaire, but raw underlying enterprise incident/posture data is protected under anonymization and NOT downloadable.
- **ML Utility:** Useful for understanding survey question formatting and incident parameter categorization, but cannot be downloaded for direct model training.

### 4. VERIS Community Database (VCDB)
- **URL:** [https://verisframework.org/vcdb.html](https://verisframework.org/vcdb.html) / [https://github.com/vz-risk/VCDB](https://github.com/vz-risk/VCDB)
- **Record Count:** Over 10,000+ publicly disclosed security breach records with >2,500 schema variables.
- **Organization Info:** Industry (NAICS code), organization size (small/large employee count tiers), geographic location.
- **Incident Characteristics:** Threat Actor (Internal/External), Action (Malware, Hacking, Social/Phishing, Misconfiguration), Asset (Server, Database, Endpoint), Attribute (Confidentiality, Integrity, Availability), Impact (Financial Loss, Records Stolen).
- **Download Format & License:** JSON / CSV on GitHub (`vz-risk/VCDB`), Creative Commons Attribution-NonCommercial-ShareAlike 4.0 (CC BY-NC-SA 4.0).
- **Crucial Distinction:** **VCDB is an INCIDENT dataset, NOT an organization-posture dataset.** It records breach events that happened, but does not capture non-breached organizations or internal security control percentages (e.g. MFA coverage %, patch delay days). Therefore, VCDB cannot be used directly as a supervised training dataset for posture scoring, but serves as **supporting empirical evidence for likelihood and financial impact modeling.**

### 5. Hugging Face Datasets
- **Search Terms:** `enterprise cybersecurity`, `organizational risk`, `security posture`, `cis controls`.
- **Found Resources:** `AYI-NEDJIMI/cis-controls-en`, `AYI-NEDJIMI/iso27001-en`, `Rowden/CybersecurityQAA`, `ethanolivertroy/nist-cybersecurity-training`.
- **Dataset Types:** Compliance text, standard safeguard definitions (CIS Controls v8, ISO 27001:2022), Q&A assertion pairs.
- **ML Utility:** Excellent for text framing, NLP, or security control taxonomy, but contain NO tabular numerical training datasets of enterprise risk scores.

### 6. Kaggle Datasets
- **Search Terms:** `cybersecurity risk assessment`, `security posture`, `cybersecurity maturity`.
- **Found Resources:** Network traffic logs (NSL-KDD, CICIDS2017), Hardware profiling datasets (`AI-based-technical-device-asset-profiling-Dataset` containing synthetic device patch compliance).
- **ML Utility:** Useful for asset-level synthetic distribution modeling, but lack organization-level posture vs ground-truth loss metrics.

### 7. Academic & Research Repositories (Zenodo, IEEE, ACM, GitHub)
- **Search Terms:** `organizational cyber risk dataset`, `enterprise security posture machine learning`.
- **Findings:** Academic papers present theoretical FAIR or NIST CSF scoring formulas, but explicitly acknowledge that empirical enterprise security posture datasets remain proprietary to commercial Cyber Risk Quantification (CRQ) vendors (e.g. BitSight, SecurityScorecard, Panorays) and are not publicly shared due to severe confidentiality risks.

---

## 2. Comprehensive Dataset Comparison Matrix

| Dataset / Source | Type | Organization-Level? | Records | Key Features | Labels / Outcomes | Real / Synthetic | License | Publicly Downloadable? | Use Classification |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| **NIST CSCS Tool** | Survey Questionnaire | Yes | N/A (Internal) | Supply chain risk, vendor assessment, SBOM, software integrity | Internal score | Questionnaire | Public Domain | **No** (Survey only) | **C. Feature/Schema Design** |
| **NIST SP 1301 (CSF 2.0)** | Framework Standard | Yes | N/A | Current vs Target Profiles, CSF Functions (Govern, Identify, Protect, Detect, Respond, Recover) | N/A | Guideline | Public Domain | **Yes** (PDF spec) | **C. Feature/Schema Design** |
| **NIST CIDAR** | Research Portal | Yes / Incident | N/A (Internal) | Incident reporting fields, threat types, loss categories | Aggregate charts | Real (Protected) | Public Domain | **No** (Guide only) | **C. Feature/Schema Design** |
| **VERIS / VCDB** | Incident Database | Incident-Level | 10,000+ | Actor, Action, Asset, Attribute, Impact, Industry, Size Tier | Breach event occurred, Record count, Loss | Real | CC BY-NC-SA 4.0 | **Yes** (JSON/GitHub) | **B. Supporting Evidence** |
| **Hugging Face CIS/ISO** | NLP / Compliance | Control-Level | ~150-1,500 | CIS v8 Safeguards, ISO 27001 Annex A controls, Q&A assertions | Control descriptions | Real / Text | Open / CC | **Yes** | **C. Feature/Schema Design** |
| **Kaggle Hardware Profile**| Device Profiling | Asset-Level | 50,000 | TPM status, Secure Boot, patch compliance, device criticality | Hardware Risk | Synthetic | CC0 | **Yes** | **B. Supporting Evidence** |
| **SIH 2026 Synthetic Set** | Enterprise Posture | Yes | 2,500 | 40+ Posture Indicators across 9 NIST categories | Baseline Risk Score, Risk Level | Synthetic (VCDB-calibrated)| Open | **Generated** | **A. Directly Usable** |

---

## 3. Dataset Classification & Selection Rationale

### Classification Categories:
- **Category A: Directly Usable for Posture ML Model Training**
  - **SIH 2026 Synthetic Enterprise Posture Dataset:** Synthesized explicitly for this project using NIST CSF 2.0 feature definitions and VCDB impact distributions. Clearly labeled `data_source = "SYNTHETIC"`.
- **Category B: Useful as Supporting Data**
  - **VERIS Community Database (VCDB):** Provides real-world empirical distributions for threat action likelihood and breach financial impact.
  - **Kaggle Hardware Profiling Dataset:** Informs realistic asset patch compliance and device vulnerability distributions.
- **Category C: Useful for Schema / Feature / Weight Design**
  - **NIST CSCS Questionnaire & NIST SP 1301 (CSF 2.0):** Form the authoritative architectural foundation for our 40+ posture feature schema and category weighting logic.
  - **Hugging Face CIS Controls & ISO 27001 Datasets:** Provide standard control descriptions and recommended mitigation frameworks.
- **Category D: Not Suitable for Organization Risk Training**
  - Network Intrusion Datasets (e.g. KDD-99, NSL-KDD, CICIDS2017): Packet-level and flow-level network logs, not organization-level risk posture assessments.

---

## 4. Answers to Mandatory First Task Questions (A – F)

### A. What real organization-level datasets are actually available?
- **NIST CSCS Survey** and **NIST CIDAR** provide organizational assessment questionnaires.
- **NIST SP 1301** provides CSF 2.0 organizational profile structures.
- **VERIS / VCDB** provides organization breach incident records (containing industry sector and employee size tiers).

### B. Which ones can actually be downloaded?
- **Downloadable:** VCDB (JSON on GitHub), NIST SP 1301 PDF guidance, Hugging Face CIS/ISO datasets, Kaggle asset profiling CSVs.
- **NOT Downloadable:** Raw response data from NIST CSCS and NIST CIDAR (retained internally by NIST for confidentiality).

### C. What features and labels do they contain?
- **NIST CSCS / SP 1301:** Posture questions (MFA, Patching, Encryption, IR plans, Vendor risk). No public labels.
- **VCDB:** Threat actor, action, affected asset, data loss category, industry, employee size tier. Label = Breach occurred (1).

### D. Which dataset should we use?
We use **NIST SP 1301 / CSCS** to construct our `organization_schema.json`, **VCDB** to calibrate empirical loss/likelihood parameters, and generate a **VCDB-calibrated Synthetic Enterprise Dataset** for training our machine learning models.

### E. If no adequate labeled organization dataset exists, explain exactly why.
1. **Confidentiality & Trade Secrets:** Disclosing detailed internal security controls (e.g., "30% MFA coverage, 90-day patch delay") exposes organizations to immediate cyberattacks.
2. **Legal & Financial Liability:** Publicly linking internal posture gaps to financial losses damages stock price and triggers regulatory penalties.
3. **Severe Reporting Bias:** Public breach registries (VCDB) only document victims of public security failures, omitting negative samples (organizations with similar postures that avoided or thwarted attacks).

### F. Propose the minimum defensible hybrid/synthetic approach.
1. Define a 40+ indicator posture schema derived from NIST CSF 2.0.
2. Build a transparent baseline scoring engine using configurable NIST domain weights.
3. Generate reproducible synthetic enterprise profiles calibrated against VCDB loss ranges.
4. Mark all synthetic records explicitly with `data_source = "SYNTHETIC"`.
5. Train scikit-learn / XGBoost regressors and classifiers, exporting the model to **ONNX** for 100% offline inference.
