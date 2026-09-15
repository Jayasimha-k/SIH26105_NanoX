import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.ml.orchestrator import orchestrator
from app.services.risk_engine import RiskEngine
from app.services.optimizer import OptimizationEngine
from app.services.ledger import LedgerService
from app.models.db_models import SecurityControl

def test_full_system():
    print("=== Testing CyberOpt-RQ Core System Components ===")
    
    # 1. Test ML Orchestrator
    print("\n1. Testing ML Orchestrator (4 Base Models + Meta-Model):")
    sample_features = {
        "cvss_score": 9.8,
        "epss_score": 0.88,
        "cisa_kev": True,
        "criticality_score": 9.0,
        "financial_value": 8500000.0,
        "exposure_level": "INTERNET_FACING"
    }
    ml_output = orchestrator.run_pipeline(sample_features)
    print("Base Model Predictions:", ml_output["base_model_predictions"])
    print("Meta-Model Synthesized Prediction:", ml_output["meta_model_prediction"])
    print("Final Exploitation Probability P(exploit):", ml_output["final_exploitation_probability"])
    assert "model_1" in ml_output["base_model_predictions"]
    assert "model_4" in ml_output["base_model_predictions"]
    assert 0.0 <= ml_output["final_exploitation_probability"] <= 1.0
    print("-> ML Orchestrator Test PASSED!")

    # 2. Test Risk Engine
    print("\n2. Testing Quantitative Risk Engine (EAL & ROSI):")
    prob = ml_output["final_exploitation_probability"]
    impact = 3500000.0
    eal_pre = RiskEngine.calculate_eal_pre(prob, impact)
    print(f"Pre-Control EAL (P * Impact): INR {eal_pre:,.2f}")
    
    ctrl = SecurityControl(id="TEST-CTRL", code="TEST", name="Test Control", category="Test", cost=200000.0, effectiveness=0.85)
    eval_res = RiskEngine.evaluate_risk_profile(prob, impact, [ctrl])
    print("Post-Control Evaluation:", eval_res)
    assert eval_res["eal_post"] < eal_pre
    assert eval_res["risk_reduction"] > 0
    print("-> Quantitative Risk Engine Test PASSED!")

    # 3. Test PuLP Optimizer
    print("\n3. Testing PuLP Integer Linear Programming Optimization Engine:")
    controls = [
        SecurityControl(id="CTRL-1", code="C1", name="Control 1", category="Cat", cost=300000.0, effectiveness=0.80),
        SecurityControl(id="CTRL-2", code="C2", name="Control 2", category="Cat", cost=200000.0, effectiveness=0.75),
        SecurityControl(id="CTRL-3", code="C3", name="Control 3", category="Cat", cost=600000.0, effectiveness=0.90),
        SecurityControl(id="CTRL-4", code="C4", name="Control 4", category="Cat", cost=100000.0, effectiveness=0.50),
    ]
    opt_res = OptimizationEngine.optimize_security_budget(
        available_budget=1000000.0,
        controls=controls,
        pre_eal=3000000.0
    )
    print("Budget Ceiling: INR 1,000,000.00")
    print("Selected Control IDs:", [c.id for c in opt_res["selected_controls"]])
    print(f"Total Selected Cost: INR {opt_res['total_cost']:,.2f}")
    print(f"Projected Risk Reduction: INR {opt_res['risk_reduction']:,.2f}")
    print(f"ROSI: {opt_res['rosi']}%")
    assert opt_res["total_cost"] <= 1000000.0
    print("-> PuLP Optimization Engine Test PASSED!")

    # 4. Test Blockchain Audit Ledger
    print("\n4. Testing Cryptographic Blockchain Audit Ledger:")
    db = SessionLocal()
    is_valid, msg, count = LedgerService.verify_chain_integrity(db)
    print(f"Ledger Verification Status: {is_valid} | {msg} | Total Blocks: {count}")
    assert is_valid == True
    assert count > 0
    db.close()
    print("-> Blockchain Audit Ledger Test PASSED!")

    print("\n=======================================================")
    print("ALL CORE ENGINE SYSTEM TESTS PASSED SUCCESSFULLY!")
    print("=======================================================")

if __name__ == "__main__":
    test_full_system()
