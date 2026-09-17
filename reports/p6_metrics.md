# P6 Empirical Evidence Model: Comprehensive Evaluation Report

**Model:** `CyberOptRQ_P6_CIC2017_XGBoost_v1`  
**Evaluation Date:** 2026-09-16T23:25:33Z  
**Dataset:** CIC-IDS2017 (MachineLearningCSV)  
**Evaluated Partitions:** Train (282,111), Val (60,452), Test (60,454)  

---

## 1. Executive Performance Summary

| Metric | Train Set | Validation Set | Test Set (Hold-Out) | Baseline (LogReg Test) |
| :--- | :--- | :--- | :--- | :--- |
| **ROC-AUC** | `0.9989` | `0.9978` | **`0.9895`** | `0.9242` |
| **PR-AUC (Avg Precision)** | `0.9979` | `0.9942` | **`0.9463`** | `0.6112` |
| **Accuracy** | `98.2740%` | `98.1740%` | **`97.3040%`** | `91.2710%` |
| **Balanced Accuracy** | `98.1130%` | `97.4140%` | **`91.9090%`** | `80.3320%` |
| **Precision** | `0.9766` | `0.9666` | **`0.8999`** | `0.5930` |
| **Recall** | `0.9754` | `0.9591` | **`0.8499`** | `0.6630` |
| **F1-Score** | `0.9760` | `0.9628` | **`0.8742`** | `0.6260` |
| **Matthews Corr (MCC)** | `0.9625` | `0.9507` | **`0.8595`** | `0.5779` |
| **Brier Score** | `0.01260` | `0.01405` | **`0.02105`** | `0.06692` |

### Hold-Out Test Confusion Matrix
- **True Negatives (TN):** 53,162
- **False Positives (FP):** 630
- **False Negatives (FN):** 1,000
- **True Positives (TP):** 5,662

---

## 2. Attack-Category Breakdown (Hold-Out Test Set)

| Attack / Traffic Category | Type | Test Count | Detected / Correct | Detection Rate / Recall | Mean Malicious Prob |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BENIGN** | Benign | 53,792 | 53,162 | `98.83%` | `0.0281` |
| **Bot** | Attack | 315 | 0 | `0.00%` | `0.2053` |
| **DDoS** | Attack | 368 | 360 | `97.83%` | `0.9773` |
| **DoS GoldenEye** | Attack | 909 | 627 | `68.98%` | `0.6913` |
| **Heartbleed** | Attack | 2 | 0 | `0.00%` | `0.0051` |
| **PortScan** | Attack | 3,759 | 3,752 | `99.81%` | `0.9892` |
| **SSH-Patator** | Attack | 1,309 | 923 | `70.51%` | `0.7061` |

---

## 3. Top 15 Feature Importances (XGBoost Gain)

| Rank | Feature Name | Information Gain | Weight (Splits) | Cover |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `Flow Duration` | `47.87` | 283 | `836.02` |
| 2 | `Total Fwd Packets` | `66.52` | 112 | `1217.00` |
| 3 | `Total Backward Packets` | `96.52` | 127 | `1422.85` |
| 4 | `Total Length of Fwd Packets` | `57.51` | 202 | `987.50` |
| 5 | `Total Length of Bwd Packets` | `157.20` | 148 | `1592.43` |
| 6 | `Fwd Packet Length Max` | `733.77` | 147 | `2764.12` |
| 7 | `Fwd Packet Length Min` | `123.87` | 42 | `2856.57` |
| 8 | `Fwd Packet Length Mean` | `1986.54` | 149 | `3235.15` |
| 9 | `Fwd Packet Length Std` | `179.65` | 149 | `1522.18` |
| 10 | `Bwd Packet Length Max` | `71.80` | 116 | `1608.30` |
| 11 | `Bwd Packet Length Min` | `1818.39` | 65 | `9642.51` |
| 12 | `Bwd Packet Length Mean` | `308.05` | 173 | `2573.15` |
| 13 | `Bwd Packet Length Std` | `2192.42` | 197 | `6777.28` |
| 14 | `Flow Bytes/s` | `62.90` | 290 | `579.60` |
| 15 | `Flow Packets/s` | `9.92` | 220 | `428.29` |
