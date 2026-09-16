import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal, Base, engine
from app.ml.risk_models import FullAIRiskPipeline
from app.services.risk_engine import RiskEngine
from app.services.optimizer import OptimizationEngine
from app.services.ledger import LedgerService
from app.models.db_models import SecurityControl, Asset, Vulnerability, IncidentHistory

Base.metadata.create_all(bind=engine)

def test_full_sih_pipeline():
    print("=== Testing CyberOpt-RQ Solution Pipeline (SIH PS-26105) ===")
    
    # 1. Test AI Ensemble Risk Pipeline (P1-P4 -> Meta Model -> Org Adaptation)
    print("\nStep 1 & 2: Testing Public Data & AI Risk Models (P1-P4 + Meta + Org):")
    ai_output = FullAIRiskPipeline.run_pipeline(
        cvss_score=9.8,
        cwe_id="CWE-787",
        epss_score=0.88,
        is_cisa_kev=True,
        mitre_technique="T1190",
        asset_criticality=9.0,
        exposure_level="INTERNET_FACING",
        incident_count=2
    )
    print("P1 (NVD / CVSS / CWE):", ai_output["p1_nvd"])
    print("P2 (EPSS Score):", ai_output["p2_epss"])
    print("P3 (CISA KEV Score):", ai_output["p3_cisa_kev"])
    print("P4 (MITRE ATT&CK Score):", ai_output["p4_mitre_attack"])
    print("Meta Model Ensemble Probability:", ai_output["meta_exploitation_probability"])
    print("Org-Adapted Final Probability:", ai_output["organization_adapted_probability"])
    assert 0.0 <= ai_output["organization_adapted_probability"] <= 1.0
    print("-> AI Risk Models Test PASSED!")

    # 2. Test Quantitative Risk Engine (EAL & ROSI)
    print("\nStep 3: Testing Risk Quantification (EAL & ROSI):")
    prob = ai_output["organization_adapted_probability"]
    impact = 3500000.0
    eal_pre = RiskEngine.calculate_eal_pre(prob, impact)
    print(f"Pre-Control EAL (P * Impact): INR {eal_pre:,.2f}")
    
    ctrl = SecurityControl(id="CTRL-002", code="EDR", name="Automated EDR Guard", category="EDR", cost=200000.0, effectiveness=0.90)
    eval_res = RiskEngine.evaluate_risk_profile(prob, impact, [ctrl])
    print("Post-Control Residual EAL:", eval_res["eal_post"])
    print(f"Risk Reduction: INR {eval_res['risk_reduction']:,.2f} ({eval_res['risk_reduction_pct']}%)")
    print(f"ROSI: {eval_res['rosi']}%")
    assert eval_res["eal_post"] < eal_pre
    print("-> Quantitative Risk Engine Test PASSED!")

    # 3. Test PuLP Optimization Engine
    print("\nSteps 4 & 5: Testing PuLP Budget Optimization Engine:")
    controls = [
        SecurityControl(id="CTRL-1", code="C1", name="Zero-Trust Microsegmentation", category="Firewall", cost=300000.0, effectiveness=0.85),
        SecurityControl(id="CTRL-2", code="C2", name="Automated EDR Patching", category="EDR", cost=200000.0, effectiveness=0.90),
        SecurityControl(id="CTRL-3", code="C3", name="Cloud Next-Gen WAF", category="WAF", cost=250000.0, effectiveness=0.75),
        SecurityControl(id="CTRL-4", code="C4", name="FIDO2 Hardware Key MFA", category="IAM", cost=100000.0, effectiveness=0.95),
    ]
    opt_res = OptimizationEngine.optimize_security_budget(
        available_budget=1000000.0,
        controls=controls,
        pre_eal=3500000.0
    )
    print("Budget Ceiling: INR 1,000,000.00")
    print("Selected Control IDs:", [c.id for c in opt_res["selected_controls"]])
    print(f"Total Investment Cost: INR {opt_res['total_cost']:,.2f}")
    print(f"Expected Risk Reduction: INR {opt_res['risk_reduction']:,.2f}")
    print(f"ROSI: {opt_res['rosi']}%")
    assert opt_res["total_cost"] <= 1000000.0
    print("-> PuLP Optimization Engine Test PASSED!")

    # 4. Test Blockchain Audit Ledger
    print("\nBlockchain Audit Trail: Testing Cryptographic Hash Verification:")
    db = SessionLocal()
    is_valid, msg, count = LedgerService.verify_chain_integrity(db)
    print(f"Ledger Verification Status: {is_valid} | {msg} | Total Blocks: {count}")
    assert is_valid == True
    db.close()
    print("-> Blockchain Audit Trail Test PASSED!")

    print("\n=======================================================")
    print("ALL SIH PS-26105 SYSTEM PIPELINE TESTS PASSED!")
    print("=======================================================")

if __name__ == "__main__":
    test_full_sih_pipeline()
