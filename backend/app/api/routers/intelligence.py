"""
backend/app/api/routers/intelligence.py
REST API Endpoints for Continuous Intelligence, Newsletter Ingestion,
Human-in-the-Loop Validation, and Controlled Model Refinement.
"""

import json
import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db_models import (
    Organization,
    EmailConnectionRecord,
    EmailMessageRecord,
    IntelligenceEventRecord,
    FinancialIntelligenceRecord,
    HumanReviewRecord
)
from app.intelligence.service import IntelligenceService
from app.intelligence.email_fetcher import EmailFetcher
from app.intelligence.review_engine import ReviewEngine
from app.intelligence.outcome_engine import OutcomeEngine
from app.intelligence.feedback_engine import ModelFeedbackEngine
from app.intelligence.source_detector import SourceDetector

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/intelligence", tags=["Step 10: Continuous Intelligence & Human-in-the-Loop"])


# --- Schemas ---

class OrgRegisterRequest(BaseModel):
    name: str = "ABC Technologies"
    domain: str = "abc.com"
    industry: str = "Technology & Cloud Services"
    country_region: str = "India / South Asia"
    technology_stack: List[str] = ["AWS", "Linux", "Apache", "Microsoft", "runc"]
    cloud_providers: List[str] = ["AWS", "Azure"]
    critical_assets: List[Dict[str, Any]] = [
        {"id": "ASSET-001", "name": "Production Server", "criticality": 9.0, "exposure": "INTERNET_FACING"}
    ]
    business_assets: List[str] = ["Customer Database"]
    security_controls: List[str] = ["EDR", "WAF", "IAM", "Vulnerability Scanner"]
    existing_vulnerabilities: List[str] = ["CVE-2024-21626", "CVE-2023-46604"]
    financial_exposure: float = 3500000.0


class EmailConnectRequest(BaseModel):
    organization_id: str = "org_abc_tech"
    provider: str = "GMAIL"  # GMAIL, OUTLOOK, IMAP, DEDICATED, OFFLINE
    email_address: str = "intel@cyberoptrq.example"
    folder_label: str = "CyberOptRQ-Intelligence"
    access_token: Optional[str] = None
    imap_server: Optional[str] = None


class ReviewActionRequest(BaseModel):
    decision: str = "CONFIRM"  # CONFIRM, CORRECT, REJECT, NEED_INVESTIGATION
    reviewer_id: str = "CISO-Lead"
    reviewer_role: str = "CISO"  # CISO, CFO, SECURITY_ANALYST, FINANCE_ANALYST
    corrections: Optional[Dict[str, Any]] = None
    reason: Optional[str] = None


class OutcomeRecordRequest(BaseModel):
    outcome_state: str = "EXPLOITED_SUCCESSFULLY"
    observed_loss_inr: Optional[float] = 3500000.0
    notes: Optional[str] = None


class OfflineDemoRequest(BaseModel):
    organization_id: str = "org_abc_tech"
    workflow: str = "ALL"  # CISO, CFO, ALL


# --- Endpoints ---

@router.post("/organizations/register")
def register_organization_profile(payload: OrgRegisterRequest, db: Session = Depends(get_db)):
    """Registers or updates enriched enterprise profile with tech stack and critical assets."""
    org = IntelligenceService.register_organization(db, payload.dict())
    return {
        "status": "REGISTERED",
        "organization_id": org.id,
        "name": org.name,
        "domain": org.domain,
        "industry": org.industry,
        "critical_assets_count": len(org.critical_assets or []),
        "financial_exposure": org.financial_exposure
    }


@router.get("/organizations")
def get_organizations(db: Session = Depends(get_db)):
    """Retrieves list of registered organizations."""
    IntelligenceService.ensure_default_organization(db)
    orgs = db.query(Organization).all()
    return [
        {
            "id": o.id,
            "name": o.name,
            "domain": o.domain,
            "industry": o.industry,
            "technology_stack": o.technology_stack,
            "cloud_providers": o.cloud_providers,
            "critical_assets": o.critical_assets,
            "financial_exposure": o.financial_exposure
        }
        for o in orgs
    ]


