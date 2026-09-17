# P6 Empirical Evidence Model: Comprehensive Leakage & Hygiene Audit

**Audit Timestamp:** 2026-09-16T23:22:43Z  
**Scope:** All 68 Features in `models/p6/feature_schema.json`  
**Dataset:** Official Canadian Institute for Cybersecurity CIC-IDS2017 (`MachineLearningCSV`)  

---

## 1. Executive Summary & Classification Counts

| Classification Category | Feature Count | Percentage | Operational Guidance |
| :--- | :--- | :--- | :--- |
| **SAFE_BEHAVIORAL** | **56** | **82.4%** | Retain for robust behavioral flow inference |
| **POTENTIAL_LEAKAGE** | **12** | **17.6%** | Remove (Duplicates, OS fingerprints, near-constant flags) |
| **LEAKAGE (Direct Identifiers)** | **0** | **0.0%** | Zero direct network identifiers present |

---

## 2. Direct Network & Environmental Identifier Audit

| Candidate Identifier | Status in Schema | Forensic Verification |
| :--- | :--- | :--- |
| **Flow ID** | `ABSENT` | Verified absent from feature schema and training arrays. |
| **Source IP** | `ABSENT` | Verified absent; payload agnostic and IP-independent. |
| **Destination IP** | `ABSENT` | Verified absent; model cannot memorize target IP addresses. |
| **Source Port** | `ABSENT` | Verified absent. |
| **Destination Port** | `REMOVED` | Removed during initial audit (IV: 9.7320) to prevent port memorization. |
| **Timestamp** | `ABSENT` | Verified absent; no explicit time headers used as inputs. |
| **Capture / Day / File ID** | `ABSENT` | Verified absent; no filename metadata passed to model. |

---

## 3. Potential Leakage & Hygiene Findings

### A. OS / Protocol Stack Fingerprinting (3 Features)
1. `Init_Win_bytes_forward`: Initial TCP window size forward. Frequently reflects client OS defaults (Linux 29200, Windows 8192) rather than attack dynamics.
2. `Init_Win_bytes_backward`: Initial TCP window size backward. Fingerprints server stack responses.
3. `min_seg_size_forward`: Minimum segment size in forward direction (reflects TCP options header size).

### B. Mathematical Duplicates / Collinear Redundancies (7 Features)
In the raw CICFlowMeter extraction, several metrics are computed twice under different names:
1. `Subflow Fwd Bytes` $\equiv$ `Total Length of Fwd Packets` (Difference = 0.0)
2. `Subflow Bwd Bytes` $\equiv$ `Total Length of Bwd Packets` (Pearson $r = 1.000$)
3. `Avg Fwd Segment Size` $\equiv$ `Fwd Packet Length Mean` (Difference = 0.0)
4. `Avg Bwd Segment Size` $\equiv$ `Bwd Packet Length Mean` (Difference = 0.0)
5. `Subflow Fwd Packets` $\equiv$ `Total Fwd Packets` (Difference = 0.0)
6. `Subflow Bwd Packets` $\equiv$ `Total Backward Packets` (Difference = 0.0)
7. `Packet Length Variance` $\equiv (\text{Packet Length Std})^2$

### C. Near-Zero Variance Flags (2 Features)
1. `CWE Flag Count`: Inactive / near-zero variance across capture files.
2. `Fwd URG Flags`: Inactive / near-zero variance across capture files.

---

## 4. Train / Validation / Test Split Methodology Audit

> [!WARNING]
> **Temporal / Session Leakage Finding in Random Row Splitting:**  
> The previous split utilized random row splitting (`train_test_split(..., test_size=0.30, stratify=...)`).  
> In network flow monitoring, random row splitting distributes contemporaneous flows from the **exact same attack burst** across both the training set and the test set. This explains why tree models can achieve near-perfect metrics (0.9999 ROC-AUC).  
> **Mandatory Remediation:** Re-partition the dataset using **Time/Sequence-Aware Chronological Splitting** (First 70% of chronological flows per capture session -> Train, Next 15% -> Validation, Final 15% -> Untouched Hold-Out Test).

---

## 5. Complete 68-Feature Audit Classification

