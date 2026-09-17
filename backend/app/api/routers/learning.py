import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.continual_learning.service import ContinualLearningService
from app.continual_learning.evidence_store import EvidenceStore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/learning", tags=["Step 9: Continual Learning & Model Governance"])

class EvidenceCreateRequest(BaseModel):
    organization_id: str = "Hospital A"
    asset_id: str
    threat_id: Optional[str] = None
    p1_nvd: float = 0.5
    p2_epss: float = 0.5
    p3_org: float = 0.5
    p4_mitre: float = 0.5
    p5_meta: float = 0.5
    p6_network: float = 0.5
    fused_probability: float = 0.5
    org_risk_score: float = 50.0
    expected_annual_loss: float = 1000000.0
    asset_criticality: float = 5.0
    exposure_level: str = "INTERNAL"
    control_effectiveness: float = 0.5
    incident_history_count: int = 0
    recommended_control: Optional[str] = "NIST-PR.AC-1: Access Control Hardening"
    remediation_applied: int = 0
    remediation_performed: Optional[int] = None
    financial_impact_inr: float = 1000000.0
    confirmation_status: str = "PENDING_CONFIRMATION"
    target_label: Optional[int] = None
    observed_loss_inr: Optional[float] = None
    confirmed_by: Optional[str] = None
    confirmation_notes: Optional[str] = None
    is_demo: int = 0

class OutcomeConfirmRequest(BaseModel):
    evidence_id: str
    outcome_status: Optional[str] = None  # CONFIRMED_INCIDENT, CONFIRMED_BENIGN, REJECTED
    outcome: Optional[str] = None         # Alias for outcome_status
    confirmed_by: str = "SecOps-Lead"
    observed_loss_inr: Optional[float] = None
    notes: Optional[str] = None

class TrainCandidateRequest(BaseModel):
    organization_id: Optional[str] = None
    candidate_version: Optional[str] = None

class PromoteCandidateRequest(BaseModel):
    candidate_version: Optional[str] = None
    approved_by: str = "CISO_GOVERNANCE_GATE"
    notes: Optional[str] = None