@router.post("/email/connect")
def connect_email_account(payload: EmailConnectRequest, db: Session = Depends(get_db)):
    """Configures email connection (OAuth token abstraction, dedicated mailbox, or IMAP)."""
    import uuid
    conn_id = f"conn_{uuid.uuid4().hex[:8]}"
    existing = db.query(EmailConnectionRecord).filter(
        EmailConnectionRecord.email_address == payload.email_address,
        EmailConnectionRecord.organization_id == payload.organization_id
    ).first()

    if existing:
        existing.status = "CONNECTED"
        existing.folder_label = payload.folder_label
        existing.error_message = None
        db.commit()
        return {"status": "UPDATED", "connection_id": existing.connection_id, "provider": existing.provider}

    conn = EmailConnectionRecord(
        connection_id=conn_id,
        organization_id=payload.organization_id,
        provider=payload.provider.upper(),
        email_address=payload.email_address,
        folder_label=payload.folder_label,
        status="CONNECTED"
    )
    db.add(conn)
    db.commit()

    return {
        "status": "CONNECTED",
        "connection_id": conn_id,
        "provider": conn.provider,
        "mailbox": conn.email_address,
        "folder": conn.folder_label
    }


@router.get("/email/connections")
def list_email_connections(organization_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Lists configured email connections and synchronization statuses."""
    q = db.query(EmailConnectionRecord)
    if organization_id:
        q = q.filter(EmailConnectionRecord.organization_id == organization_id)
    conns = q.all()

    if not conns:
        # Default dedicated mailbox & offline connector
        def_conn = EmailConnectionRecord(
            connection_id="conn_dedicated_intel",
            organization_id=organization_id or "org_abc_tech",
            provider="DEDICATED",
            email_address="intel@cyberoptrq.example",
            folder_label="CyberOptRQ-Intelligence",
            status="CONNECTED"
        )
        db.add(def_conn)
        db.commit()
        conns = [def_conn]

    return [
        {
            "connection_id": c.connection_id,
            "organization_id": c.organization_id,
            "provider": c.provider,
            "email_address": c.email_address,
            "folder_label": c.folder_label,
            "status": c.status,
            "processed_count": c.processed_count,
            "last_sync": c.last_sync.isoformat() if c.last_sync else None,
            "error_message": c.error_message
        }
        for c in conns
    ]


@router.post("/email/sync")
def sync_connected_emails(connection_id: Optional[str] = None, organization_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Polls email mailboxes and triggers ingestion pipeline."""
    if connection_id:
        res = EmailFetcher.sync_connection(db, connection_id)
    else:
        res = EmailFetcher.sync_all_active_connections(db, organization_id)
    return res


@router.get("/emails")
def list_ingested_emails(organization_id: Optional[str] = None, limit: int = 50, db: Session = Depends(get_db)):
    """Lists raw ingested email messages with hash fingerprints and parsing statuses."""
    q = db.query(EmailMessageRecord)
    if organization_id:
        q = q.filter(EmailMessageRecord.organization_id == organization_id)
    msgs = q.order_by(EmailMessageRecord.id.desc()).limit(limit).all()

    return [
        {
            "message_id": m.message_id,
            "sender": m.sender,
            "recipient": m.recipient,
            "subject": m.subject,
            "date": m.date_str,
            "content_hash": m.content_hash,
            "status": m.status,
            "body_snippet": m.body_text[:160] + "..." if len(m.body_text) > 160 else m.body_text,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in msgs
    ]


@router.get("/events")
def list_intelligence_events(category: Optional[str] = None, organization_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Lists extracted intelligence events."""
    q = db.query(IntelligenceEventRecord)
    if category:
        q = q.filter(IntelligenceEventRecord.category == category.upper())
    if organization_id:
        q = q.filter(IntelligenceEventRecord.organization_id == organization_id)
    events = q.order_by(IntelligenceEventRecord.id.desc()).limit(100).all()

    formatted = []
    for ev in events:
        raw_json = {}
        try:
            raw_json = json.loads(ev.raw_extraction_json)
        except Exception:
            pass
        formatted.append({
            "event_id": ev.event_id,
            "correlation_id": ev.correlation_id,
            "organization_id": ev.organization_id,
            "category": ev.category,
            "source_name": ev.source_name,
            "cve": ev.cve,
            "affected_product": ev.affected_product,
            "attack_technique": ev.attack_technique,
            "exploitation_observed": ev.exploitation_observed,
            "reported_outcome": ev.reported_outcome,
            "confidence": ev.confidence,
            "status": ev.status,
            "created_at": ev.created_at.isoformat() if ev.created_at else None,
            "details": raw_json
        })
    return formatted


@router.get("/review-queue")
def get_human_review_queue(role: str = "CISO", organization_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Retrieves Human-in-the-Loop review queue for CISO or CFO."""
    if role.upper() == "CFO":
        return ReviewEngine.get_cfo_review_queue(db, organization_id)
    return ReviewEngine.get_ciso_review_queue(db, organization_id)


@router.post("/{event_id}/confirm")
def confirm_intelligence_evidence(event_id: str, payload: ReviewActionRequest = ReviewActionRequest(decision="CONFIRM"), db: Session = Depends(get_db)):
    """Human-in-the-Loop: Confirms extracted intelligence item."""
    if payload.reviewer_role.upper() == "CFO":
        return ReviewEngine.process_cfo_review(db, event_id, "CONFIRM", payload.reviewer_id, payload.corrections, payload.reason)
    return ReviewEngine.process_ciso_review(db, event_id, "CONFIRM", payload.reviewer_id, payload.reviewer_role, payload.corrections, payload.reason)


@router.post("/{event_id}/correct")
def correct_intelligence_evidence(event_id: str, payload: ReviewActionRequest, db: Session = Depends(get_db)):
    """Human-in-the-Loop: Modifies extracted intelligence and marks as verified."""
    if payload.reviewer_role.upper() == "CFO":
        return ReviewEngine.process_cfo_review(db, event_id, "CORRECT", payload.reviewer_id, payload.corrections, payload.reason)
    return ReviewEngine.process_ciso_review(db, event_id, "CORRECT", payload.reviewer_id, payload.reviewer_role, payload.corrections, payload.reason)


@router.post("/{event_id}/reject")
def reject_intelligence_evidence(event_id: str, payload: ReviewActionRequest = ReviewActionRequest(decision="REJECT"), db: Session = Depends(get_db)):
    """Human-in-the-Loop: Rejects extracted intelligence from model feedback."""
    if payload.reviewer_role.upper() == "CFO":
        return ReviewEngine.process_cfo_review(db, event_id, "REJECT", payload.reviewer_id, payload.corrections, payload.reason)
    return ReviewEngine.process_ciso_review(db, event_id, "REJECT", payload.reviewer_id, payload.reviewer_role, payload.corrections, payload.reason)


@router.post("/{event_id}/investigate")
def investigate_intelligence_evidence(event_id: str, payload: ReviewActionRequest = ReviewActionRequest(decision="NEED_INVESTIGATION"), db: Session = Depends(get_db)):
    """Human-in-the-Loop: Keeps intelligence item pending further investigation."""
    if payload.reviewer_role.upper() == "CFO":
        return ReviewEngine.process_cfo_review(db, event_id, "NEED_INVESTIGATION", payload.reviewer_id, payload.corrections, payload.reason)
    return ReviewEngine.process_ciso_review(db, event_id, "NEED_INVESTIGATION", payload.reviewer_id, payload.reviewer_role, payload.corrections, payload.reason)


@router.post("/{event_id}/outcome")
def record_event_outcome(event_id: str, payload: OutcomeRecordRequest, db: Session = Depends(get_db)):
    """Records ground-truth outcome and evaluates prediction vs reality."""
    return OutcomeEngine.record_cyber_outcome(
        db=db,
        event_id=event_id,
        outcome_state=payload.outcome_state,
        observed_loss_inr=payload.observed_loss_inr,
        notes=payload.notes
    )


@router.get("/outcomes")
def get_prediction_outcomes(organization_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns historical prediction vs observed reality comparisons."""
    return OutcomeEngine.get_outcome_comparisons(db, organization_id)


@router.get("/predictions/{prediction_id}/comparison")
def get_single_prediction_comparison(prediction_id: int, db: Session = Depends(get_db)):
    """Gets detailed prediction vs reality comparison for a specific prediction ID."""
    from app.models.db_models import PredictionOutcomeComparisonRecord
    rec = db.query(PredictionOutcomeComparisonRecord).filter(
        PredictionOutcomeComparisonRecord.prediction_id == prediction_id
    ).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Prediction outcome comparison not found.")
    return {
        "comparison_id": rec.comparison_id,
        "correlation_id": rec.correlation_id,
        "predicted_risk_pct": round(rec.predicted_risk_prob * 100, 1),
        "observed_state": rec.observed_state,
        "calibration_error": rec.calibration_error,
        "brier_score_contribution": rec.brier_score_contribution,
        "summary": rec.comparison_summary
    }


@router.get("/model-feedback")
def get_model_feedback_center(organization_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns feedback dataset readiness, sample count, drift report, and calibration gate status."""
    return ModelFeedbackEngine.get_feedback_status(db, organization_id)


@router.post("/model-feedback/train-candidate")
def train_candidate_calibration_model(organization_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Trains candidate calibration model on verified ground-truth evidence."""
    return ModelFeedbackEngine.train_candidate_calibration(db, organization_id)


@router.post("/model-feedback/{candidate_version}/approve")
def approve_candidate_model(candidate_version: str, approved_by: str = "CISO_GOVERNANCE_BOARD", db: Session = Depends(get_db)):
    """Human approval: promotes candidate to active Champion and anchors to Hyperledger Fabric."""
    return ModelFeedbackEngine.approve_and_promote_candidate(db, candidate_version=candidate_version, approved_by=approved_by)


@router.post("/model-feedback/{candidate_version}/reject")
def reject_candidate_model(candidate_version: str, rejected_by: str = "CISO_GOVERNANCE_BOARD", reason: Optional[str] = None, db: Session = Depends(get_db)):
    """Human rejection: dismisses candidate and retains current Champion."""
    return ModelFeedbackEngine.reject_candidate(db, candidate_version=candidate_version, rejected_by=rejected_by, reason=reason)


@router.get("/model-versions")
def list_model_versions(db: Session = Depends(get_db)):
    """Chronological model versions and governance lineage."""
    from app.continual_learning.governance_engine import GovernanceEngine
    GovernanceEngine.ensure_initial_champion(db)
    return GovernanceEngine.get_model_lineage(db)


@router.get("/sources")
def list_intelligence_sources():
    """Configured authorized newsletter sources."""
    return SourceDetector.load_sources()


@router.post("/offline-demo")
def run_offline_intelligence_demo(payload: OfflineDemoRequest = OfflineDemoRequest(), db: Session = Depends(get_db)):
    """Executes deterministic offline end-to-end demonstration for CISO and/or CFO."""
    results = {}
    if payload.workflow.upper() in ["CISO", "ALL"]:
        results["ciso_story"] = IntelligenceService.run_ciso_story_demo(db, payload.organization_id)
    if payload.workflow.upper() in ["CFO", "ALL"]:
        results["cfo_story"] = IntelligenceService.run_cfo_story_demo(db, payload.organization_id)
    return results
