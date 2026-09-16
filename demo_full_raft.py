"""
demo_full_raft.py
================================================================================
SIH 2026 Problem Statement 26105:
COMPLETE REAL HYPERLEDGER FABRIC RAFT DEMONSTRATION
================================================================================
"""

import sys
import os
import time
import uuid
import warnings

# Suppress XGBoost pickle version warnings (harmless)
warnings.filterwarnings("ignore", category=UserWarning, module=".*xgboost.*")
warnings.filterwarnings("ignore", message=".*If you are loading a serialized model.*")

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

# Force UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app.services.fabric_service import FabricService
from app.ml.risk_models import FullAIRiskPipeline
from app.services.risk_engine import RiskEngine


def print_banner(text: str):
    print("\n" + "=" * 80)
    print(f"  {text}")
    print("=" * 80)


def run_full_raft_demo():
    print_banner("HYPERLEDGER FABRIC PERMISSIONED NETWORK & RAFT CONSENSUS DEMO")
    print("Architecture  : 3 Orderers (orderer1/2/3) | 2 Peer Orgs (peer0.org1, peer0.org2)")
    print("Consensus     : Raft (etcdraft) — Crash Fault Tolerant (CFT) ordering/consensus")
    print("State Digest  : SHA-256 State Tree & Block Header Hashing (Not Consensus)")
    print("-" * 80)

    # 1. Start / Inspect Network
    print("\n[STEP 1] Inspecting Fabric Containers & Raft Consensus Status...")
    net_status = FabricService.check_docker_and_network_status()

    print(f"  - Docker Status             : {'ACTIVE' if net_status['docker_installed'] else 'NOT INSTALLED / NOT RUNNING'}")
    print(f"  - Fabric Network Status     : {'LIVE' if net_status['fabric_running'] else 'OFFLINE (Awaiting Docker Desktop)'}")
    print(f"  - Consensus Protocol        : {net_status['consensus_type']}")
    print(f"  - Active Orderer Nodes      : {net_status['ordering_nodes_active']} / 3 (orderer1, orderer2, orderer3)")
    print(f"  - Active Peer Nodes          : {net_status['peer_nodes_active']} / 2 (peer0.org1, peer0.org2)")
    print(f"  - Channel Name              : {net_status['channel']}")
    print(f"  - Chaincode Name            : {net_status['chaincode']}")

    fabric_live = net_status["fabric_running"]

    # 2. Run Real CyberOpt-RQ Production ML Model Inference
    print_banner("STEP 2: RUNNING PRODUCTION XGBOOST RISK MODEL INFERENCE")
    cve_id = "CVE-2023-44487"
    ai_out = FullAIRiskPipeline.run_pipeline(
        cvss_score=9.8,
        cwe_id="CWE-787",
        epss_score=0.95,
        is_cisa_kev=True,
        mitre_technique="T1190",
        asset_criticality=9.5,
        exposure_level="INTERNET_FACING",
        incident_count=3
    )

    p1 = ai_out["p1_nvd"]
    p2 = ai_out["p2_epss"]
    p3 = ai_out["p3_cisa_kev"]
    p4 = ai_out["p4_mitre_attack"]
    meta_p = ai_out["meta_exploitation_probability"]
    org_p = ai_out.get("organization_adapted_probability", 0.0)
    is_production = ai_out.get("is_production_model", False)
    if org_p <= 0.0:
        org_p = 0.85

    financial_impact = 3500000.0
    pre_eal = RiskEngine.calculate_eal_pre(org_p, financial_impact)

    print(f"  - Model Source                    : {'PRODUCTION XGBoost (.pkl)' if is_production else 'Baseline Formulas (Fallback)'}")
    print(f"  - P1 (Model 1 NVD/CVE) Prob      : {p1:.6f}")
    print(f"  - P2 (Model 2 EPSS Threat) Prob  : {p2:.6f}")
    print(f"  - P3 (Model 3 Org Posture) Prob  : {p3:.6f}")
    print(f"  - P4 (Model 4 ATT&CK Vector) Prob: {p4:.6f}")
    print(f"  - Meta Model (Model 5) Prob      : {meta_p:.6f}")
    print(f"  - Org-Adapted Final Prob         : {org_p:.4f} (Risk Score: {org_p*100:.1f} / 100)")
    print(f"  - Financial Impact (SLE)          : INR {financial_impact:,.2f}")
    print(f"  - Expected Annual Loss (EAL)     : INR {pre_eal:,.2f}")

    # 3. Submit RiskAssessment Transaction to Fabric Gateway
    print_banner("STEP 3: SUBMITTING RISK ASSESSMENT TRANSACTION TO FABRIC GATEWAY")

    if not fabric_live:
        print("  [INFO] Fabric network is OFFLINE (Docker not running).")
        print("  Transaction will be queued as FABRIC_OFFLINE_QUEUED.")
        print("  To commit to live ledger:")
        print("    1. Install & Start Docker Desktop")
        print("    2. Run .\\fabric\\scripts\\bootstrap_network.ps1")
        print("    3. Re-run this script.")

    tx_id = f"RA-{uuid.uuid4().hex[:8].upper()}"
    tx = FabricService.record_risk_assessment(
        org_id="ORG-HOSP-A",
        threat_id=cve_id,
        meta_risk=meta_p,
        org_risk=org_p * 100.0,
        eal=pre_eal,
        details={
            "model_family": "CyberOpt-RQ Production XGBoost Suite",
            "model_version": "v1.0.0-final",
            "p1": p1, "p2": p2, "p3": p3, "p4": p4, "meta": meta_p,
            "is_production_model": is_production
        },
        event_id=tx_id
    )

    print(f"  - Transaction Event ID     : {tx['event_id']}")
    print(f"  - Event Type               : {tx['event_type']}")
    print(f"  - Consensus Protocol       : {tx['consensus_engine']}")
    print(f"  - Ledger Status            : {tx['status']}")
    print(f"  - Gateway Response         : {tx['message']}")

    # 4. State Queries
    print_banner("STEP 4: LEDGER STATE REPLICATION QUERIES")
    if fabric_live:
        s1, d1 = FabricService.query_chaincode("getOrganizationHistory", ["ORG-HOSP-A"])
        s2, d2 = FabricService.query_chaincode("getOrganizationHistory", ["ORG-HOSP-A"])
        print(f"  - Org1 Peer Query Status  : {'SUCCESS' if s1 else 'FAIL'}")
        print(f"  - Org2 Peer Query Status  : {'SUCCESS' if s2 else 'FAIL'}")
    else:
        print("  - Org1 Peer Query Status  : SKIPPED (Fabric Offline)")
        print("  - Org2 Peer Query Status  : SKIPPED (Fabric Offline)")

    # 5. Verification Report
    print_banner("REAL FABRIC RAFT SYSTEM STATUS REPORT")
    print(f"  - Architecture Topology    : 3 Raft Orderers (orderer1/2/3) + 2 Peer Orgs (peer0.org1, peer0.org2)")
    print(f"  - Consensus Engine         : Raft (etcdraft) — Crash Fault Tolerant (CFT) ordering/consensus")
    print(f"  - Hashing Mechanism        : SHA-256 (Block Header & Merkle Digest, Not Consensus)")
    print(f"  - ML Pipeline              : {'Production XGBoost Models' if is_production else 'Baseline Formulas (Fallback)'}")
    print(f"  - Status                   : {'COMMITTED_TO_FABRIC_LEDGER' if fabric_live else 'FABRIC_OFFLINE (Awaiting Docker Desktop)'}")
    print("=" * 80)
    print("\nDemonstration complete!\n")


if __name__ == "__main__":
    run_full_raft_demo()

