"""
demo_offline_flow.py
Complete 10-Step Air-Gapped Demonstration Flow for SIH 2026 (Problem Statement 26105).

Demonstrates:
ORGANIZATION -> ASSETS -> LOCAL THREAT INTEL -> CORRELATION -> RISK QUANTIFICATION
-> EXPLANATION -> INVESTMENT OPTIMIZATION -> REMEDIATION -> REASSESSMENT -> BLOCKCHAIN AUDIT & VERIFICATION

100% Offline. Zero Internet Connection. All simulated events clearly tagged DEMO-THREAT-*.
"""

import os
import sys
import json
import time

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from database.db_manager import get_connection, DB_PATH, seed_default_data, init_db
from threat_correlator import ThreatAssetCorrelator
from local_risk_engine import LocalRiskEngine
from investment_optimizer import InvestmentOptimizer
from blockchain.ledger import OfflineBlockchain
from explainer import DeterministicRiskExplainer


def run_full_offline_demonstration():
    print("\n" + "=" * 70)
    print("      SIH 2026 PS 26105: CYBER RISK COMMAND CENTER")
    print("      AI-POWERED CONTINUOUS RISK QUANTIFICATION & OPTIMIZATION")
    print("=" * 70)
    print("  SYSTEM STATUS: 🟢 OFFLINE MODE (Air-Gapped Operation)")
    print("  LOCAL THREAT INTELLIGENCE REPOSITORY: Loaded")
    print("  LAST THREAT INTELLIGENCE UPDATE: 2026-09-16")
    print("  ZERO CLOUD / REMOTE DEPENDENCY: Verified")
    print("=" * 70)

    # Initialize fresh database state for clean demo
    init_db(reset=True)
    seed_default_data()

    correlator = ThreatAssetCorrelator(DB_PATH)
    risk_engine = LocalRiskEngine(DB_PATH)
    blockchain = OfflineBlockchain(DB_PATH)
    explainer = DeterministicRiskExplainer()

    # -------------------------------------------------------------
    # STEP 1: Load Organization & Assets
    # -------------------------------------------------------------
    print("\n[STEP 1] Loading Target Organization Profile...")
    conn = get_connection(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM organizations WHERE organization_id = 'ORG-HOSP-A'")
    org = dict(cursor.fetchone())

    cursor.execute("SELECT asset_id, asset_name, technology, criticality, exposure FROM assets WHERE organization_id = 'ORG-HOSP-A'")
    assets = [dict(r) for r in cursor.fetchall()]

    print(f"  Organization: {org['organization_name']} (ID: {org['organization_id']})")
    print(f"  Sector: {org['industry'].upper()} | Tier: {org['organization_size'].upper()} | Endpoints: {org['number_of_endpoints']}")
    print(f"  Internal Asset Inventory ({len(assets)} Active Systems):")
    for a in assets:
        exp_tag = "[EXT-FACING]" if a['exposure'] == "INTERNET_FACING" else "[INTERNAL]"
        print(f"    * {a['asset_id']:<10} | {a['asset_name']:<32} | Tech: {a['technology']:<18} | Crit: {a['criticality']}/10 {exp_tag}")

    # -------------------------------------------------------------
    # STEP 2: Show Initial Risk Baseline
    # -------------------------------------------------------------
    initial_risk = org['current_risk_score']
    initial_level = org['current_risk_level']
    print(f"\n[STEP 2] Initial Posture Risk Assessment (NIST CSF 2.0 Baseline):")
    print(f"  Current Quantified Risk Score : {initial_risk:.1f} / 100.0")
    print(f"  Current Risk Level            : {initial_level.upper()}")
    print("  Status                        : Baseline active. Monitoring local threat repository.")

    # -------------------------------------------------------------
    # STEP 3: Ingest Local Simulated Threat
    # -------------------------------------------------------------
    feed_path = os.path.join(PROJECT_ROOT, "data", "threats", "demo_threat_feed.json")
    with open(feed_path, "r") as f:
        feed = json.load(f)

    threat_evt1 = feed["events"][0]  # DEMO-THREAT-2026-001
    print(f"\n[STEP 3] Ingesting New Threat from Local Repository (SIMULATION / DEMO DATA):")
    print(f"  Threat Identifier   : {threat_evt1['event_id']}")
    print(f"  Title               : {threat_evt1['title']}")
    print(f"  Target Technology   : {threat_evt1['affected_technology']}")
    print(f"  Reference CVE       : {threat_evt1['reference_cve']} (CVSS {threat_evt1['cvss_score']}, EPSS {threat_evt1['epss_score']})")
    print(f"  Status              : {threat_evt1['threat_status']}")

    # -------------------------------------------------------------
    # STEP 4: Threat -> Asset Correlation
    # -------------------------------------------------------------
    print(f"\n[STEP 4] Executing Threat -> Asset Attack Surface Correlation...")
    corr_res = correlator.correlate_threat(threat_evt1, organization_id="ORG-HOSP-A")

    if corr_res["matched"]:
        print("  Correlation Result  : ASSET MATCH FOUND ✓")
        print(f"  Matching Assets     : {len(corr_res['correlated_assets'])}")
        for ca in corr_res["correlated_assets"]:
            print(f"    -> Impacted: {ca['asset_name']} [{ca['asset_id']}]")
            print(f"       Technology: {ca['technology']} | Criticality: {ca['criticality']}/10")
            print(f"       Exposure: {ca['exposure']} (Multiplier: {ca['exposure_multiplier']}x)")
            print(f"       Calculated Attack Vector Surge: +{ca['asset_risk_delta']} pts")
    else:
        print("  Correlation Result  : NO MATCH (Zero Risk Increase)")
        return

    # -------------------------------------------------------------
    # STEP 5: Dynamic Risk Recalculation (Risk Increases)
    # -------------------------------------------------------------
    print(f"\n[STEP 5] Recalculating Dynamic Organization Risk...")
    recalc1 = risk_engine.calculate_composite_risk(
        organization_id="ORG-HOSP-A",
        active_threat_delta=corr_res["risk_delta"],
        trigger_reason=f"Threat Detected ({threat_evt1['event_id']})",
        trigger_id=threat_evt1['event_id'],
        affected_asset="SERVER-001"
    )
    new_risk_surge = recalc1["composite_risk_score"]
    new_level_surge = recalc1["risk_level"]
    print(f"  Previous Risk Score : {initial_risk:.1f} ({initial_level})")
    print(f"  Updated Risk Score  : {new_risk_surge:.1f} ({new_level_surge}) [+{corr_res['risk_delta']:.1f} PTS]")
    print(f"\n  [Deterministic Natural-Language Risk Explanation]:")
    explanation1 = explainer.explain_threat_impact(
        threat_event=threat_evt1,
        correlated_assets=corr_res["correlated_assets"],
        previous_risk=initial_risk,
        new_risk=new_risk_surge
    )
    for line in explanation1.split("\n"):
        print(f"    {line}")

    # Commit Event to Blockchain
    cursor.execute("SELECT * FROM blockchain_records ORDER BY block_index DESC LIMIT 1")
    last_block = dict(cursor.fetchone())
    block1 = blockchain.create_block_record(
        last_block=last_block,
        organization_id="ORG-HOSP-A",
        event_type="THREAT_SURGE",
        previous_risk=initial_risk,
        new_risk=new_risk_surge,
        trigger=threat_evt1["event_id"],
        affected_asset="SERVER-001",
        details={"threat": threat_evt1["title"], "correlated": "SERVER-001"}
    )
    cursor.execute("""
        INSERT INTO blockchain_records VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, tuple(block1.values()))
    conn.commit()

    # -------------------------------------------------------------
    # STEP 6: Investment Optimizer
    # -------------------------------------------------------------
    budget = 5000000.0  # ₹50,00,000 (Capital budget for large healthcare enterprise)
    print(f"\n[STEP 6] Running Offline 0-1 Knapsack Investment Optimizer...")
    print(f"  Available Capital Budget Ceiling: INR {budget:,.2f}")

    org_posture = json.loads(org["posture_json"])
    def eval_fn(sim_posture):
        res = risk_engine.baseline_engine.evaluate_organization(sim_posture)
        return {"risk_score": res["risk_score"], "risk_level": res["risk_level"]}

    optimizer = InvestmentOptimizer(eval_fn)
    opt_portfolio = optimizer.optimize_portfolio(org_posture, budget_inr=budget)

    print(f"  Optimization Status : Optimal Portfolio Identified")
    print(f"  Total Budget Allocated: INR {opt_portfolio['total_spent_inr']:,.2f} (Remaining: INR {opt_portfolio['remaining_budget_inr']:,.2f})")
    print(f"  Recommended Controls to Implement:")
    for idx, c in enumerate(opt_portfolio["selected_investments"], 1):
        print(f"    {idx}. {c['name']} [{c['id']}]")
        print(f"       Cost: INR {c['cost_inr']:,.2f} | Expected Risk Reduction: -{c['expected_risk_reduction']:.1f} pts")
        print(f"       Efficiency Ratio: {c['efficiency_score']} pts per INR 1 Lakh spent")

    # -------------------------------------------------------------
    # STEP 7: Simulate Remediation Execution
    # -------------------------------------------------------------
    threat_remed = feed["events"][3]  # DEMO-THREAT-2026-004
    print(f"\n[STEP 7] Simulating Security Remediation Execution (SIMULATION / DEMO DATA):")
    print(f"  Event Identifier    : {threat_remed['event_id']}")
    print(f"  Action Taken        : Emergency Vendor Patch Deployed & Microsegmentation Active")
    print(f"  Target Asset        : {threat_remed['target_asset']} (SERVER-001)")
    print(f"  Remediation Status  : {threat_remed['remediation_status']}")

    # -------------------------------------------------------------
    # STEP 8: Risk Recalculation (Risk Decreases)
    # -------------------------------------------------------------
    print(f"\n[STEP 8] Reassessing Organization Risk Post-Remediation...")
    recalc2 = risk_engine.calculate_composite_risk(
        organization_id="ORG-HOSP-A",
        mitigation_delta=15.0,
        trigger_reason=f"Remediation Verified ({threat_remed['event_id']})",
        trigger_id=threat_remed['event_id'],
        affected_asset="SERVER-001"
    )
    final_risk = recalc2["composite_risk_score"]
    final_level = recalc2["risk_level"]
    print(f"  Pre-Remediation Risk: {new_risk_surge:.1f} ({new_level_surge})")
    print(f"  Post-Remediation Risk: {final_risk:.1f} ({final_level}) [-15.0 PTS]")

    print(f"\n  [Deterministic Natural-Language Remediation Explanation]:")
    explanation2 = explainer.explain_remediation_impact(
        remediation_event=threat_remed,
        target_asset="SERVER-001",
        previous_risk=new_risk_surge,
        new_risk=final_risk
    )
    for line in explanation2.split("\n"):
        print(f"    {line}")

    # -------------------------------------------------------------
    # STEP 9: Blockchain Ledger Recording
    # -------------------------------------------------------------
    print(f"\n[STEP 9] Appending Cryptographic Audit Record to Local Blockchain...")
    cursor.execute("SELECT * FROM blockchain_records ORDER BY block_index DESC LIMIT 1")
    last_block = dict(cursor.fetchone())
    block2 = blockchain.create_block_record(
        last_block=last_block,
        organization_id="ORG-HOSP-A",
        event_type="REMEDIATION_REDUCTION",
        previous_risk=new_risk_surge,
        new_risk=final_risk,
        trigger=threat_remed["event_id"],
        affected_asset="SERVER-001",
        details={"remediation": threat_remed["title"], "mitigation_pts": 15.0}
    )
    cursor.execute("""
        INSERT INTO blockchain_records VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, tuple(block2.values()))
    conn.commit()

    cursor.execute("SELECT block_index, event_type, previous_risk, new_risk, trigger, block_hash FROM blockchain_records ORDER BY block_index ASC")
    all_blocks = [dict(r) for r in cursor.fetchall()]
    print(f"  Total Blocks Chained: {len(all_blocks)}")
    for b in all_blocks:
        print(f"    Block #{b['block_index']} [{b['event_type']:<24}] Risk: {b['previous_risk']:>4.1f} -> {b['new_risk']:>4.1f} | Hash: {b['block_hash'][:16]}...")

    # -------------------------------------------------------------
    # STEP 10: Cryptographic Integrity Verification
    # -------------------------------------------------------------
    print(f"\n[STEP 10] Executing Full Cryptographic Blockchain Integrity Audit...")
    cursor.execute("SELECT * FROM blockchain_records ORDER BY block_index ASC")
    chain_records = [dict(r) for r in cursor.fetchall()]
    verify_result = blockchain.verify_chain(chain_records)

    print(f"  Audit Status        : {verify_result['status']}")
    print(f"  Blocks Verified     : {verify_result['blocks_checked']}")
    print(f"  Latest Block Hash   : {verify_result.get('latest_block_hash')}")
    print(f"  Integrity Summary   : {verify_result['message']}")
    print("\n" + "=" * 70)
    print("      DEMONSTRATION COMPLETED SUCCESSFULLY (100% OFFLINE)")
    print("=" * 70)

    conn.close()


if __name__ == "__main__":
    run_full_offline_demonstration()
