# Model Card: CyberOptRQ_P6_CIC2017_XGBoost_v1

## Model Details
- **Model Name:** `CyberOptRQ_P6_CIC2017_XGBoost_v1`
- **Model Family:** P6 Empirical Network Behavioral Evidence Model
- **Architecture:** Extreme Gradient Boosting (`xgboost.XGBClassifier`) with histogram-based split finding (`tree_method='hist'`)
- **Version:** `1.0.0`
- **Release Date:** September 2026
- **License:** Proprietary / SIH 2026 Nano X Evaluation
- **Developers:** Team Nano X (SIH 2026 Problem Statement 26105)
- **Target Output:** Flow maliciousness probability $P(\text{Malicious Flow}) \in [0.0, 1.0]$

---

## Intended Use & Scope
- **Primary Objective:** Provide empirical, network-level operational evidence to augment and de-bias pre-breach structural cyber risk quantification models (P1–P5).
- **Core Role:** Predicts the empirical probability that an individual observed network flow corresponds to malicious cyber activity (e.g., DoS, PortScan, DDoS, Brute Force, Web Attacks, Botnet).
- **Integration Role:** Fuses non-destructively into the risk quantification engine via `backend/app/ml/fusion_layer.py`.
- **Out of Scope:** Does NOT directly predict Financial Expected Annual Loss (EAL) in isolation; does NOT replace host-level endpoint detection or full deep packet inspection (DPI).

---

## Training Data & Forensic Hygiene
- **Dataset:** Official Canadian Institute for Cybersecurity CIC-IDS2017 (`MachineLearningCSV.zip`).
- **Raw Volume Audited:** Exactly 2,830,743 network flows across 8 CSV capture files (884.6 MB uncompressed).
- **Class Normalization:** 15 distinct labels normalized to binary target (`BENIGN`: 0, 14 Attack Types: 1), while preserving original multi-class labels for sub-category performance auditing.
- **Leakage Elimination:**
  - **Removed `Destination Port`:** Exhibited an extreme Information Value of $9.7320$, causing artificial over-fitting on static testbed victim service ports.
  - **Removed Duplicate `Fwd Header Length.1`:** Redundant duplicate column present in raw capture CSVs.
  - **Removed 8 Constant Columns:** Invariant across all 2.83M rows (`Bwd PSH Flags`, `Bwd URG Flags`, `Fwd Avg Bytes/Bulk`, `Fwd Avg Packets/Bulk`, `Fwd Avg Bulk Rate`, `Bwd Avg Bytes/Bulk`, `Bwd Avg Packets/Bulk`, `Bwd Avg Bulk Rate`).
- **Retained Feature Schema:** 68 behavioral flow features (e.g., packet inter-arrival times, flow duration, packet length statistics, TCP flag distributions).
- **Numeric Conditioning:** Inf/NaN values handled with robust feature-median imputation and downcast to `float32`.

---

## Compute & Hardware Environment
- **Local Workstation:** NVIDIA GeForce GTX 1050 (4096 MiB VRAM), Driver 512.78, CUDA 11.6, 16 GB System RAM.
- **Cloud Reproducibility:** Google Colab NVIDIA Tesla T4 GPU workflow (`notebooks/P6_CIC2017_Training_Colab.ipynb`).
- **Device Support:** Dynamic fallback to high-throughput multi-core CPU `hist` if GPU memory constraints are exceeded.

---

## Baseline Comparison
- **Baseline Model:** L2-regularized Logistic Regression with Standard Scaler (`baseline_logistic_regression.pkl`).
- **Rationale:** Demonstrates the non-linear gain provided by gradient-boosted decision trees on complex behavioral network telemetry over linear baselines.

---

## Ethical Considerations & Limitations
1. **Payload Agnostic:** Model evaluates statistical flow dynamics only; it does not decrypt or inspect confidential packet payloads, preserving enterprise privacy.
2. **Offline Local Execution:** Operates 100% locally with zero external API calls or data exfiltration.
3. **Distribution Shift:** Network traffic patterns evolve over time. Model metadata includes feature distributions to support drift detection in continuous monitoring setups.
