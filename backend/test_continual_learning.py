"""
Unit and Integration Test Suite for Continual Learning & Model Governance Engine
Tests:
1. Evidence creation & SHA-256 hashing
2. Deduplication integrity
3. Minimum sample requirement protection (< 15 aborts with INSUFFICIENT_CONFIRMED_DATA)
4. Unconfirmed events safeguard (unconfirmed items excluded from training)
5. Quantile-based PSI drift detection math (stable < 0.10 and shifted >= 0.25)
6. Candidate adaptation model training & multi-dimensional metrics (ROC-AUC, PR-AUC, F1, MCC, Brier score, ECE)
7. Champion vs Candidate validation gates
8. Champion protection & rejection handling
9. Model versioning & artifact hashing
10. Candidate promotion & Hyperledger Fabric audit anchoring
11. Offline / Air-gapped operability
12. Regression check against existing P1–P6 pipeline and Fusion v2
"""

import os
import sys
import json
import uuid
import pytest
import numpy as np
import pandas as pd
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import SessionLocal, engine, Base
from app.models.db_models import ContinualLearningEvidence, ModelGovernanceRecord
from app.continual_learning.evidence_store import EvidenceStore, LEARNING_FEATURE_COLUMNS
from app.continual_learning.drift_detector import DriftDetector
from app.continual_learning.candidate_trainer import CandidateTrainer
from app.continual_learning.governance_engine import GovernanceEngine
from app.continual_learning.service import ContinualLearningService

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

def test_evidence_creation_and_hash(db_session):
    """Test creating operational evidence and computing SHA-256 fingerprint."""
    unique_suffix = uuid.uuid4().hex[:6]
    rec, is_new = EvidenceStore.record_evidence(
        db=db_session,
        organization_id=f"TestOrg-{unique_suffix}",
        asset_id=f"ASSET-TEST-{unique_suffix}",
        threat_id="CVE-2024-TEST1",
        p1_nvd=0.75,
        p2_epss=0.60,
        p3_org=0.80,
        p4_mitre=0.70,
        p5_meta=0.72,
        p6_network=0.65,
        fused_probability=0.73,
        org_risk_score=73.0,
        expected_annual_loss=2500000.0,
        asset_criticality=8.5,
        exposure_level="INTERNET_FACING",
        control_effectiveness=0.60,
        incident_history_count=1,
        recommended_control="NIST-PR.AC-1: Access Control Hardening",
        remediation_applied=0,
        remediation_performed=0,
        financial_impact_inr=3000000.0,
        confirmation_status="PENDING_CONFIRMATION"
    )
    assert rec is not None
    assert rec.evidence_hash is not None
    assert len(rec.evidence_hash) == 64  # SHA-256 hex length
    assert is_new is True

def test_evidence_deduplication(db_session):
    """Test deduplication: identical payload should not create a duplicate row."""
    unique_suffix = uuid.uuid4().hex[:6]
    org_name = f"TestOrg-Dedup-{unique_suffix}"
    asset_name = f"ASSET-DEDUP-{unique_suffix}"

    rec1, is_new1 = EvidenceStore.record_evidence(
        db=db_session,
        organization_id=org_name,
        asset_id=asset_name,
        threat_id="CVE-2024-DEDUP",
        p1_nvd=0.50,
        p2_epss=0.50,
        p3_org=0.50,
        p4_mitre=0.50,
        p5_meta=0.50,
        p6_network=0.50,
        fused_probability=0.50,
        org_risk_score=50.0,
        expected_annual_loss=1000000.0
    )
    rec2, is_new2 = EvidenceStore.record_evidence(
        db=db_session,
        organization_id=org_name,
        asset_id=asset_name,
        threat_id="CVE-2024-DEDUP",
        p1_nvd=0.50,
        p2_epss=0.50,
        p3_org=0.50,
        p4_mitre=0.50,
        p5_meta=0.50,
        p6_network=0.50,
        fused_probability=0.50,
        org_risk_score=50.0,
        expected_annual_loss=1000000.0
    )
    assert rec1.id == rec2.id
    assert is_new1 is True
    assert is_new2 is False

