"""
backend/test_attack_eal_and_newsletters.py
Comprehensive test suite verifying:
1. At least 5 CISO newsletters and at least 5 CFO newsletters are present, parseable, and extract structured intelligence.
2. Attack demo dynamically updates EAL in pipeline, memory, and database RiskAssessment records.
3. Relevance engine and review queue calculate attack-updated surge EAL.
4. End-to-end continual learning demonstrates candidate model calibration, gate evaluation, and promotion.

NOTE on Fabric audit statuses:
  - 'COMMITTED_TO_FABRIC_LEDGER': Fabric network live and transaction committed via Raft consensus.
  - 'LOCAL_LEDGER_ANCHORED': Fabric offline; record committed to local SQLite audit log.
  - 'FABRIC_OFFLINE_QUEUED': Fabric offline (no Docker); record queued for future anchoring.
In CI/test environments without Docker, 'FABRIC_OFFLINE_QUEUED' is the expected honest status.
"""

import os
import glob
import pytest
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.db_models import (
    Organization,
    Asset,
    Vulnerability,
    RiskAssessment,
    IntelligenceEventRecord,
    FinancialIntelligenceRecord,
    ContinualLearningEvidence,
    ModelGovernanceRecord
)
from app.intelligence.service import IntelligenceService
from app.intelligence.email_parser import EmailParser
from app.intelligence.source_detector import SourceDetector
from app.intelligence.content_extractor import ContentExtractor
from app.intelligence.relevance_engine import RelevanceEngine
from app.intelligence.review_engine import ReviewEngine
from app.api.routers.demo import start_attack_demo, complete_attack_demo, reset_attack_demo, AttackStartRequest, AttackCompleteRequest, _attack_state

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DEMO_EMAILS_DIR = os.path.join(REPO_ROOT, "data", "intelligence", "demo_emails")


@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        IntelligenceService.ensure_default_organization(session)
        yield session
    finally:
        session.close()


def test_at_least_five_ciso_and_five_cfo_newsletters():
    """Validates that at least 5 CISO newsletters and 5 CFO newsletters exist as valid .eml files."""
    eml_files = glob.glob(os.path.join(DEMO_EMAILS_DIR, "*.eml"))
    assert len(eml_files) >= 10, f"Expected at least 10 demo emails, found {len(eml_files)}"

    ciso_count = 0
    cfo_count = 0

    for fpath in eml_files:
        parsed = EmailParser.parse_eml_file(fpath)
        assert parsed["sender"], f"Sender missing in {fpath}"
        assert parsed["subject"], f"Subject missing in {fpath}"
        assert len(parsed["body_text"]) > 50, f"Body text too short in {fpath}"

        source_info = SourceDetector.detect_source(parsed["sender"], parsed["subject"], parsed["body_text"])
        if source_info["category"] == "FINANCIAL":
            cfo_count += 1
            fin_intel = ContentExtractor.extract_financial_intelligence(parsed["body_text"], parsed["subject"], source_info["source_name"])
            assert fin_intel["company"] != "UNKNOWN" or fin_intel["sector"] != "UNKNOWN"
            assert fin_intel["expected_return"] == "UNKNOWN"  # Strict scientific honesty
        else:
            ciso_count += 1
            cyber_intel = ContentExtractor.extract_cyber_intelligence(parsed["body_text"], parsed["subject"], source_info["source_name"])
            assert cyber_intel["cve"] != "UNKNOWN" or cyber_intel["vendor"] != "UNKNOWN"

    print(f"\n[+] Verified Newsletters: {ciso_count} CISO newsletters, {cfo_count} CFO newsletters.")
    assert ciso_count >= 5, f"Expected at least 5 CISO newsletters, found {ciso_count}"
    assert cfo_count >= 5, f"Expected at least 5 CFO newsletters, found {cfo_count}"


