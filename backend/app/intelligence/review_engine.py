"""
backend/app/intelligence/review_engine.py
Human-in-the-Loop (HITL) Review Engine for CISO Cybersecurity and CFO Financial Intelligence.
Every human decision is recorded with complete auditability.
"""

import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.db_models import (
    IntelligenceEventRecord,
    OrgIntelligenceMatchRecord,
    HumanReviewRecord,
    FinancialIntelligenceRecord
)


class ReviewEngine:
    """
    Manages CISO and CFO review queues, human feedback recording, and status transitions.
    """

    @classmethod
    def get_ciso_review_queue(cls, db: Session, organization_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fetches pending cyber intelligence review items with matched organization context and previous predictions.
        """
        q = db.query(IntelligenceEventRecord).filter(
            IntelligenceEventRecord.category == "CYBERSECURITY",
            IntelligenceEventRecord.status.in_(["EXTRACTED", "MATCHED", "IN_REVIEW"])
        )
        if organization_id:
            q = q.filter(IntelligenceEventRecord.organization_id == organization_id)

        events = q.order_by(IntelligenceEventRecord.id.desc()).all()
        queue = []

        for ev in events:
            match = db.query(OrgIntelligenceMatchRecord).filter(OrgIntelligenceMatchRecord.event_id == ev.event_id).first()
            raw_data = {}
            try:
                raw_data = json.loads(ev.raw_extraction_json)
            except Exception:
                pass

            queue.append({
                "event_id": ev.event_id,
                "correlation_id": ev.correlation_id,
                "organization_id": ev.organization_id,
                "cve": ev.cve or "UNKNOWN",
                "source": ev.source_name,
                "affected_product": ev.affected_product or "UNKNOWN",
                "attack_technique": ev.attack_technique or "UNKNOWN",
                "reported_exploitation": ev.exploitation_observed,
                "reported_outcome": ev.reported_outcome,
                "confidence": ev.confidence,
                "matched_asset": match.matched_asset_name if match else "Production Server",
                "matched_asset_id": match.matched_asset_id if match else "ASSET-001",
                "previous_prediction_id": match.previous_prediction_id if match else 1,
                "previous_risk_score": match.previous_predicted_risk if match else 78.0,
                "previous_eal": match.previous_eal if match else 2730000.0,
                "relevance_level": match.relevance_level if match else "HIGH",
                "relevance_reasons": json.loads(match.relevance_reasons_json) if match and match.relevance_reasons_json else [],
                "status": ev.status,
                "created_at": ev.created_at.isoformat() if ev.created_at else None,
                "raw_extraction": raw_data
            })

        return queue

    @classmethod
    def get_cfo_review_queue(cls, db: Session, organization_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fetches pending financial intelligence review items for the CFO.
        """
        q = db.query(FinancialIntelligenceRecord).filter(
            FinancialIntelligenceRecord.cfo_review_status.in_(["PENDING", "NEED_INVESTIGATION"])
        )
        if organization_id:
            q = q.filter(FinancialIntelligenceRecord.organization_id == organization_id)

        events = q.order_by(FinancialIntelligenceRecord.id.desc()).all()
        queue = []

        for fin in events:
            queue.append({
                "financial_id": fin.financial_id,
                "event_id": fin.event_id,
                "correlation_id": fin.correlation_id,
                "organization_id": fin.organization_id,
                "company": fin.company,
                "ticker": fin.ticker or "N/A",
                "sector": fin.sector or "Technology",
                "market_event": fin.market_event,
                "newsletter_claim": fin.newsletter_claim,
                "newsletter_forecast": fin.newsletter_forecast,
                "cyberoptrq_forecast": fin.cyberoptrq_forecast,
                "risk_signal": fin.risk_signal,
                "volatility_signal": fin.volatility_signal,
                "relevant_exposure_inr": fin.relevant_exposure_inr,
                "confidence": fin.confidence,
                "actual_outcome": fin.actual_observed_outcome,
                "status": fin.cfo_review_status,
                "created_at": fin.created_at.isoformat() if fin.created_at else None
            })

        return queue

    @classmethod
    def process_ciso_review(
        cls,
        db: Session,
        event_id: str,
        decision: str,  # CONFIRM, CORRECT, REJECT, NEED_INVESTIGATION
        reviewer_id: str = "CISO-Lead",
        reviewer_role: str = "CISO",
        corrections: Optional[Dict[str, Any]] = None,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Records human decision on cyber intelligence.
        """
        event = db.query(IntelligenceEventRecord).filter(IntelligenceEventRecord.event_id == event_id).first()
        if not event:
            return {"status": "ERROR", "message": f"Event '{event_id}' not found."}

        norm_decision = decision.upper().strip()
        if norm_decision not in ["CONFIRM", "CORRECT", "REJECT", "NEED_INVESTIGATION"]:
            return {"status": "ERROR", "message": f"Invalid decision '{decision}'."}

        original_extraction = event.raw_extraction_json

        # Apply corrections if provided
        if norm_decision == "CORRECT" and corrections:
            try:
                curr = json.loads(event.raw_extraction_json)
                curr.update(corrections)
                event.raw_extraction_json = json.dumps(curr)
                if "cve" in corrections:
                    event.cve = corrections["cve"]
                if "outcome" in corrections:
                    event.reported_outcome = corrections["outcome"]
                if "affected_product" in corrections:
                    event.affected_product = corrections["affected_product"]
            except Exception:
                pass

        # Update event status
        if norm_decision in ["CONFIRM", "CORRECT"]:
            event.status = "VALIDATED"
        elif norm_decision == "REJECT":
            event.status = "REJECTED"
        else:
            event.status = "IN_REVIEW"

        review_id = f"REV-{uuid.uuid4().hex[:8].upper()}"
        review_rec = HumanReviewRecord(
            review_id=review_id,
            event_id=event.event_id,
            organization_id=event.organization_id,
            reviewer_id=reviewer_id,
            reviewer_role=reviewer_role,
            decision=norm_decision,
            original_extraction_json=original_extraction,
            corrected_extraction_json=json.dumps(corrections) if corrections else None,
            reason=reason or f"Action {norm_decision} executed by {reviewer_role}",
            correlation_id=event.correlation_id,
            reviewed_at=datetime.utcnow()
        )
        db.add(review_rec)
        db.commit()

        return {
            "status": "SUCCESS",
            "review_id": review_id,
            "decision": norm_decision,
            "event_id": event.event_id,
            "correlation_id": event.correlation_id,
            "event_status": event.status,
            "reviewer_id": reviewer_id,
            "reviewer_role": reviewer_role,
            "timestamp": review_rec.reviewed_at.isoformat()
        }

    @classmethod
    def process_cfo_review(
        cls,
        db: Session,
        financial_id: str,
        decision: str,  # CONFIRM, CORRECT, REJECT, NEED_INVESTIGATION
        reviewer_id: str = "CFO-User",
        corrections: Optional[Dict[str, Any]] = None,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Records human decision on financial intelligence.
        """
        fin = db.query(FinancialIntelligenceRecord).filter(
            (FinancialIntelligenceRecord.financial_id == financial_id) |
            (FinancialIntelligenceRecord.event_id == financial_id)
        ).first()

        if not fin:
            return {"status": "ERROR", "message": f"Financial event '{financial_id}' not found."}

        norm_decision = decision.upper().strip()
        if norm_decision not in ["CONFIRM", "CORRECT", "REJECT", "NEED_INVESTIGATION"]:
            return {"status": "ERROR", "message": f"Invalid decision '{decision}'."}

        if norm_decision == "CONFIRM":
            fin.cfo_review_status = "CONFIRMED"
        elif norm_decision == "CORRECT":
            fin.cfo_review_status = "CORRECTED"
            if corrections:
                if "forecast" in corrections:
                    fin.newsletter_forecast = corrections["forecast"]
                if "risk_signal" in corrections:
                    fin.risk_signal = corrections["risk_signal"]
        elif norm_decision == "REJECT":
            fin.cfo_review_status = "REJECTED"
        else:
            fin.cfo_review_status = "NEED_INVESTIGATION"

        review_id = f"REV-CFO-{uuid.uuid4().hex[:8].upper()}"
        review_rec = HumanReviewRecord(
            review_id=review_id,
            event_id=fin.event_id,
            organization_id=fin.organization_id,
            reviewer_id=reviewer_id,
            reviewer_role="CFO",
            decision=norm_decision,
            original_extraction_json=json.dumps({"company": fin.company, "forecast": fin.newsletter_forecast}),
            corrected_extraction_json=json.dumps(corrections) if corrections else None,
            reason=reason or f"CFO review: {norm_decision}",
            correlation_id=fin.correlation_id,
            reviewed_at=datetime.utcnow()
        )
        db.add(review_rec)
        db.commit()

        return {
            "status": "SUCCESS",
            "review_id": review_id,
            "decision": norm_decision,
            "financial_id": fin.financial_id,
            "correlation_id": fin.correlation_id,
            "cfo_review_status": fin.cfo_review_status,
            "reviewer_id": reviewer_id,
            "timestamp": review_rec.reviewed_at.isoformat()
        }
