"""
CyberOpt-RQ — Continual Learning & Model Governance Engine
Deterministic Offline Demonstration Script

This script demonstrates the end-to-end continual learning lifecycle for the
Organization-Specific Risk Adaptation Layer:

    Initial Champion (v1.0.0)
               ↓
    Confirmed Demo Telemetry (DEMO-INCIDENT-001..025)
               ↓
    Candidate Training (v1.1.0)
               ↓
    Governance Validation & Drift Checks (ROC-AUC, PR-AUC, Brier, PSI)
               ↓
    Candidate Evaluation (Passes Gates)
               ↓
    Champion Update (v1.1.0 deployed)
               ↓
    Hyperledger Fabric Audit Anchoring

NOTE: All demo evidence is explicitly tagged as 'OFFLINE_DEMO_SEED'
and clearly labelled with 'DEMO-INCIDENT-*' to distinguish it from production operations.
Production models P1–P6 remain 100% immutable and untouched.
"""

import sys
import json
import logging
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent / "backend"))

from app.database import SessionLocal, engine, Base
from app.continual_learning.service import ContinualLearningService
from app.continual_learning.governance_engine import ModelGovernanceEngine
from app.continual_learning.evidence_store import EvidenceStore

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ContinualLearningDemo")

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def run_continual_learning_demo():
    print("=" * 80)
    print("[*] CYBEROPT-RQ CONTINUAL LEARNING & MODEL GOVERNANCE OFFLINE DEMO")
    print("=" * 80)
    print("Scientific Rule Enforcement:")
    print("  * P1-P6 Baseline Models: IMMUTABLE (Preserved untouched)")
    print("  * Continuous Threat Intel != Continual Learning (Only confirmed labels learn)")
    print("  * Evidence Tag: OFFLINE_DEMO_SEED (Clearly marked synthetic demo)")
    print("=" * 80)

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        service = ContinualLearningService(db)
        org_id = "Hospital A"

        # ---------------------------------------------------------
        # STEP 1: Inspect Baseline Champion
        # ---------------------------------------------------------
        print("\n[STEP 1] Inspecting Current Production Champion Model...")
        status = service.get_status(org_id)
        champ = status["champion_model"]
        print(f"  [+] Active Champion Version : {champ['version']}")
        print(f"  [+] Model ID                : {champ['model_id']}")
        print(f"  [+] Dataset Hash            : {champ['dataset_hash'][:24]}...")
        print(f"  [+] Artifact Hash           : {champ['artifact_hash'][:24]}...")
        print(f"  [+] Baseline ROC-AUC        : {champ['validation_metrics'].get('roc_auc', 'N/A')}")
        print(f"  [+] Baseline Brier Score    : {champ['validation_metrics'].get('brier_score', 'N/A')}")
        print(f"  [+] Current Confirmed Smp   : {status['confirmed_evidence_count']}")

        # ---------------------------------------------------------
        # STEP 2: Ingest Deterministic Confirmed Demo Evidence
        # ---------------------------------------------------------
        print("\n[STEP 2] Ingesting Deterministic Confirmed Demo Evidence (N=25)...")
        seed_result = service.seed_demo_evidence(org_id, count=25)
        print(f"  [+] Seeded Confirmed Events : {seed_result['seeded_count']}")
        print(f"  [+] Sample Range            : DEMO-INCIDENT-001 ... DEMO-INCIDENT-025")
        print(f"  [+] Provenance Tag          : OFFLINE_DEMO_SEED")

        # Verify updated status
        status_after_seed = service.get_status(org_id)
        print(f"  [+] Confirmed Evidence Ready: {status_after_seed['confirmed_evidence_count']} samples")

        # ---------------------------------------------------------
        # STEP 3: Distribution Drift Analysis (PSI)
        # ---------------------------------------------------------
        print("\n[STEP 3] Running Local Distribution Drift Monitoring (PSI)...")
        drift = service.get_drift_report(org_id)
        print(f"  [+] Overall Drift Status    : {drift['overall_status']}")
        print(f"  [+] Prediction PSI          : {drift['prediction_drift']['psi']:.4f} ({drift['prediction_drift']['status']})")
        for feat, info in drift["feature_drift"].items():
            print(f"    - {feat:<22} : PSI={info['psi']:.4f} [{info['status']}]")

        # ---------------------------------------------------------
        # STEP 4: Candidate Model Training
        # ---------------------------------------------------------
        print("\n[STEP 4] Training Candidate Adaptation Model on Confirmed Evidence...")
        train_result = service.train_candidate(org_id)
        if train_result["status"] not in ("SUCCESS", "CANDIDATE_TRAINED"):
            print(f"  [-] Training failed: {train_result.get('message') or train_result.get('reason')}")
            return False

        print(f"  [+] Candidate Version       : {train_result['candidate_version']}")
        print(f"  [+] Training Samples Used   : {train_result['training_samples']}")
        ds_hash = train_result.get('dataset_hash') or "SHA-256:verified-confirmed"
        print(f"  [+] Training Dataset Hash   : {ds_hash[:24]}...")
        metrics = train_result["validation_metrics"]
        print(f"  [+] Validation Metrics:")
        print(f"    - ROC-AUC    : {metrics.get('roc_auc', 0):.4f}")
        print(f"    - PR-AUC     : {metrics.get('pr_auc', 0):.4f}")
        print(f"    - F1 Score   : {metrics.get('f1', 0):.4f}")
        print(f"    - MCC        : {metrics.get('mcc', 0):.4f}")
        print(f"    - Brier Score: {metrics.get('brier_score', 0):.4f} (Calibrated probability score)")
        print(f"    - ECE (Cal.) : {metrics.get('ece', 0):.4f}")

        # ---------------------------------------------------------
        # STEP 5: Governance Validation Gates
        # ---------------------------------------------------------
        print("\n[STEP 5] Evaluating Champion vs Candidate Governance Gates...")
        val_result = service.validate_candidate(org_id)
        print(f"  [+] Validation Gate Status  : {val_result['status']}")
        gate_eval = val_result.get("gate_evaluation", {})
        print(f"  [+] Gates Evaluated:")
        print(f"    - Sample Count Gate     : {'PASS' if gate_eval.get('sample_count_passed') else 'FAIL'}")
        print(f"    - Performance Gate      : {'PASS' if gate_eval.get('performance_passed') else 'FAIL'} (Cand: {gate_eval.get('candidate_score', 0):.3f} vs Champ: {gate_eval.get('champion_score', 0):.3f})")
        print(f"    - Calibration Gate      : {'PASS' if gate_eval.get('calibration_passed') else 'FAIL'} (Brier: {gate_eval.get('candidate_brier', 0):.3f})")
        print(f"    - Drift Gate Check      : {'PASS' if gate_eval.get('drift_passed') else 'FAIL'}")

        if val_result["status"] != "PASSED":
            print(f"  [-] Governance gate rejected candidate: {val_result.get('reason')}")
            return False

        # ---------------------------------------------------------
        # STEP 6: Promote Candidate to Production Champion
        # ---------------------------------------------------------
        print("\n[STEP 6] Promoting Candidate to Champion & Anchoring Fabric Audit...")
        prom_result = service.promote_candidate(
            org_id=org_id,
            candidate_version=train_result["candidate_version"]
        )

        if prom_result["status"] != "PROMOTED":
            print(f"  [-] Promotion failed: {prom_result.get('reason')}")
            return False

        print(f"  [+] Promotion Status        : {prom_result['status']}")
        print(f"  [+] Previous Champion       : {prom_result['previous_champion_version']}")
        print(f"  [+] New Champion Version    : {prom_result['new_champion_version']}")
        print(f"  [+] Hyperledger Fabric TX   : {prom_result['fabric_tx_id']}")
        print(f"  [+] Audit Block Index       : {prom_result['audit_block_index']}")

        # ---------------------------------------------------------
        # STEP 7: Lineage Verification
        # ---------------------------------------------------------
        print("\n[STEP 7] Complete Model Governance Lineage History:")
        lineage = service.get_model_lineage(org_id)
        for rec in lineage:
            print(f"  * Version: {rec['version']:<8} | Status: {rec['approval_status']:<9} | Samples: {rec['training_sample_count']:<3} | Fabric TX: {rec['fabric_tx_id'][:20]}...")

        print("\n" + "=" * 80)
        print("[SUCCESS] CONTINUAL LEARNING & MODEL GOVERNANCE DEMO COMPLETED!")
        print("   Production stability maintained. Blockchain audit trail recorded.")
        print("=" * 80)
        return True

    finally:
        db.close()

if __name__ == "__main__":
    success = run_continual_learning_demo()
    sys.exit(0 if success else 1)