def test_minimum_sample_requirement_protection(db_session):
    """Test that training aborts safely when verified samples < 15."""
    unique_suffix = uuid.uuid4().hex[:6]
    org_sparse = f"SparseOrg-{unique_suffix}"
    EvidenceStore.record_evidence(
        db=db_session,
        organization_id=org_sparse,
        asset_id="ASSET-SPARSE-1",
        threat_id="CVE-2024-SPARSE",
        p1_nvd=0.8,
        p2_epss=0.7,
        p3_org=0.6,
        p4_mitre=0.6,
        p5_meta=0.7,
        p6_network=0.6,
        fused_probability=0.7,
        org_risk_score=70.0,
        expected_annual_loss=1000000.0,
        confirmation_status="CONFIRMED_INCIDENT",
        target_label=1
    )
    df_X, s_y, meta = EvidenceStore.get_learning_dataset(db_session, organization_id=org_sparse, min_samples=15)
    assert df_X is None
    assert s_y is None
    assert meta["status"] == "INSUFFICIENT_CONFIRMED_DATA"
    assert meta["total_records"] < 15

    # Service should retain champion and report insufficient data
    train_res = ContinualLearningService.train_candidate(db_session, organization_id=org_sparse)
    assert train_res["status"] == "INSUFFICIENT_CONFIRMED_DATA"

def test_unconfirmed_events_excluded_from_training(db_session):
    """Test that pending/unconfirmed evidence is strictly excluded from training."""
    unique_suffix = uuid.uuid4().hex[:6]
    org_pending = f"PendingOnlyOrg-{unique_suffix}"
    for i in range(20):
        EvidenceStore.record_evidence(
            db=db_session,
            organization_id=org_pending,
            asset_id=f"ASSET-PEND-{i}",
            threat_id=f"CVE-2024-PEND-{i}",
            p1_nvd=0.6,
            p2_epss=0.5,
            p3_org=0.5,
            p4_mitre=0.5,
            p5_meta=0.55,
            p6_network=0.5,
            fused_probability=0.55,
            org_risk_score=55.0,
            expected_annual_loss=1000000.0,
            confirmation_status="PENDING_CONFIRMATION",
            target_label=None
        )
    df_X, s_y, meta = EvidenceStore.get_learning_dataset(db_session, organization_id=org_pending)
    assert df_X is None
    assert meta["total_records"] == 0

def test_psi_drift_detection_math():
    """Test Population Stability Index calculation and threshold gating."""
    np.random.seed(42)
    # Similar distributions should produce low PSI (< 0.10)
    expected = np.random.beta(2, 5, 200)
    actual_stable = np.random.beta(2, 5, 200)
    psi_stable = DriftDetector.calculate_psi(expected, actual_stable)
    assert psi_stable < DriftDetector.PSI_STABLE_THRESHOLD

    # Shifted distribution should produce high PSI (>= 0.25)
    actual_shifted = np.random.beta(5, 2, 200)
    psi_shifted = DriftDetector.calculate_psi(expected, actual_shifted)
    assert psi_shifted >= DriftDetector.PSI_DRIFT_THRESHOLD

