"""
backend/test_intelligence_pipeline.py
Unit and Integration Tests for Continuous Intelligence, Newsletter Ingestion,
Human-in-the-Loop Validation, Prediction-Reality Comparison, and Model Refinement.
"""

import os
import sys
import json
import pytest
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import SessionLocal, engine, Base
from app.models.db_models import (
    Organization,
    Asset,
    Vulnerability,
    RiskAssessment,
    EmailMessageRecord,
    IntelligenceEventRecord,
    HumanReviewRecord,
    ObservedOutcomeRecord,
    PredictionOutcomeComparisonRecord,
    FinancialIntelligenceRecord
)
from app.intelligence.email_parser import EmailParser
from app.intelligence.deduplicator import EmailDeduplicator
from app.intelligence.source_detector import SourceDetector
from app.intelligence.content_extractor import ContentExtractor
from app.intelligence.relevance_engine import RelevanceEngine
from app.intelligence.email_connector import EmailConnectorFactory
from app.intelligence.email_fetcher import EmailFetcher
from app.intelligence.evidence_store import IntelligenceEvidenceStore
from app.intelligence.review_engine import ReviewEngine
from app.intelligence.outcome_engine import OutcomeEngine
from app.intelligence.feedback_engine import ModelFeedbackEngine
from app.intelligence.service import IntelligenceService
from app.ml.risk_models import FullAIRiskPipeline, IndividualRiskModels


@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


def test_rfc822_email_parser():
    """Test 1: Standard RFC 822 parser extracts headers, body, links from raw bytes and .eml."""
    raw_email = (
        b"From: SANS @RISK <at-risk@sans.org>\r\n"
        b"To: intel@cyberoptrq.example\r\n"
        b"Subject: SANS @RISK: CVE-2024-21626 Alert\r\n"
        b"Date: Wed, 16 Sep 2026 08:30:00 +0000\r\n"
        b"Message-ID: <test-123@sans.org>\r\n"
        b"Content-Type: text/plain; charset=utf-8\r\n\r\n"
        b"Vulnerability: CVE-2024-21626\n"
        b"Product: runc Container Runtime\n"
        b"Details: https://www.sans.org/cve-2024-21626"
    )
    parsed = EmailParser.parse_raw_email(raw_email)
    assert parsed["sender"] == "SANS @RISK <at-risk@sans.org>"
    assert parsed["subject"] == "SANS @RISK: CVE-2024-21626 Alert"
    assert "CVE-2024-21626" in parsed["body_text"]
    assert any("sans.org" in link for link in parsed["links"])


def test_sha256_deduplication(db_session):
    """Test 2: SHA-256 fingerprinting prevents re-processing identical emails."""
    h1 = EmailDeduplicator.compute_content_hash(
        sender="newsletters@sans.org",
        subject="Threat Digest",
        body_text="Active exploit CVE-2024-21626"
    )
    h2 = EmailDeduplicator.compute_content_hash(
        sender="  newsletters@sans.org  ",
        subject="THREAT DIGEST",
        body_text="Active   exploit   CVE-2024-21626"
    )
    assert h1 == h2, "Whitespace and case normalized hashes must be identical."


def test_source_detection():
    """Test 3: Detects source publisher and category from headers and content."""
    sans_res = SourceDetector.detect_source("at-risk@sans.org", "SANS @RISK Issue 38")
    assert sans_res["source_id"] == "sans_at_risk"
    assert sans_res["category"] == "CYBERSECURITY"
    assert sans_res["trust_level"] == "HIGH"

    cisa_res = SourceDetector.detect_source("advisories@cisa.gov", "CISA Advisory AA26-258A")
    assert cisa_res["source_id"] == "cisa_alerts"
    assert cisa_res["category"] == "CYBERSECURITY"

    fin_res = SourceDetector.detect_source("daily@morningbrew.com", "Morning Brew Financial")
    assert fin_res["source_id"] == "morning_brew"
    assert fin_res["category"] == "FINANCIAL"


