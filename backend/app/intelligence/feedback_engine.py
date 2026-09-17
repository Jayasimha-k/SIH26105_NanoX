"""
backend/app/intelligence/feedback_engine.py
Controlled Model Feedback, Quality Gating, Candidate Calibration, and Version Promotion Engine.
Strictly requires human approval and rejects unvalidated or insufficient evidence.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.continual_learning.service import ContinualLearningService
from app.continual_learning.evidence_store import EvidenceStore
from app.continual_learning.governance_engine import GovernanceEngine
from app.continual_learning.drift_detector import DriftDetector
from app.models.db_models import ContinualLearningEvidence, ModelGovernanceRecord

logger = logging.getLogger(__name__)


class ModelFeedbackEngine:
    """
    Coordinates model feedback and candidate evaluation.
    Enforces scientific standards:
    - Zero auto-retraining on raw feeds.
    - Rigorous human validation requirement.
    - Clear distinction between demo baseline safety checks (N >= 15) and full enterprise dataset readiness.
    """

    DEMO_MINIMUM_SAMPLES = 15

    @classmethod
    def get_feedback_status(cls, db: Session, organization_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Evaluates the current feedback dataset readiness and drift status.
        """
        stats = EvidenceStore.get_evidence_stats(db, organization_id)
        total_confirmed = stats.get("total_confirmed", 0)
        champ = GovernanceEngine.ensure_initial_champion(db)
        cand = GovernanceEngine.get_candidate_record(db)
        drift = ContinualLearningService.get_drift_report(db, organization_id)

        is_ready = stats.get("learning_ready", False)
        status_message = "Ready for candidate model calibration and offline evaluation." if is_ready else (
            f"Insufficient validated evidence for model refinement ({total_confirmed}/{cls.DEMO_MINIMUM_SAMPLES} confirmed samples required)."
        )

        return {
            "platform": "CyberOptRQ Controlled Model Governance & Refinement",
            "active_champion": {
                "version": champ.version,
                "model_id": champ.model_id,
                "dataset_hash": champ.dataset_hash,
                "artifact_hash": champ.artifact_hash,
                "metrics": json.loads(champ.metrics_json or "{}")
            },
            "candidate_model": {
                "version": cand.version,
                "status": cand.status,
                "governance_decision": cand.governance_decision,
                "decision_reason": cand.decision_reason,
                "metrics": json.loads(cand.metrics_json or "{}")
            } if cand else None,
            "evidence_stats": stats,
            "total_confirmed_samples": total_confirmed,
            "minimum_safety_samples": cls.DEMO_MINIMUM_SAMPLES,
            "feedback_status": "READY_FOR_CALIBRATION" if is_ready else "INSUFFICIENT_VALIDATED_DATA",
            "status_message": status_message,
            "drift_summary": {
                "status": drift.get("overall_status", "STABLE"),
                "mean_psi": drift.get("mean_psi", 0.0),
                "action_recommendation": drift.get("action_recommendation", "")
            },
            "scientific_note": "A safety floor of N >= 15 verified ground-truth samples is required to train candidate adaptation models. Production cyber-risk models require ongoing analyst verification to reach enterprise statistical power."
        }

    @classmethod
    def train_candidate_calibration(cls, db: Session, organization_id: Optional[str] = None, candidate_version: Optional[str] = None) -> Dict[str, Any]:
        """
        Trains candidate model on verified ground-truth outcomes.
        Fails safely if insufficient data exists.
        """
        return ContinualLearningService.train_candidate(
            db=db,
            organization_id=organization_id,
            candidate_version=candidate_version
        )

    @classmethod
    def validate_candidate_gates(cls, db: Session, organization_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Evaluates Champion vs Candidate statistical governance gates (Brier calibration, ROC-AUC, PSI stability).
        """
        return ContinualLearningService.validate_candidate(
            db=db,
            organization_id=organization_id
        )

    @classmethod
    def approve_and_promote_candidate(
        cls,
        db: Session,
        candidate_version: Optional[str] = None,
        approved_by: str = "CISO_GOVERNANCE_BOARD",
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Promotes approved candidate to active Champion and records Hyperledger Fabric audit transaction.
        """
        return ContinualLearningService.promote_candidate(
            db=db,
            candidate_version=candidate_version,
            approved_by=approved_by,
            notes=notes
        )

    @classmethod
    def reject_candidate(cls, db: Session, candidate_version: Optional[str] = None, rejected_by: str = "CISO_GOVERNANCE_BOARD", reason: Optional[str] = None) -> Dict[str, Any]:
        """
        Rejects a candidate model, retaining the current production Champion.
        """
        cand = GovernanceEngine.get_candidate_record(db)
        if not cand:
            return {"status": "FAILED", "message": "No candidate record found to reject."}

        cand.status = "REJECTED"
        cand.governance_decision = "REJECTED"
        cand.decision_reason = reason or f"Rejected by {rejected_by}"
        db.commit()

        return {
            "status": "REJECTED",
            "candidate_version": cand.version,
            "decision": "REJECTED",
            "message": f"Candidate version {cand.version} rejected. Production champion remains active."
        }