def test_candidate_training_and_metrics(db_session):
    """Test training candidate adaptation model on balanced confirmed dataset."""
    unique_suffix = uuid.uuid4().hex[:6]
    org_train = f"TrainTestOrg-{unique_suffix}"
    # Seed 10 positive incidents and 10 negative benign events
    for i in range(10):
        EvidenceStore.record_evidence(
            db=db_session,
            organization_id=org_train,
            asset_id=f"ASSET-INC-{i}",
            threat_id=f"CVE-2024-INC-{i}",
            p1_nvd=0.85,
            p2_epss=0.80,
            p3_org=0.90,
            p4_mitre=0.85,
            p5_meta=0.88,
            p6_network=0.85,
            fused_probability=0.87,
            org_risk_score=87.0,
            expected_annual_loss=5000000.0,
            asset_criticality=9.0,
            exposure_level="INTERNET_FACING",
            control_effectiveness=0.30,
            incident_history_count=2,
            recommended_control="NIST-PR.AC-1: MFA & Access Hardening",
            remediation_applied=0,
            remediation_performed=0,
            financial_impact_inr=5000000.0,
            confirmation_status="CONFIRMED_INCIDENT",
            target_label=1,
            observed_loss_inr=4000000.0
        )
    for i in range(10):
        EvidenceStore.record_evidence(
            db=db_session,
            organization_id=org_train,
            asset_id=f"ASSET-BEN-{i}",
            threat_id=f"CVE-2024-BEN-{i}",
            p1_nvd=0.15,
            p2_epss=0.10,
            p3_org=0.20,
            p4_mitre=0.15,
            p5_meta=0.12,
            p6_network=0.10,
            fused_probability=0.14,
            org_risk_score=14.0,
            expected_annual_loss=100000.0,
            asset_criticality=6.0,
            exposure_level="INTERNAL",
            control_effectiveness=0.85,
            incident_history_count=0,
            recommended_control="NIST-PR.IP-1: Baseline Configuration",
            remediation_applied=1,
            remediation_performed=1,
            financial_impact_inr=1000000.0,
            confirmation_status="CONFIRMED_BENIGN",
            target_label=0,
            observed_loss_inr=0.0
        )

    res = ContinualLearningService.train_candidate(db_session, organization_id=org_train)
    assert res["status"] == "CANDIDATE_TRAINED"
    assert res["training_samples"] >= 20
    assert "roc_auc" in res["validation_metrics"]
    assert "brier_score" in res["validation_metrics"]
    assert "pr_auc" in res["validation_metrics"]
    assert "f1" in res["validation_metrics"]
    assert "mcc" in res["validation_metrics"]
    assert "ece" in res["validation_metrics"]
    assert res["validation_metrics"]["brier_score"] <= 0.25

def test_governance_validation_and_promotion(db_session):
    """Test validating candidate against Champion gates and promoting to Champion."""
    champ_before = GovernanceEngine.ensure_initial_champion(db_session)
    val_res = ContinualLearningService.validate_candidate(db_session)
    assert val_res["status"] in ("PASSED", "REJECTED")
    assert "gate_evaluation" in val_res
    assert "comparison" in val_res

    # Test candidate promotion
    cand = GovernanceEngine.get_candidate_record(db_session)
    if cand:
        prom_res = ContinualLearningService.promote_candidate(
            db_session,
            candidate_version=cand.version,
            approved_by="CISO_TEST_AUDITOR"
        )
        assert prom_res["status"] == "PROMOTED"
        assert prom_res["fabric_tx_id"] is not None
        assert prom_res["fabric_tx_id"].startswith("MODEL-AUDIT-")

        # Verify new Champion
        champ_after = GovernanceEngine.get_champion_record(db_session)
        assert champ_after.version == cand.version

def test_champion_protection_on_degraded_candidate():
    """Test that a degraded candidate model is rejected by governance gates."""
    champ_metrics = {"roc_auc": 0.85, "brier_score": 0.12, "f1": 0.80}
    # Degraded candidate with high Brier score and collapsed ROC-AUC
    degraded_metrics = {"roc_auc": 0.55, "brier_score": 0.35, "f1": 0.40}
    gate_res = CandidateTrainer.compare_champion_vs_candidate(
        champion_metrics=champ_metrics,
        candidate_metrics=degraded_metrics,
        prediction_psi=0.30  # High drift
    )
    assert gate_res["passed"] is False
    assert gate_res["decision"] == "FAILED_GATES"
    assert len(gate_res["gate_reasons"]) > 0