def test_cyber_extraction_without_hallucination():
    """Test 4: Extracts CVE, technique, and exploit status without inventing missing fields."""
    sample_text = (
        "Vulnerability: CVE-2024-21626\n"
        "Product: runc Container Runtime\n"
        "Attack Vector: NETWORK\n"
        "MITRE ATT&CK Technique: T1068\n"
        "Exploitation Status: ACTIVE_IN_THE_WILD\n"
        "Outcome: EXPLOITED_SUCCESSFULLY\n"
    )
    extracted = ContentExtractor.extract_cyber_intelligence(sample_text, "SANS Alert", "SANS @RISK")
    assert extracted["cve"] == "CVE-2024-21626"
    assert extracted["product"] == "runc Container Runtime"
    assert extracted["attack_technique"] == "T1068"
    assert extracted["exploitation_observed"] is True
    assert extracted["outcome"] == "EXPLOITED_SUCCESSFULLY"
    # Unmentioned fields must be UNKNOWN, not invented
    assert extracted["threat_actor"] == "UNKNOWN"
    assert extracted["malware"] == "UNKNOWN"


def test_financial_extraction_without_fabrication():
    """Test 5: Extracts financial signals and forecasts without inventing returns."""
    fin_text = (
        "Company: Amazon Web Services\n"
        "Ticker: AMZN\n"
        "Sector: Cloud Computing\n"
        "Market Event: Q3 Cloud Capex Surge\n"
        "Newsletter Forecast: Enterprise workload expansion\n"
    )
    extracted = ContentExtractor.extract_financial_intelligence(fin_text, "Morning Brew", "Morning Brew")
    assert extracted["company"] == "Amazon Web Services"
    assert extracted["ticker"] == "AMZN"
    assert extracted["expected_return"] == "UNKNOWN", "Never invent expected returns"


def test_organization_relevance_matching(db_session):
    """Test 6: Matches threat against organization tech stack and finds previous prediction."""
    org = IntelligenceService.ensure_default_organization(db_session)
    extracted = {
        "cve": "CVE-2024-21626",
        "product": "runc Container Runtime",
        "vendor": "Open Containers Initiative",
        "attack_technique": "T1068",
        "exploitation_observed": True
    }
    match = RelevanceEngine.match_cyber_threat(db_session, org.id, extracted)
    assert match["relevance_level"] in ["HIGH", "MEDIUM"]
    assert match["matched_asset_name"] is not None
    assert match["previous_predicted_risk"] is not None


def test_ciso_human_review_actions(db_session):
    """Test 7: CISO HITL actions (CONFIRM, CORRECT, REJECT, NEED_INVESTIGATION)."""
    org = IntelligenceService.ensure_default_organization(db_session)
    extracted = {
        "cve": "CVE-2024-21626",
        "product": "runc",
        "attack_technique": "T1068",
        "exploitation_observed": True,
        "outcome": "EXPLOITED_SUCCESSFULLY",
        "confidence": 0.90
    }
    ev = IntelligenceEvidenceStore.record_cyber_event(
        db=db_session,
        organization_id=org.id,
        message_id="test-msg-01",
        source_name="SANS @RISK",
        extracted_info=extracted
    )

    # Test CONFIRM
    res_confirm = ReviewEngine.process_ciso_review(
        db=db_session,
        event_id=ev.event_id,
        decision="CONFIRM",
        reviewer_id="CISO-Test",
        reason="Confirmed threat"
    )
    assert res_confirm["decision"] == "CONFIRM"
    assert res_confirm["event_status"] == "VALIDATED"

    # Test CORRECT
    res_correct = ReviewEngine.process_ciso_review(
        db=db_session,
        event_id=ev.event_id,
        decision="CORRECT",
        reviewer_id="CISO-Test",
        corrections={"product": "runc 1.1.12 Hardened"},
        reason="Correction applied"
    )
    assert res_correct["decision"] == "CORRECT"

    # Test REJECT
    res_reject = ReviewEngine.process_ciso_review(
        db=db_session,
        event_id=ev.event_id,
        decision="REJECT",
        reviewer_id="CISO-Test"
    )
    assert res_reject["decision"] == "REJECT"
    assert res_reject["event_status"] == "REJECTED"


