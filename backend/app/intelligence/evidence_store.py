"""
backend/app/intelligence/evidence_store.py
Persistent storage for intelligence events, organization matches, financial signals,
and integration with Continual Learning ground-truth evidence.
"""

import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.db_models import (
    IntelligenceEventRecord,
    OrgIntelligenceMatchRecord,
    FinancialIntelligenceRecord,
    ContinualLearningEvidence
)


class IntelligenceEvidenceStore:
    """
    Manages persistence and correlation for structured intelligence records.
    """

    @staticmethod
    def generate_correlation_id() -> str:
        """Generates deterministic format correlation ID."""
        return f"CORR-2026-{uuid.uuid4().hex[:6].upper()}"

    @classmethod
    def record_cyber_event(
        cls,
        db: Session,
        organization_id: str,
        message_id: Optional[str],
        source_name: str,
        extracted_info: Dict[str, Any],
        match_info: Optional[Dict[str, Any]] = None,
        correlation_id: Optional[str] = None
    ) -> IntelligenceEventRecord:
        """
        Stores an extracted cyber threat intelligence event and its organization match.
        """
        if not correlation_id:
            correlation_id = cls.generate_correlation_id()

        event_id = f"INTEL-CYBER-{uuid.uuid4().hex[:8].upper()}"

        event_rec = IntelligenceEventRecord(
            event_id=event_id,
            correlation_id=correlation_id,
            organization_id=organization_id,
            message_id=message_id,
            category="CYBERSECURITY",
            source_name=source_name,
            cve=extracted_info.get("cve"),
            affected_product=extracted_info.get("product"),
            version=extracted_info.get("version"),
            attack_technique=extracted_info.get("attack_technique"),
            threat_actor=extracted_info.get("threat_actor"),
            exploitation_observed=bool(extracted_info.get("exploitation_observed")),
            reported_outcome=extracted_info.get("outcome", "UNKNOWN"),
            confidence=float(extracted_info.get("confidence", 0.85)),
            financial_impact_est=extracted_info.get("financial_impact"),
            raw_extraction_json=json.dumps(extracted_info),
            status="MATCHED" if match_info and match_info.get("relevance_level") != "NONE" else "EXTRACTED"
        )
        db.add(event_rec)
        db.commit()

        if match_info:
            match_id = f"MATCH-{uuid.uuid4().hex[:8].upper()}"
            match_rec = OrgIntelligenceMatchRecord(
                match_id=match_id,
                event_id=event_id,
                organization_id=organization_id,
                matched_asset_id=match_info.get("matched_asset_id"),
                matched_asset_name=match_info.get("matched_asset_name"),
                matched_vulnerability_id=match_info.get("matched_vulnerability_id"),
                previous_prediction_id=match_info.get("previous_prediction_id"),
                previous_predicted_risk=match_info.get("previous_predicted_risk"),
                previous_eal=match_info.get("previous_eal"),
                relevance_level=match_info.get("relevance_level", "HIGH"),
                relevance_reasons_json=json.dumps(match_info.get("reasons", []))
            )
            db.add(match_rec)
            db.commit()

        return event_rec

    @classmethod
    def record_financial_event(
        cls,
        db: Session,
        organization_id: str,
        message_id: Optional[str],
        source_name: str,
        extracted_info: Dict[str, Any],
        match_info: Optional[Dict[str, Any]] = None,
        correlation_id: Optional[str] = None
    ) -> FinancialIntelligenceRecord:
        """
        Stores an extracted financial signal and its portfolio exposure relevance.
        """
        if not correlation_id:
            correlation_id = cls.generate_correlation_id()

        event_id = f"INTEL-FIN-{uuid.uuid4().hex[:8].upper()}"

        fin_rec = FinancialIntelligenceRecord(
            financial_id=event_id,
            event_id=event_id,
            correlation_id=correlation_id,
            organization_id=organization_id,
            company=extracted_info.get("company", "UNKNOWN"),
            ticker=extracted_info.get("ticker"),
            sector=extracted_info.get("sector"),
            market_event=extracted_info.get("market_event"),
            newsletter_claim=extracted_info.get("investment_thesis") or extracted_info.get("market_event") or "Market Expansion",
            newsletter_forecast=extracted_info.get("newsletter_forecast", "UNKNOWN"),
            cyberoptrq_forecast="Predicted higher compliance and cloud infrastructure expenditure",
            risk_signal=extracted_info.get("risk_signal", "MODERATE"),
            volatility_signal=extracted_info.get("volatility_signal", "LOW"),
            relevant_exposure_inr=match_info.get("relevant_exposure_inr", 3500000.0) if match_info else 3500000.0,
            confidence=float(extracted_info.get("confidence", 0.85)),
            cfo_review_status="PENDING"
        )
        db.add(fin_rec)
        db.commit()

        return fin_rec
