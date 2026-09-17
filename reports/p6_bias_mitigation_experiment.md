# Illustrative Evidence Fusion Scenarios (Concept Demonstration)

**Document Type:** Illustrative Conceptual Scenarios  
**Evaluation Date:** 2026-09-16 23:17:39 UTC  

> [!NOTE]
> **Forensic Distinction:** These scenarios use synthetic illustrative values to demonstrate architectural edge cases.
> For true empirical validation on held-out CIC-IDS2017 network flows, consult [`reports/p6_fusion_final_comparison.md`](file:///c:/Users/Kishanraj/SIH26105/SIH26105_NanoX/reports/p6_fusion_final_comparison.md).

---

## Comparative Scenario Matrix

| Scenario ID | Scenario Name | P5 Prior Risk | P6 Network Evidence | Fusion v1 ($w_{P6}=0.25$) | Fusion v2 ($w_{P6}=0.90$) | Risk Delta (v2 - P5) | Conceptual Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ILLUSTRATIVE_SCENARIO_1` | **Dormant High-CVSS Vulnerability (No Telemetry Activity)** | `0.92` | `0.04` | `0.70` | **`0.13`** | `-0.79` | Risk moderated by empirical telemetry, mitigating alert fatigue. |
| `ILLUSTRATIVE_SCENARIO_2` | **Zero-Day Attack (NVD/EPSS Silent, Active Telemetry Breach)** | `0.12` | `0.96` | `0.33` | **`0.88`** | `+0.76` | Empirical network telemetry elevates risk immediately, mitigating source database lag. |
| `ILLUSTRATIVE_SCENARIO_3` | **Active Brute-Force Credential Attack (Corroborated Threat)** | `0.78` | `0.89` | `0.81` | **`0.88`** | `+0.10` | Both models corroborate high risk, reinforcing high-confidence mitigation priority. |
| `ILLUSTRATIVE_SCENARIO_4` | **Normal High-Volume Web Operations (Legitimate Scale)** | `0.08` | `0.03` | `0.07` | **`0.04`** | `-0.04` | Risk remains firmly low, zero false positive escalation. |

---

## Key Conceptual Observations:
1. **Zero-Day Telemetry Escalation (Scenario 2):** When vulnerability databases are completely blind to a zero-day exploit ($P_5=0.12$), active malicious network telemetry ($P_6=0.96$) raises Fusion v2 risk to **0.88** (compared to 0.33 under Fusion v1).
2. **Dormant Vulnerability Moderation (Scenario 1):** When a critical vulnerability has no active exploitation traffic ($P_6=0.04$), Fusion v2 adjusts risk to **0.13**, preventing premature alarm fatigue.
3. **Corroboration (Scenario 3):** Under active verified brute-force, both static and empirical indicators align at **0.88**.