| # | Feature Name | Classification | Category | Description / Forensic Detail | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `Flow Duration` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 2 | `Total Fwd Packets` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 3 | `Total Backward Packets` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 4 | `Total Length of Fwd Packets` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 5 | `Total Length of Bwd Packets` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 6 | `Fwd Packet Length Max` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 7 | `Fwd Packet Length Min` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 8 | `Fwd Packet Length Mean` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 9 | `Fwd Packet Length Std` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 10 | `Bwd Packet Length Max` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 11 | `Bwd Packet Length Min` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 12 | `Bwd Packet Length Mean` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 13 | `Bwd Packet Length Std` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 14 | `Flow Bytes/s` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 15 | `Flow Packets/s` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 16 | `Flow IAT Mean` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 17 | `Flow IAT Std` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 18 | `Flow IAT Max` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 19 | `Flow IAT Min` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 20 | `Fwd IAT Total` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 21 | `Fwd IAT Mean` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 22 | `Fwd IAT Std` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 23 | `Fwd IAT Max` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 24 | `Fwd IAT Min` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 25 | `Bwd IAT Total` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 26 | `Bwd IAT Mean` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 27 | `Bwd IAT Std` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 28 | `Bwd IAT Max` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 29 | `Bwd IAT Min` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 30 | `Fwd PSH Flags` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 31 | `Fwd URG Flags` | **POTENTIAL_LEAKAGE** | Near-Zero Variance Flag | Extremely sparse / near-zero variance flag in dataset | REMOVE to enforce statistical robustness |
| 32 | `Fwd Header Length` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 33 | `Bwd Header Length` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 34 | `Fwd Packets/s` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 35 | `Bwd Packets/s` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 36 | `Min Packet Length` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 37 | `Max Packet Length` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 38 | `Packet Length Mean` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 39 | `Packet Length Std` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 40 | `Packet Length Variance` | **POTENTIAL_LEAKAGE** | Redundant / Duplicate Feature | Duplicate of 'Packet Length Std': Collinear mathematical square of Packet Length Std | REMOVE to eliminate multicollinearity and artificial tree dominance |
| 41 | `FIN Flag Count` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 42 | `SYN Flag Count` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 43 | `RST Flag Count` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 44 | `PSH Flag Count` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 45 | `ACK Flag Count` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 46 | `URG Flag Count` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 47 | `CWE Flag Count` | **POTENTIAL_LEAKAGE** | Near-Zero Variance Flag | Extremely sparse / near-zero variance flag in dataset | REMOVE to enforce statistical robustness |
| 48 | `ECE Flag Count` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 49 | `Down/Up Ratio` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 50 | `Average Packet Size` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 51 | `Avg Fwd Segment Size` | **POTENTIAL_LEAKAGE** | Redundant / Duplicate Feature | Duplicate of 'Fwd Packet Length Mean': Exact mathematical duplicate (difference = 0.0) | REMOVE to eliminate multicollinearity and artificial tree dominance |
| 52 | `Avg Bwd Segment Size` | **POTENTIAL_LEAKAGE** | Redundant / Duplicate Feature | Duplicate of 'Bwd Packet Length Mean': Exact mathematical duplicate (difference = 0.0) | REMOVE to eliminate multicollinearity and artificial tree dominance |
| 53 | `Subflow Fwd Packets` | **POTENTIAL_LEAKAGE** | Redundant / Duplicate Feature | Duplicate of 'Total Fwd Packets': Exact mathematical duplicate (difference = 0.0) | REMOVE to eliminate multicollinearity and artificial tree dominance |
| 54 | `Subflow Fwd Bytes` | **POTENTIAL_LEAKAGE** | Redundant / Duplicate Feature | Duplicate of 'Total Length of Fwd Packets': Exact mathematical duplicate (difference = 0.0) | REMOVE to eliminate multicollinearity and artificial tree dominance |
| 55 | `Subflow Bwd Packets` | **POTENTIAL_LEAKAGE** | Redundant / Duplicate Feature | Duplicate of 'Total Backward Packets': Exact mathematical duplicate (difference = 0.0) | REMOVE to eliminate multicollinearity and artificial tree dominance |
| 56 | `Subflow Bwd Bytes` | **POTENTIAL_LEAKAGE** | Redundant / Duplicate Feature | Duplicate of 'Total Length of Bwd Packets': Exact collinear duplicate (correlation = 1.000) | REMOVE to eliminate multicollinearity and artificial tree dominance |
| 57 | `Init_Win_bytes_forward` | **POTENTIAL_LEAKAGE** | OS / Stack Fingerprint | Fingerprints client OS TCP stack implementation (e.g. Linux 29200 vs Windows 8192) | REMOVE to prevent testbed machine fingerprinting |
| 58 | `Init_Win_bytes_backward` | **POTENTIAL_LEAKAGE** | OS / Stack Fingerprint | Fingerprints server OS TCP stack implementation (e.g. 235 custom tool window) | REMOVE to prevent testbed machine fingerprinting |
| 59 | `act_data_pkt_fwd` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 60 | `min_seg_size_forward` | **POTENTIAL_LEAKAGE** | OS / Stack Fingerprint | Reflects fixed TCP option header length of the operating system | REMOVE to prevent testbed machine fingerprinting |
| 61 | `Active Mean` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 62 | `Active Std` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 63 | `Active Max` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 64 | `Active Min` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 65 | `Idle Mean` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 66 | `Idle Std` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 67 | `Idle Max` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
| 68 | `Idle Min` | **SAFE_BEHAVIORAL** | Statistical Flow Dynamics | Pure behavioral telemetry (packet sizes, inter-arrival times, throughput rates, standard flags) | RETAIN |
