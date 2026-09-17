"""
scripts/run_p6_robustness_experiment.py
Illustrative Evidence Fusion Scenarios: Concept Demonstration of P5 + P6 Interplay.

IMPORTANT FORENSIC NOTICE:
These scenarios use illustrative synthetic values to demonstrate theoretical edge cases
(e.g., dormant high-CVSS vs. zero-day uncatalogued exploits).
THEY ARE EXPLICITLY LABELED AS "ILLUSTRATIVE SCENARIOS" AND MUST NOT BE CONFUSED
WITH THE EMPIRICAL VALIDATION CONDUCTED ON THE OFFICIAL CIC-IDS2017 PARTITIONS.
For empirical evaluation, refer to reports/p6_fusion_final_comparison.md.
"""

import os
import sys
import json
import time
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from app.ml.fusion_layer import fuse_risk_evidence

def run_experiment(reports_dir="reports"):
    os.makedirs(reports_dir, exist_ok=True)
    print("=" * 75)
    print("ILLUSTRATIVE EVIDENCE FUSION SCENARIOS (CONCEPT DEMONSTRATION)")
    print("=" * 75)
    print("[NOTICE] These are illustrative conceptual scenarios, distinct from empirical test partition benchmarks.\n")
    
    scenarios = [
        {
            "scenario_id": "ILLUSTRATIVE_SCENARIO_1",
            "name": "Dormant High-CVSS Vulnerability (No Telemetry Activity)",
            "nature": "Illustrative Scenario",
            "description": "Vulnerability scanner flags Critical CVE (CVSS 9.8, EPSS 0.85), but zero network maliciousness detected on ingress/egress.",
            "p5_prior_risk": 0.92,
            "p6_network_evidence": 0.04,
            "conceptual_goal": "Risk moderated by empirical telemetry, mitigating alert fatigue."
        },
        {
            "scenario_id": "ILLUSTRATIVE_SCENARIO_2",
            "name": "Zero-Day Attack (NVD/EPSS Silent, Active Telemetry Breach)",
            "nature": "Illustrative Scenario",
            "description": "Exploit has no public CVE or EPSS signature (P5 evaluates as low/benign), but active telemetry exhibits PortScan / DoS flood behavior.",
            "p5_prior_risk": 0.12,
            "p6_network_evidence": 0.96,
            "conceptual_goal": "Empirical network telemetry elevates risk immediately, mitigating source database lag."
        },
        {
            "scenario_id": "ILLUSTRATIVE_SCENARIO_3",
            "name": "Active Brute-Force Credential Attack (Corroborated Threat)",
            "nature": "Illustrative Scenario",
            "description": "High CVSS service exposed to the internet, actively undergoing SSH/FTP-Patator attack flows.",
            "p5_prior_risk": 0.78,
            "p6_network_evidence": 0.89,
            "conceptual_goal": "Both models corroborate high risk, reinforcing high-confidence mitigation priority."
        },
        {
            "scenario_id": "ILLUSTRATIVE_SCENARIO_4",
            "name": "Normal High-Volume Web Operations (Legitimate Scale)",
            "nature": "Illustrative Scenario",
            "description": "Enterprise e-commerce spike during business hours. Both static posture and network telemetry are clean.",
            "p5_prior_risk": 0.08,
            "p6_network_evidence": 0.03,
            "conceptual_goal": "Risk remains firmly low, zero false positive escalation."
        }
    ]
    
    results = []
    for sc in scenarios:
        fused_v1 = fuse_risk_evidence(
            p5_risk_score=sc["p5_prior_risk"],
            p6_network_evidence=sc["p6_network_evidence"],
            fusion_version="v1"
        )
        fused_v2 = fuse_risk_evidence(
            p5_risk_score=sc["p5_prior_risk"],
            p6_network_evidence=sc["p6_network_evidence"],
            fusion_version="v2"
        )
        
        res = {
            **sc,
            "fused_v1_probability": fused_v1["fused_probability"],
            "fused_v1_weight_p6": fused_v1["p6_weight"],
            "fused_v2_probability": fused_v2["fused_probability"],
            "fused_v2_weight_p6": fused_v2["p6_weight"],
            "empirical_delta_v2": fused_v2["empirical_boost"]
        }
        results.append(res)
        print(f"[{sc['scenario_id']}] {sc['name']}")
        print(f"  P5 Prior Risk:        {sc['p5_prior_risk']:.2f}")
        print(f"  P6 Network Evidence:  {sc['p6_network_evidence']:.2f}")
        print(f"  Fusion v1 (w=0.25):   {fused_v1['fused_probability']:.2f}")
        print(f"  Fusion v2 (w=0.90):   {fused_v2['fused_probability']:.2f} (Delta: {fused_v2['empirical_boost']:+.2f})\n")
        
    json_path = os.path.join(reports_dir, "p6_bias_mitigation_experiment.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "type": "Illustrative Conceptual Scenarios",
            "notice": "These values are illustrative constructs for architectural demonstration; empirical validation is documented in p6_fusion_final_comparison.json",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "results": results
        }, f, indent=2)
    print(f"[SAVED] Experiment JSON: {json_path}")
    
    # Markdown
    md_content = f"""# Illustrative Evidence Fusion Scenarios (Concept Demonstration)

**Document Type:** Illustrative Conceptual Scenarios  
**Evaluation Date:** {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}  

> [!NOTE]
> **Forensic Distinction:** These scenarios use synthetic illustrative values to demonstrate architectural edge cases.
> For true empirical validation on held-out CIC-IDS2017 network flows, consult [`reports/p6_fusion_final_comparison.md`](file:///c:/Users/Kishanraj/SIH26105/SIH26105_NanoX/reports/p6_fusion_final_comparison.md).

---

## Comparative Scenario Matrix

| Scenario ID | Scenario Name | P5 Prior Risk | P6 Network Evidence | Fusion v1 ($w_{{P6}}=0.25$) | Fusion v2 ($w_{{P6}}=0.90$) | Risk Delta (v2 - P5) | Conceptual Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
"""
    for r in results:
        md_content += f"| `{r['scenario_id']}` | **{r['name']}** | `{r['p5_prior_risk']:.2f}` | `{r['p6_network_evidence']:.2f}` | `{r['fused_v1_probability']:.2f}` | **`{r['fused_v2_probability']:.2f}`** | `{r['empirical_delta_v2']:+.2f}` | {r['conceptual_goal']} |\n"

    md_content += """
---

## Key Conceptual Observations:
1. **Zero-Day Telemetry Escalation (Scenario 2):** When vulnerability databases are completely blind to a zero-day exploit ($P_5=0.12$), active malicious network telemetry ($P_6=0.96$) raises Fusion v2 risk to **0.88** (compared to 0.33 under Fusion v1).
2. **Dormant Vulnerability Moderation (Scenario 1):** When a critical vulnerability has no active exploitation traffic ($P_6=0.04$), Fusion v2 adjusts risk to **0.13**, preventing premature alarm fatigue.
3. **Corroboration (Scenario 3):** Under active verified brute-force, both static and empirical indicators align at **0.88**.
"""

    md_path = os.path.join(reports_dir, "p6_bias_mitigation_experiment.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"[SAVED] Experiment Markdown: {md_path}")

if __name__ == "__main__":
    run_experiment()
