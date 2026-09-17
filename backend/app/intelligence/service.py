"""
backend/app/intelligence/service.py
Central Coordinator for Continuous Intelligence, Newsletter Ingestion,
Human-in-the-Loop, and Model Refinement.
"""

import os
import glob
import json
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.db_models import (
    Organization,
    IntelligenceEventRecord,
    OrgIntelligenceMatchRecord,
    FinancialIntelligenceRecord,
    EmailConnectionRecord,
    EmailMessageRecord,
    HumanReviewRecord,
    ObservedOutcomeRecord,
    PredictionOutcomeComparisonRecord
)
from app.intelligence.email_parser import EmailParser
from app.intelligence.source_detector import SourceDetector
from app.intelligence.deduplicator import EmailDeduplicator
from app.intelligence.content_extractor import ContentExtractor
from app.intelligence.relevance_engine import RelevanceEngine
from app.intelligence.evidence_store import IntelligenceEvidenceStore
from app.intelligence.review_engine import ReviewEngine
from app.intelligence.outcome_engine import OutcomeEngine
from app.intelligence.feedback_engine import ModelFeedbackEngine
from app.services.fabric_service import FabricService

logger = logging.getLogger(__name__)

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DEMO_EMAILS_DIR = os.path.join(REPO_ROOT, "data", "intelligence", "demo_emails")


