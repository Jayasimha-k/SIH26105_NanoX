# Forensic Dataset Audit: CIC-IDS2017 (MachineLearningCSV)

**Audit Execution Time:** 2026-09-16T22:57:15Z  
**Total Flow Files:** 8  
**Total Network Flows (Rows):** 2,830,743  
**Total Features (Columns):** 79 (including Label)  
**Target Column:** `Label`  

## 1. File Inventory & Breakdown

| # | File Name | Size (Bytes) | Flow Rows | Unique Classes |
|---|---|---|---|---|
| 1 | `Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv` | 77,123,859 | 225,745 | 2 |
| 2 | `Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv` | 76,906,168 | 286,467 | 2 |
| 3 | `Friday-WorkingHours-Morning.pcap_ISCX.csv` | 58,316,725 | 191,033 | 2 |
| 4 | `Monday-WorkingHours.pcap_ISCX.csv` | 176,927,918 | 529,918 | 1 |
| 5 | `Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv` | 83,102,436 | 288,602 | 2 |
| 6 | `Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv` | 52,023,263 | 170,366 | 4 |
| 7 | `Tuesday-WorkingHours.pcap_ISCX.csv` | 135,078,995 | 445,909 | 3 |
| 8 | `Wednesday-workingHours.pcap_ISCX.csv` | 225,166,395 | 692,703 | 6 |
| **TOTAL** | **8 files** | **884,645,759** | **2,830,743** | **15** |

## 2. Verified Class Distribution

| Original Label | Flow Count | Percentage (%) | Proposed Binary Class |
|---|---|---|---|
| **`BENIGN`** | 2,273,097 | 80.3004% | 0 (BENIGN) |
| **`DoS Hulk`** | 231,073 | 8.1630% | 1 (MALICIOUS/ATTACK) |
| **`PortScan`** | 158,930 | 5.6144% | 1 (MALICIOUS/ATTACK) |
| **`DDoS`** | 128,027 | 4.5227% | 1 (MALICIOUS/ATTACK) |
| **`DoS GoldenEye`** | 10,293 | 0.3636% | 1 (MALICIOUS/ATTACK) |
| **`FTP-Patator`** | 7,938 | 0.2804% | 1 (MALICIOUS/ATTACK) |
| **`SSH-Patator`** | 5,897 | 0.2083% | 1 (MALICIOUS/ATTACK) |
| **`DoS slowloris`** | 5,796 | 0.2048% | 1 (MALICIOUS/ATTACK) |
| **`DoS Slowhttptest`** | 5,499 | 0.1943% | 1 (MALICIOUS/ATTACK) |
| **`Bot`** | 1,966 | 0.0695% | 1 (MALICIOUS/ATTACK) |
| **`Web Attack � Brute Force`** | 1,507 | 0.0532% | 1 (MALICIOUS/ATTACK) |
| **`Web Attack � XSS`** | 652 | 0.0230% | 1 (MALICIOUS/ATTACK) |
| **`Infiltration`** | 36 | 0.0013% | 1 (MALICIOUS/ATTACK) |
| **`Web Attack � Sql Injection`** | 21 | 0.0007% | 1 (MALICIOUS/ATTACK) |
| **`Heartbleed`** | 11 | 0.0004% | 1 (MALICIOUS/ATTACK) |

## 3. Data Hygiene & Anomaly Diagnostics

- **Columns containing NaN values:** 1
  - `Flow Bytes/s`: 1,358 missing values (0.0480%)
- **Columns containing Infinite values (`inf` / `-inf`):** 2
  - `Flow Bytes/s`: 1,509 infinite values (0.0533%)
  - `Flow Packets/s`: 2,867 infinite values (0.1013%)

## 4. Potential Leakage & Suspicious Identifier Features

Features flagged for strict leakage review:
- `Destination Port`
- `Idle Max`
- `Idle Mean`
- `Idle Min`
- `Idle Std`

## 5. Complete Feature List

<details>
<summary>Click to expand all 79 feature names</summary>

1. `Destination Port`
2. `Flow Duration`
3. `Total Fwd Packets`
4. `Total Backward Packets`
5. `Total Length of Fwd Packets`
6. `Total Length of Bwd Packets`
7. `Fwd Packet Length Max`
8. `Fwd Packet Length Min`
9. `Fwd Packet Length Mean`
10. `Fwd Packet Length Std`
11. `Bwd Packet Length Max`
12. `Bwd Packet Length Min`
13. `Bwd Packet Length Mean`
14. `Bwd Packet Length Std`
15. `Flow Bytes/s`
16. `Flow Packets/s`
17. `Flow IAT Mean`
18. `Flow IAT Std`
19. `Flow IAT Max`
20. `Flow IAT Min`
21. `Fwd IAT Total`
22. `Fwd IAT Mean`
23. `Fwd IAT Std`
24. `Fwd IAT Max`
25. `Fwd IAT Min`
26. `Bwd IAT Total`
27. `Bwd IAT Mean`
28. `Bwd IAT Std`
29. `Bwd IAT Max`
30. `Bwd IAT Min`
31. `Fwd PSH Flags`
32. `Bwd PSH Flags`
33. `Fwd URG Flags`
34. `Bwd URG Flags`
35. `Fwd Header Length`
36. `Bwd Header Length`
37. `Fwd Packets/s`
38. `Bwd Packets/s`
39. `Min Packet Length`
40. `Max Packet Length`
41. `Packet Length Mean`
42. `Packet Length Std`
43. `Packet Length Variance`
44. `FIN Flag Count`
45. `SYN Flag Count`
46. `RST Flag Count`
47. `PSH Flag Count`
48. `ACK Flag Count`
49. `URG Flag Count`
50. `CWE Flag Count`
51. `ECE Flag Count`
52. `Down/Up Ratio`
53. `Average Packet Size`
54. `Avg Fwd Segment Size`
55. `Avg Bwd Segment Size`
56. `Fwd Header Length.1`
57. `Fwd Avg Bytes/Bulk`
58. `Fwd Avg Packets/Bulk`
59. `Fwd Avg Bulk Rate`
60. `Bwd Avg Bytes/Bulk`
61. `Bwd Avg Packets/Bulk`
62. `Bwd Avg Bulk Rate`
63. `Subflow Fwd Packets`
64. `Subflow Fwd Bytes`
65. `Subflow Bwd Packets`
66. `Subflow Bwd Bytes`
67. `Init_Win_bytes_forward`
68. `Init_Win_bytes_backward`
69. `act_data_pkt_fwd`
70. `min_seg_size_forward`
71. `Active Mean`
72. `Active Std`
73. `Active Max`
74. `Active Min`
75. `Idle Mean`
76. `Idle Std`
77. `Idle Max`
78. `Idle Min`
79. `Label`

</details>