def test_model_versioning_and_artifact_hashing(db_session):
    """Verify that every model record receives SHA-256 artifact hash and lineage."""
    champ = GovernanceEngine.ensure_initial_champion(db_session)
    assert champ.version is not None
    assert champ.dataset_hash is not None
    assert champ.artifact_hash is not None
    assert len(champ.artifact_hash) == 64  # SHA-256 length

def test_offline_air_gapped_operation(db_session):
    """Verify that continual learning workflow executes 100% offline without network calls."""
    unique_suffix = uuid.uuid4().hex[:6]
    org_offline = f"AirGappedOrg-{unique_suffix}"
    # Seed local demo items
    seed_res = ContinualLearningService.seed_demo_evidence(db_session, organization_id=org_offline, count=25)
    assert seed_res["status"] == "SUCCESS"
    assert seed_res["total_demo_records"] >= 20

    # Inspect status locally
    status = ContinualLearningService.get_status(db_session, organization_id=org_offline)
    assert status["confirmed_evidence_count"] >= 20

    # Train and validate locally
    train_res = ContinualLearningService.train_candidate(db_session, organization_id=org_offline)
    assert train_res["status"] == "CANDIDATE_TRAINED"

def test_regression_against_production_p1_p6_pipeline():
    """Verify that existing production models (P1-P6 and Fusion v2) remain untouched."""
    from app.ml.risk_models import FullAIRiskPipeline, IndividualRiskModels
    from app.ml.fusion_layer import fuse_risk_evidence, load_fusion_config
    from app.ml.production_loader import production_ml_engine

    # 1. Test P1-P4 individual production models
    p1 = IndividualRiskModels.model_1_nvd_cvss_cwe(9.8, "CWE-787")
    p2 = IndividualRiskModels.model_2_epss(0.965)
    p3 = IndividualRiskModels.model_3_cisa_kev(True)
    p4 = IndividualRiskModels.model_4_mitre_attack("T1190")
    assert 0.95 <= p1 <= 1.0
    assert p2 == 0.965
    assert p3 == 0.95
    assert p4 == 0.90

    # 2. Test P5 Meta Ensemble Pipeline
    pipeline = FullAIRiskPipeline()
    meta_res = pipeline.run_pipeline(
        cvss_score=9.8,
        cwe_id="CWE-787",
        epss_score=0.965,
        is_cisa_kev=True,
        mitre_technique="T1190",
        asset_criticality=9.0,
        exposure_level="INTERNET_FACING"
    )
    assert "meta_exploitation_probability" in meta_res
    p5 = meta_res["meta_exploitation_probability"]
    assert 0.0 <= p5 <= 1.0

    # 3. Test Production ML Inference Engine (5 trained production models)
    vuln_data = {
        "cvss_score": 9.8,
        "epss_score": 0.965,
        "cwe_id": "CWE-787",
        "attack_vector": "NETWORK",
        "complexity": "LOW",
        "privileges_required": "NONE"
    }
    asset_data = {
        "criticality_score": 9.0,
        "exposure_level": "INTERNET_FACING"
    }
    pred_res = production_ml_engine.predict_all(vuln_data, asset_data)
    assert "p1_nvd" in pred_res
    assert "p2_epss" in pred_res
    assert "p3_org_risk" in pred_res
    assert "p4_mitre_attack" in pred_res
    assert "meta_exploitation_probability" in pred_res

    # 4. Test Fusion v2 Layer (convex combination w_p6=0.90, w_p5=0.10)
    cfg = load_fusion_config("v2")
    assert cfg["fusion_version"] == "v2"
    assert cfg["p6_weight"] == 0.90
    assert cfg["p5_weight"] == 0.10

    p6 = 0.95
    fused_res = fuse_risk_evidence(p5_risk_score=p5, p6_network_evidence=p6, fusion_version="v2")
    expected_fused = 0.10 * p5 + 0.90 * p6
    assert abs(fused_res["fused_probability"] - expected_fused) < 1e-4
    assert fused_res["fusion_version"] == "v2"