class IntelligenceService:
    """
    Main Service Interface for the Continuous Intelligence Engine.
    """

    @classmethod
    def ensure_default_organization(cls, db: Session) -> Organization:
        """Ensures default ABC Technologies organization exists in the database."""
        org = db.query(Organization).filter(Organization.name == "ABC Technologies").first()
        if not org:
            org = Organization(
                id="org_abc_tech",
                name="ABC Technologies",
                domain="abc.com",
                industry="Technology & Cloud Services",
                country_region="India / South Asia",
                technology_stack=["AWS", "Linux", "Apache", "Microsoft", "runc", "Docker", "Kubernetes"],
                cloud_providers=["AWS", "Azure"],
                critical_assets=[
                    {"id": "ASSET-001", "name": "Production Server", "criticality": 9.0, "exposure": "INTERNET_FACING"},
                    {"id": "ASSET-002", "name": "Payment Gateway API", "criticality": 8.5, "exposure": "INTERNAL"}
                ],
                business_assets=["Customer Database", "Proprietary Algorithm Repository"],
                security_controls=["EDR", "WAF", "IAM", "Vulnerability Scanner"],
                existing_vulnerabilities=["CVE-2024-21626", "CVE-2023-46604"],
                financial_exposure=3500000.0
            )
            db.add(org)
            db.commit()
            db.refresh(org)
        return org

    @classmethod
    def register_organization(cls, db: Session, payload: Dict[str, Any]) -> Organization:
        """Registers or updates an organization profile."""
        org_name = payload.get("name", "ABC Technologies")
        org = db.query(Organization).filter(Organization.name == org_name).first()

        if not org:
            org_id = payload.get("id") or f"org_{uuid.uuid4().hex[:8]}"
            org = Organization(id=org_id, name=org_name, domain=payload.get("domain", "example.com"))
            db.add(org)

        org.domain = payload.get("domain", org.domain)
        org.industry = payload.get("industry", org.industry)
        org.country_region = payload.get("country_region", org.country_region)
        org.technology_stack = payload.get("technology_stack", org.technology_stack)
        org.cloud_providers = payload.get("cloud_providers", org.cloud_providers)
        org.critical_assets = payload.get("critical_assets", org.critical_assets)
        org.business_assets = payload.get("business_assets", org.business_assets)
        org.security_controls = payload.get("security_controls", org.security_controls)
        org.existing_vulnerabilities = payload.get("existing_vulnerabilities", org.existing_vulnerabilities)
        org.financial_exposure = float(payload.get("financial_exposure", org.financial_exposure or 3500000.0))

        db.commit()
        db.refresh(org)
        return org

    @classmethod
    def process_email_message(
        cls,
        db: Session,
        parsed_email: Dict[str, Any],
        organization_id: str = "org_abc_tech",
        correlation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes complete intelligence lifecycle for an ingested email:
        Parse -> Source Detect -> Extract -> Relevance Match -> Store -> Fabric Anchor.
        """
        if not correlation_id:
            correlation_id = IntelligenceEvidenceStore.generate_correlation_id()

        sender = parsed_email.get("sender", "")
        subject = parsed_email.get("subject", "")
        body_text = parsed_email.get("body_text", "")
        message_id = parsed_email.get("message_id", "")

        # 1. Source Detection
        source_info = SourceDetector.detect_source(sender, subject, body_text)
        category = source_info.get("category", "CYBERSECURITY")
        source_name = source_info.get("source_name", "Newsletter Feed")

        # 2. Extract domain-specific structured intelligence
        if category == "FINANCIAL":
            extracted = ContentExtractor.extract_financial_intelligence(body_text, subject, source_name)
            match_info = RelevanceEngine.match_financial_signal(db, organization_id, extracted)
            fin_rec = IntelligenceEvidenceStore.record_financial_event(
                db=db,
                organization_id=organization_id,
                message_id=message_id,
                source_name=source_name,
                extracted_info=extracted,
                match_info=match_info,
                correlation_id=correlation_id
            )
            event_id = fin_rec.financial_id
        else:
            extracted = ContentExtractor.extract_cyber_intelligence(body_text, subject, source_name)
            match_info = RelevanceEngine.match_cyber_threat(db, organization_id, extracted)
            cyber_rec = IntelligenceEvidenceStore.record_cyber_event(
                db=db,
                organization_id=organization_id,
                message_id=message_id,
                source_name=source_name,
                extracted_info=extracted,
                match_info=match_info,
                correlation_id=correlation_id
            )
            event_id = cyber_rec.event_id

        # 3. Anchor intelligence receipt to Hyperledger Fabric
        content_hash = parsed_email.get("content_hash") or EmailDeduplicator.compute_content_hash(sender, subject, body_text)
        fabric_tx = FabricService.record_remediation(
            org_id=organization_id,
            asset_id=match_info.get("matched_asset_id", "ASSET-001") if category != "FINANCIAL" else "PORTFOLIO-001",
            action_taken=f"INTELLIGENCE_RECEIVED:{category}:{source_name}",
            verified_by="CYBEROPTRQ_INTELLIGENCE_ENGINE",
            details={
                "event_id": event_id,
                "correlation_id": correlation_id,
                "source_hash": content_hash,
                "subject": subject
            }
        )

        return {
            "status": "PROCESSED",
            "event_id": event_id,
            "correlation_id": correlation_id,
            "category": category,
            "source_name": source_name,
            "extracted": extracted,
            "match_info": match_info,
            "fabric_tx_id": fabric_tx.get("event_id")
        }

    @classmethod
    def ingest_offline_demo_emails(cls, db: Session, organization_id: str = "org_abc_tech") -> Dict[str, Any]:
        """
        Ingests all realistic demo .eml files using the exact same standard parser.
        """
        cls.ensure_default_organization(db)
        if not os.path.exists(DEMO_EMAILS_DIR):
            return {"status": "ERROR", "message": f"Demo emails directory '{DEMO_EMAILS_DIR}' does not exist."}

        eml_files = sorted(glob.glob(os.path.join(DEMO_EMAILS_DIR, "*.eml")))
        results = []

        for fpath in eml_files:
            parsed = EmailParser.parse_eml_file(fpath)
            content_hash = EmailDeduplicator.compute_content_hash(parsed["sender"], parsed["subject"], parsed["body_text"])

            # Store in EmailMessageRecord if not already there
            existing = db.query(EmailMessageRecord).filter(EmailMessageRecord.content_hash == content_hash).first()
            if not existing:
                msg_rec = EmailMessageRecord(
                    message_id=parsed["message_id"],
                    connection_id="conn_offline_demo",
                    organization_id=organization_id,
                    source_id="detected",
                    sender=parsed["sender"],
                    recipient=parsed["recipient"],
                    subject=parsed["subject"],
                    date_str=parsed.get("date", ""),
                    content_hash=content_hash,
                    raw_path=fpath,
                    body_text=parsed["body_text"],
                    status="PARSED"
                )
                db.add(msg_rec)
                db.commit()

            # Process intelligence
            processed = cls.process_email_message(db, parsed, organization_id=organization_id)
            results.append(processed)

        return {
            "status": "OFFLINE_INGESTION_COMPLETE",
            "processed_count": len(results),
            "events": results
        }

    @classmethod
    def run_ciso_story_demo(cls, db: Session, organization_id: str = "org_abc_tech") -> Dict[str, Any]:
        """
        Executes end-to-end CISO demo story:
        1. Ingest SANS @RISK .eml
        2. Extract CVE-2024-21626
        3. Match ABC Technologies 'Production Server'
        4. Find prior 78% risk prediction
        5. CISO human CONFIRM
        6. Record ground truth EXPLOITED_SUCCESSFULLY
        7. Prediction vs Reality comparison
        8. Evaluate model refinement feedback
        9. Fabric audit anchoring
        """
        cls.ensure_default_organization(db)
        eml_path = os.path.join(DEMO_EMAILS_DIR, "sans_risk_001.eml")
        if not os.path.exists(eml_path):
            return {"status": "ERROR", "message": f"{eml_path} missing"}

        parsed = EmailParser.parse_eml_file(eml_path)
        corr_id = f"CORR-2026-CISO-{uuid.uuid4().hex[:4].upper()}"

        # 1-4. Ingest and match
        proc = cls.process_email_message(db, parsed, organization_id=organization_id, correlation_id=corr_id)
        event_id = proc["event_id"]

        # 5. CISO Human-in-the-Loop CONFIRM
        rev = ReviewEngine.process_ciso_review(
            db=db,
            event_id=event_id,
            decision="CONFIRM",
            reviewer_id="CISO-Lead-Officer",
            reviewer_role="CISO",
            reason="Confirmed CVE-2024-21626 active in-the-wild container breakout against production server infrastructure."
        )

        # 6-7. Record Outcome & Prediction vs Reality
        outcome = OutcomeEngine.record_cyber_outcome(
            db=db,
            event_id=event_id,
            outcome_state="EXPLOITED_SUCCESSFULLY",
            observed_loss_inr=3500000.0,
            notes="SecOps telemetry confirms active file descriptor breakout incident on host node."
        )

        # 8. Feedback & Calibration Status
        feedback = ModelFeedbackEngine.get_feedback_status(db, organization_id)

        # 9. Fabric Audit
        fabric_record = FabricService.record_risk_assessment(
            org_id=organization_id,
            threat_id="CVE-2024-21626",
            meta_risk=0.78,
            org_risk=0.78,
            eal=2730000.0,
            details={
                "event_id": event_id,
                "correlation_id": corr_id,
                "observed_outcome": "EXPLOITED_SUCCESSFULLY",
                "human_review": "CONFIRM",
                "ciso": "CISO-Lead-Officer"
            }
        )

        return {
            "status": "CISO_DEMO_COMPLETED",
            "correlation_id": corr_id,
            "organization": "ABC Technologies",
            "extracted_threat": proc["extracted"],
            "matched_asset": proc["match_info"],
            "human_review": rev,
            "prediction_vs_reality": outcome,
            "feedback_governance": feedback,
            "fabric_audit": fabric_record
        }

    @classmethod
    def run_cfo_story_demo(cls, db: Session, organization_id: str = "org_abc_tech") -> Dict[str, Any]:
        """
        Executes end-to-end CFO demo story:
        1. Ingest Morning Brew financial .eml
        2. Extract cloud capex surge signal
        3. Match ABC Technologies AWS exposure
        4. CFO human CONFIRM
        5. Record future actual observed outcome
        6. Forecast vs Reality evaluation
        7. Model calibration feedback
        """
        cls.ensure_default_organization(db)
        eml_path = os.path.join(DEMO_EMAILS_DIR, "finance_newsletter_001.eml")
        if not os.path.exists(eml_path):
            return {"status": "ERROR", "message": f"{eml_path} missing"}

        parsed = EmailParser.parse_eml_file(eml_path)
        corr_id = f"CORR-2026-CFO-{uuid.uuid4().hex[:4].upper()}"

        # 1-3. Ingest and match
        proc = cls.process_email_message(db, parsed, organization_id=organization_id, correlation_id=corr_id)
        event_id = proc["event_id"]

        # 4. CFO Human Review
        rev = ReviewEngine.process_cfo_review(
            db=db,
            financial_id=event_id,
            decision="CONFIRM",
            reviewer_id="CFO-Executive",
            reason="Verified AWS capex forecast aligns with our Q3 enterprise migration schedule."
        )

        # 5-6. Record actual later observed outcome & comparison
        actual_res = OutcomeEngine.record_financial_outcome(
            db=db,
            financial_id=event_id,
            actual_market_outcome="AWS reported +19.4% cloud infrastructure growth and higher enterprise cybersecurity compliance expenditure.",
            notes="Quarterly earnings confirmed newsletter signal."
        )

        # 7. Fabric Audit
        fabric_record = FabricService.record_investment_decision(
            org_id=organization_id,
            control_id="FIN-SIGNAL-AWS",
            investment_cost=3500000.0,
            expected_reduction=15.0,
            rosi=125.0,
            details={
                "event_id": event_id,
                "correlation_id": corr_id,
                "cfo_decision": "CONFIRM",
                "forecast_accuracy": actual_res.get("forecast_accuracy")
            }
        )

        return {
            "status": "CFO_DEMO_COMPLETED",
            "correlation_id": corr_id,
            "organization": "ABC Technologies",
            "financial_signal": proc["extracted"],
            "portfolio_match": proc["match_info"],
            "cfo_review": rev,
            "forecast_vs_actual": actual_res,
            "fabric_audit": fabric_record
        }