@router.get("/status")
def get_continual_learning_status(organization_id: Optional[str] = None, org_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns real-time status of continual learning, champion model, candidate model, and drift monitoring."""
    target_org = organization_id or org_id
    return ContinualLearningService.get_status(db, organization_id=target_org)

@router.get("/evidence")
def get_evidence_records(
    confirmation_status: Optional[str] = Query(None, description="Filter: CONFIRMED_INCIDENT, CONFIRMED_BENIGN, PENDING_CONFIRMATION"),
    status: Optional[str] = Query(None, description="Alias for confirmation_status"),
    organization_id: Optional[str] = Query(None),
    org_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Lists operational evidence items stored in the air-gapped repository."""
    from app.models.db_models import ContinualLearningEvidence
    q = db.query(ContinualLearningEvidence)
    
    target_status = confirmation_status or status
    if target_status and target_status.upper() != "ALL":
        if target_status.upper() == "UNCONFIRMED":
            target_status = "PENDING_CONFIRMATION"
        q = q.filter(ContinualLearningEvidence.confirmation_status == target_status)
        
    target_org = organization_id or org_id
    if target_org:
        q = q.filter(ContinualLearningEvidence.organization_id == target_org)
        
    records = q.order_by(ContinualLearningEvidence.id.desc()).limit(limit).all()

    formatted = [
        {
            "id": r.id,
            "evidence_id": r.evidence_id,
            "organization_id": r.organization_id,
            "asset_id": r.asset_id,
            "threat_id": r.threat_id,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            "p1_nvd": r.p1_nvd,
            "p2_epss": r.p2_epss,
            "p3_org": r.p3_org,
            "p4_mitre": r.p4_mitre,
            "p5_meta": r.p5_meta,
            "p6_network": r.p6_network,
            "fused_probability": r.fused_probability,
            "org_risk_score": r.org_risk_score,
            "expected_annual_loss": r.expected_annual_loss,
            "recommended_control": getattr(r, "recommended_control", None) or "NIST-PR.AC-1: Access Control Hardening",
            "remediation_applied": r.remediation_applied,
            "remediation_performed": r.remediation_applied,
            "remediation_status": "APPLIED" if r.remediation_applied == 1 else "NOT_APPLIED",
            "confirmation_status": r.confirmation_status,
            "confirmed_outcome": r.confirmation_status,
            "target_label": r.target_label,
            "observed_loss_inr": r.observed_loss_inr,
            "observed_impact": r.observed_loss_inr,
            "confirmed_by": r.confirmed_by,
            "confirmed_at": r.confirmed_at.isoformat() if r.confirmed_at else None,
            "confirmation_notes": r.confirmation_notes,
            "source_provenance": r.source_provenance,
            "evidence_hash": r.evidence_hash,
            "is_demo": bool(r.is_demo)
        }
        for r in records
    ]

    return {
        "count": len(records),
        "records": formatted
    }

@router.post("/evidence")
def record_operational_evidence(payload: EvidenceCreateRequest, db: Session = Depends(get_db)):
    """Records new operational telemetry evidence with SHA-256 deduplication."""
    rec, is_new = EvidenceStore.record_evidence(
        db=db,
        organization_id=payload.organization_id,
        asset_id=payload.asset_id,
        threat_id=payload.threat_id,
        p1_nvd=payload.p1_nvd,
        p2_epss=payload.p2_epss,
        p3_org=payload.p3_org,
        p4_mitre=payload.p4_mitre,
        p5_meta=payload.p5_meta,
        p6_network=payload.p6_network,
        fused_probability=payload.fused_probability,
        org_risk_score=payload.org_risk_score,
        expected_annual_loss=payload.expected_annual_loss,
        asset_criticality=payload.asset_criticality,
        exposure_level=payload.exposure_level,
        control_effectiveness=payload.control_effectiveness,
        incident_history_count=payload.incident_history_count,
        recommended_control=payload.recommended_control,
        remediation_applied=payload.remediation_applied,
        remediation_performed=payload.remediation_performed,
        financial_impact_inr=payload.financial_impact_inr,
        confirmation_status=payload.confirmation_status,
        target_label=payload.target_label,
        observed_loss_inr=payload.observed_loss_inr,
        confirmed_by=payload.confirmed_by,
        confirmation_notes=payload.confirmation_notes,
        is_demo=payload.is_demo
    )
    return {
        "status": "RECORDED" if is_new else "DUPLICATE_IGNORED",
        "evidence_id": rec.evidence_id,
        "evidence_hash": rec.evidence_hash,
        "confirmation_status": rec.confirmation_status
    }

@router.post("/confirm-outcome")
def confirm_evidence_outcome(payload: OutcomeConfirmRequest, db: Session = Depends(get_db)):
    """Confirms verified ground truth for an evidence item (Human-in-the-loop / SOC verification)."""
    status = payload.outcome_status or payload.outcome or "CONFIRMED_INCIDENT"
    rec = EvidenceStore.confirm_outcome(
        db=db,
        evidence_id=payload.evidence_id,
        outcome_status=status,
        confirmed_by=payload.confirmed_by,
        observed_loss_inr=payload.observed_loss_inr,
        notes=payload.notes
    )
    if not rec:
        raise HTTPException(status_code=404, detail=f"Evidence ID '{payload.evidence_id}' not found.")

    return {
        "status": "OUTCOME_CONFIRMED",
        "evidence_id": rec.evidence_id,
        "confirmation_status": rec.confirmation_status,
        "target_label": rec.target_label,
        "confirmed_by": rec.confirmed_by
    }

@router.post("/train-candidate")
def train_candidate_model(payload: TrainCandidateRequest = TrainCandidateRequest(), db: Session = Depends(get_db)):
    """Triggers candidate model training on verified operational outcomes."""
    res = ContinualLearningService.train_candidate(
        db=db,
        organization_id=payload.organization_id,
        candidate_version=payload.candidate_version
    )
    return res

@router.post("/validate-candidate")
def validate_candidate_model(organization_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Runs governance comparison gates and prediction drift checks between Champion and Candidate."""
    res = ContinualLearningService.validate_candidate(db, organization_id=organization_id)
    return res

@router.post("/promote")
def promote_candidate_to_champion(payload: PromoteCandidateRequest = PromoteCandidateRequest(), db: Session = Depends(get_db)):
    """Promotes validated candidate to new Champion and records an audit event to Hyperledger Fabric."""
    res = ContinualLearningService.promote_candidate(
        db=db,
        candidate_version=payload.candidate_version,
        approved_by=payload.approved_by
    )
    return res

@router.get("/models")
def get_model_lineage(db: Session = Depends(get_db)):
    """Returns chronological model lineage, validation metrics, artifact hashes, and Fabric audit IDs."""
    from app.continual_learning.governance_engine import GovernanceEngine
    GovernanceEngine.ensure_initial_champion(db)
    return {
        "models": GovernanceEngine.get_model_lineage(db)
    }

@router.get("/drift")
def get_drift_report(organization_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns detailed Population Stability Index (PSI) drift analysis across features and predictions."""
    return ContinualLearningService.get_drift_report(db, organization_id=organization_id)

@router.post("/seed-demo")
def seed_demo_evidence_records(organization_id: str = "Hospital A", db: Session = Depends(get_db)):
    """Seeds deterministic demo evidence with confirmed outcomes for offline demonstration."""
    res = ContinualLearningService.seed_demo_evidence(db, organization_id=organization_id)
    return res