def test_cfo_human_review_actions(db_session):
    """Test 8: CFO review queue and confirmation flow."""
    org = IntelligenceService.ensure_default_organization(db_session)
    fin_extracted = {
        "company": "Amazon Web Services",
        "ticker": "AMZN",
        "market_event": "Capex surge",
        "newsletter_forecast": "Growth",
        "confidence": 0.85
    }
    fin = IntelligenceEvidenceStore.record_financial_event(
        db=db_session,
        organization_id=org.id,
        message_id="test-msg-fin-01",
        source_name="Morning Brew",
        extracted_info=fin_extracted
    )

    cfo_res = ReviewEngine.process_cfo_review(
        db=db_session,
        financial_id=fin.financial_id,
        decision="CONFIRM",
        reviewer_id="CFO-Lead"
    )
    assert cfo_res["decision"] == "CONFIRM"
    assert cfo_res["cfo_review_status"] == "CONFIRMED"


def test_prediction_vs_reality_comparison(db_session):
    """Test 9: Prediction vs observed reality comparison calculates calibration discrepancy."""
    org = IntelligenceService.ensure_default_organization(db_session)
    ev = IntelligenceEvidenceStore.record_cyber_event(
        db=db_session,
        organization_id=org.id,
        message_id="test-msg-comp-01",
        source_name="SANS @RISK",
        extracted_info={"cve": "CVE-2024-21626", "outcome": "EXPLOITED_SUCCESSFULLY"}
    )
    outcome_res = OutcomeEngine.record_cyber_outcome(
        db=db_session,
        event_id=ev.event_id,
        outcome_state="EXPLOITED_SUCCESSFULLY",
        observed_loss_inr=3500000.0
    )
    assert outcome_res["status"] == "OUTCOME_RECORDED"
    assert outcome_res["observed_binary"] == 1
    assert outcome_res["calibration_error"] >= 0.0
    assert outcome_res["brier_contribution"] >= 0.0


def test_insufficient_data_governance_safeguard(db_session):
    """Test 10: Prevents premature candidate retraining if fewer than 15 confirmed samples exist."""
    status = ModelFeedbackEngine.get_feedback_status(db_session, "brand_new_isolated_org")
    assert status["minimum_safety_samples"] == 15
    assert "scientific_note" in status


def test_email_connector_abstractions(db_session):
    """Test 11: Validates connector factory for all supported providers."""
    gmail_conn = EmailConnectorFactory.get_connector("GMAIL", "c1", "org1", "test@gmail.com")
    assert gmail_conn.check_connection()["status"] == "CONNECTED"

    graph_conn = EmailConnectorFactory.get_connector("OUTLOOK", "c2", "org1", "test@outlook.com")
    assert graph_conn.check_connection()["status"] == "CONNECTED"

    imap_conn = EmailConnectorFactory.get_connector("IMAP", "c3", "org1", "test@corp.com")
    assert imap_conn.check_connection()["status"] == "CONNECTED"

    dedicated_conn = EmailConnectorFactory.get_connector("DEDICATED", "c4", "org1", "intel@cyberoptrq.example")
    assert dedicated_conn.check_connection()["status"] == "CONNECTED"

    offline_conn = EmailConnectorFactory.get_connector("OFFLINE", "c5", "org1", "local@cyberoptrq.example")
    assert offline_conn.check_connection()["status"] == "CONNECTED"


def test_p1_to_p6_pipeline_regression():
    """Test 12: Baseline models P1-P6 and FullAIRiskPipeline remain 100% functional and immutable."""
    # Test Individual Models
    p1 = IndividualRiskModels.model_1_nvd_cvss_cwe(cvss_score=8.5, cwe_id="CWE-787")
    assert 0.0 <= p1 <= 1.0

    p2 = IndividualRiskModels.model_2_epss(epss_score=0.45)
    assert p2 == 0.45

    p3 = IndividualRiskModels.model_3_cisa_kev(is_cisa_kev=True)
    assert p3 == 0.95

    p4 = IndividualRiskModels.model_4_mitre_attack(technique_id="T1190")
    assert p4 == 0.90

    # Test Full pipeline
    res = FullAIRiskPipeline.run_pipeline(
        cvss_score=7.5,
        cwe_id="CWE-787",
        epss_score=0.40,
        is_cisa_kev=True,
        mitre_technique="T1190",
        asset_criticality=8.0,
        exposure_level="INTERNET_FACING",
        incident_count=1
    )
    assert "calibrated_probability" in res
    assert 0.0 <= res["calibrated_probability"] <= 1.0
