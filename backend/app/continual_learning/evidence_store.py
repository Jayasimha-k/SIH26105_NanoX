import hashlib
import json
import logging
import datetime
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
from sqlalchemy.orm import Session
from app.models.db_models import ContinualLearningEvidence

logger = logging.getLogger(__name__)

LEARNING_FEATURE_COLUMNS = [
    "fused_probability",
    "p1_nvd",
    "p2_epss",
    "p3_org",
    "p4_mitre",
    "p5_meta",
    "p6_network",
    "asset_criticality",
    "exposure_numeric",
    "control_effectiveness",
    "incident_history_count",
    "remediation_applied",
    "impact_scale"
]

class EvidenceStore:
    """
    Evidence Collection & Ground-Truth Confirmation Store.
    
    Guarantees:
    - Deduplication via deterministic SHA-256 payload hashing.
    - Only confirmed outcomes (CONFIRMED_INCIDENT / CONFIRMED_BENIGN) enter the learning dataset.
    - Unconfirmed events and raw unverified CVE news feeds are strictly kept out of training.
    """

    MIN_CONFIRMED_SAMPLES_DEFAULT = 15

    @staticmethod
    def _compute_hash(payload: Dict[str, Any]) -> str:
        serialized = json.dumps(payload, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    @staticmethod
    def _map_exposure(level: Optional[str]) -> float:
        l = str(level or "INTERNAL").strip().upper()
        if "INTERNET" in l or "EXTERNAL" in l:
            return 1.0
        elif "AIR" in l or "ISOLATED" in l:
            return 0.05
        return 0.35

    @classmethod
    def record_evidence(
        cls,
        db: Session,
        organization_id: str,
        asset_id: str,
        p1_nvd: float,
        p2_epss: float,
        p3_org: float,
        p4_mitre: float,
        p5_meta: float,
        p6_network: float,
        fused_probability: float,
        org_risk_score: float,
        expected_annual_loss: float,
        asset_criticality: float = 5.0,
        exposure_level: str = "INTERNAL",
        control_effectiveness: float = 0.5,
        incident_history_count: int = 0,
        recommended_control: Optional[str] = "NIST-PR.AC-1: Access Control Hardening",
        remediation_applied: int = 0,
        remediation_performed: Optional[int] = None,
        financial_impact_inr: float = 1000000.0,
        threat_id: Optional[str] = None,
        source_provenance: str = "SYSTEM_TELEMETRY",
        is_demo: int = 0,
        evidence_id: Optional[str] = None,
        confirmation_status: str = "PENDING_CONFIRMATION",
        target_label: Optional[int] = None,
        observed_loss_inr: Optional[float] = None,
        confirmed_by: Optional[str] = None,
        confirmation_notes: Optional[str] = None
    ) -> Tuple[ContinualLearningEvidence, bool]:
        """
        Records new operational evidence.
        Returns: (record, is_new: bool)
        """
        if remediation_performed is not None:
            remediation_applied = int(remediation_performed)

        ts = datetime.datetime.utcnow()
        hash_payload = {
            "org": organization_id,
            "asset": asset_id,
            "threat": threat_id,
            "p1": round(float(p1_nvd), 4),
            "p2": round(float(p2_epss), 4),
            "p3": round(float(p3_org), 4),
            "p4": round(float(p4_mitre), 4),
            "p5": round(float(p5_meta), 4),
            "p6": round(float(p6_network), 4),
            "fused": round(float(fused_probability), 4),
            "remediation": int(remediation_applied),
            "control": str(recommended_control or "")
        }
        ev_hash = cls._compute_hash(hash_payload)

        # Deduplication check
        existing = db.query(ContinualLearningEvidence).filter_by(evidence_hash=ev_hash).first()
        if existing:
            return existing, False

        if not evidence_id:
            prefix = "DEMO-EVD" if is_demo else "EVD"
            evidence_id = f"{prefix}-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{ev_hash[:8].upper()}"
        else:
            existing_id = db.query(ContinualLearningEvidence).filter_by(evidence_id=evidence_id).first()
            if existing_id and existing_id.evidence_hash != ev_hash:
                evidence_id = f"{evidence_id}-{organization_id.replace(' ', '')}-{ev_hash[:6].upper()}"

        record = ContinualLearningEvidence(
            evidence_id=evidence_id,
            organization_id=organization_id,
            asset_id=asset_id,
            threat_id=threat_id,
            timestamp=ts,
            p1_nvd=float(p1_nvd),
            p2_epss=float(p2_epss),
            p3_org=float(p3_org),
            p4_mitre=float(p4_mitre),
            p5_meta=float(p5_meta),
            p6_network=float(p6_network),
            fused_probability=float(fused_probability),
            org_risk_score=float(org_risk_score),
            expected_annual_loss=float(expected_annual_loss),
            asset_criticality=float(asset_criticality),
            exposure_level=str(exposure_level),
            control_effectiveness=float(control_effectiveness),
            incident_history_count=int(incident_history_count),
            recommended_control=str(recommended_control or "NIST-PR.AC-1: Access Control Hardening"),
            remediation_applied=int(remediation_applied),
            financial_impact_inr=float(financial_impact_inr),
            confirmation_status=confirmation_status,
            target_label=target_label,
            observed_loss_inr=observed_loss_inr,
            confirmed_by=confirmed_by,
            confirmed_at=ts if target_label is not None else None,
            confirmation_notes=confirmation_notes,
            evidence_hash=ev_hash,
            source_provenance=source_provenance,
            is_demo=int(is_demo)
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record, True

    @classmethod
    def confirm_outcome(
        cls,
        db: Session,
        evidence_id: str,
        outcome_status: str,  # CONFIRMED_INCIDENT, CONFIRMED_BENIGN, REJECTED
        confirmed_by: str,
        observed_loss_inr: Optional[float] = None,
        notes: Optional[str] = None
    ) -> Optional[ContinualLearningEvidence]:
        """
        Human-in-the-loop / SOC Verified Outcome Confirmation.
        Only verified outcomes provide a valid training label (target_label 1 or 0).
        """
        record = db.query(ContinualLearningEvidence).filter_by(evidence_id=evidence_id).first()
        if not record:
            return None

        status_norm = outcome_status.strip().upper()
        if status_norm == "CONFIRMED_INCIDENT":
            record.confirmation_status = "CONFIRMED_INCIDENT"
            record.target_label = 1
        elif status_norm == "CONFIRMED_BENIGN":
            record.confirmation_status = "CONFIRMED_BENIGN"
            record.target_label = 0
        else:
            record.confirmation_status = "REJECTED"
            record.target_label = None

        record.confirmed_by = confirmed_by
        record.confirmed_at = datetime.datetime.utcnow()
        if observed_loss_inr is not None:
            record.observed_loss_inr = float(observed_loss_inr)
        if notes:
            record.confirmation_notes = notes

        db.commit()
        db.refresh(record)
        return record

    @classmethod
    def get_learning_dataset(
        cls,
        db: Session,
        organization_id: Optional[str] = None,
        min_samples: int = MIN_CONFIRMED_SAMPLES_DEFAULT,
        include_demo: bool = True
    ) -> Tuple[Optional[pd.DataFrame], Optional[pd.Series], Dict[str, Any]]:
        """
        Extracts verified learning dataset.
        Enforces strict safeguards:
        - Must have target_label in [0, 1]
        - Must have >= min_samples
        - Must have class diversity (both positive and negative outcomes)
        """
        query = db.query(ContinualLearningEvidence).filter(
            ContinualLearningEvidence.confirmation_status.in_(["CONFIRMED_INCIDENT", "CONFIRMED_BENIGN"]),
            ContinualLearningEvidence.target_label.isnot(None)
        )
        if organization_id:
            query = query.filter(ContinualLearningEvidence.organization_id == organization_id)
        if not include_demo:
            query = query.filter(ContinualLearningEvidence.is_demo == 0)

        records = query.order_by(ContinualLearningEvidence.timestamp.asc()).all()

        meta = {
            "total_records": len(records),
            "min_required": min_samples,
            "status": "READY" if len(records) >= min_samples else "INSUFFICIENT_CONFIRMED_DATA"
        }

        if len(records) < min_samples:
            return None, None, meta

        rows = []
        labels = []
        for r in records:
            rows.append({
                "fused_probability": r.fused_probability,
                "p1_nvd": r.p1_nvd,
                "p2_epss": r.p2_epss,
                "p3_org": r.p3_org,
                "p4_mitre": r.p4_mitre,
                "p5_meta": r.p5_meta,
                "p6_network": r.p6_network,
                "asset_criticality": r.asset_criticality,
                "exposure_numeric": cls._map_exposure(r.exposure_level),
                "control_effectiveness": r.control_effectiveness,
                "incident_history_count": r.incident_history_count,
                "remediation_applied": r.remediation_applied,
                "impact_scale": min(10.0, (r.financial_impact_inr or 1000000.0) / 1000000.0)
            })
            labels.append(r.target_label)

        df_X = pd.DataFrame(rows)
        s_y = pd.Series(labels, name="confirmed_outcome")

        # Class diversity check
        pos_count = int(s_y.sum())
        neg_count = len(s_y) - pos_count
        meta["positive_outcomes"] = pos_count
        meta["negative_outcomes"] = neg_count

        if pos_count == 0 or neg_count == 0:
            meta["status"] = "INSUFFICIENT_CLASS_DIVERSITY"
            return None, None, meta

        # Compute deterministic dataset content hash
        ds_str = s_y.to_string() + df_X.to_string()
        meta["dataset_hash"] = hashlib.sha256(ds_str.encode("utf-8")).hexdigest()
        meta["feature_names"] = LEARNING_FEATURE_COLUMNS

        return df_X, s_y, meta

    @classmethod
    def get_evidence_stats(cls, db: Session, organization_id: Optional[str] = None) -> Dict[str, Any]:
        """Returns live counts and distribution of stored operational evidence."""
        q = db.query(ContinualLearningEvidence)
        if organization_id:
            q = q.filter(ContinualLearningEvidence.organization_id == organization_id)
        all_recs = q.all()

        confirmed_incident = sum(1 for r in all_recs if r.confirmation_status == "CONFIRMED_INCIDENT")
        confirmed_benign = sum(1 for r in all_recs if r.confirmation_status == "CONFIRMED_BENIGN")
        pending = sum(1 for r in all_recs if r.confirmation_status == "PENDING_CONFIRMATION")
        rejected = sum(1 for r in all_recs if r.confirmation_status == "REJECTED")

        total_confirmed = confirmed_incident + confirmed_benign
        return {
            "total_evidence_collected": len(all_recs),
            "total_confirmed": total_confirmed,
            "confirmed_training_samples": total_confirmed,
            "confirmed_incidents": confirmed_incident,
            "confirmed_benign": confirmed_benign,
            "pending_confirmation": pending,
            "rejected_samples": rejected,
            "learning_ready": total_confirmed >= cls.MIN_CONFIRMED_SAMPLES_DEFAULT and confirmed_incident > 0 and confirmed_benign > 0
        }