def test_attack_updates_eal_and_database(db_session: Session):
    """Verifies that launching an attack surges EAL, updates RiskAssessment in DB, and completes properly."""
    import asyncio

    async def _run():
        # 1. Reset state
        await reset_attack_demo(db_session)
        assert _attack_state["active"] is False

        # 2. Launch attack
        payload = AttackStartRequest(scenario="controlled_local_attack", organization_id="org_abc_tech", asset_id="ASSET-001")
        start_res = await start_attack_demo(payload, db_session)

        assert start_res["event"] == "ATTACK_STARTED"
        pipeline = start_res["pipeline"]
        assert pipeline["active_attack_eal"] > pipeline["pre_attack_eal"]
        assert pipeline["eal_spike_inr"] > 0
        corr_id = start_res["correlation_id"]

        # Verify RiskAssessment in database was updated with active attack EAL
        ra = db_session.query(RiskAssessment).filter(RiskAssessment.asset_id == "ASSET-001").order_by(RiskAssessment.id.desc()).first()
        assert ra is not None
        assert ra.eal_pre == pipeline["active_attack_eal"]
        assert ra.org_adapted_prob >= 0.89

        # 3. Complete attack
        complete_res = await complete_attack_demo(AttackCompleteRequest(correlation_id=corr_id), db_session)
        assert complete_res["event"] == "ATTACK_COMPLETED"
        assert complete_res["post_remediation_eal"] < pipeline["active_attack_eal"]
        assert complete_res["risk_reduction_inr"] > 0

        # Verify post-mitigation residual EAL persisted in DB
        db_session.refresh(ra)
        assert ra.eal_post == complete_res["post_remediation_eal"]
        assert ra.risk_reduction == complete_res["risk_reduction_inr"]

        # 4. Clean up reset
        await reset_attack_demo(db_session)

    asyncio.run(_run())


def test_relevance_engine_attack_surge_eal(db_session: Session):
    """Verifies that threat newsletters reporting exploitation in the wild compute attack surge EAL."""
    intel_with_exploit = {
        "cve": "CVE-2024-3094",
        "product": "xz-utils Linux SSH",
        "vendor": "Linux Enterprise",
        "attack_technique": "T1195.001",
        "exploitation_observed": True,
        "outcome": "EXPLOITED_SUCCESSFULLY"
    }

    match_res = RelevanceEngine.match_cyber_threat(db_session, "org_abc_tech", intel_with_exploit)
    assert match_res["has_attack_surge"] is True
    assert match_res["attack_updated_eal"] > match_res["previous_eal"]
    assert match_res["eal_spike_inr"] > 0
    assert match_res["attack_risk_pct"] >= 92.0


def test_continual_learning_demonstration_from_newsletters(db_session: Session):
    """Verifies end-to-end continual learning pipeline from 5+ CISO & 5+ CFO newsletters."""
    learning_res = IntelligenceService.demonstrate_continual_learning_from_newsletters(db_session, "org_abc_tech")

    assert learning_res["status"] == "CONTINUAL_LEARNING_COMPLETED"
    assert learning_res["newsletters_ingested"] >= 10
    assert learning_res["ciso_reviews_confirmed"] >= 5
    assert learning_res["cfo_reviews_confirmed"] >= 5

    # Check candidate model was trained & promoted
    promo = learning_res["model_promotion"]
    assert promo["status"] == "PROMOTED", f"Expected PROMOTED, got: {promo.get('status')} — message: {promo.get('message')}"
    assert promo["new_champion_version"].startswith("v"), f"Expected version starting with 'v', got: {promo.get('new_champion_version')}"
    assert promo["fabric_tx_id"] is not None, "fabric_tx_id must not be None after promotion"

    # Check Fabric audit record.
    # FabricService honestly reports different statuses based on environment:
    #   'COMMITTED_TO_FABRIC_LEDGER'  -> Fabric live, Raft consensus confirmed
    #   'LOCAL_LEDGER_ANCHORED'       -> Fabric offline, local SQLite audit record written
    #   'FABRIC_OFFLINE_QUEUED'       -> Docker not running, queued for anchoring
    # All are valid terminal states for a demo/test environment without live Fabric.
    VALID_FABRIC_STATUSES = {
        "COMMITTED_TO_FABRIC_LEDGER",
        "LOCAL_LEDGER_ANCHORED",
        "FABRIC_OFFLINE_QUEUED",
        "COMMITTED",
        "ANCHORED"
    }
    fabric = learning_res["fabric_audit"]
    assert fabric["status"] in VALID_FABRIC_STATUSES, (
        f"Unexpected Fabric audit status: '{fabric['status']}'. "
        f"Valid statuses are: {sorted(VALID_FABRIC_STATUSES)}"
    )
    assert fabric["event_id"] is not None, "Fabric audit event_id must not be None"
    print(f"\n[+] Fabric audit: status={fabric['status']}, event_id={fabric['event_id']}")
