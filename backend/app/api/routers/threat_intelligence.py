"""
backend/app/api/routers/threat_intelligence.py
FastAPI router for Continuous Cyber Threat Intelligence Ingestion and Risk Reassessment.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.db_models import ThreatIntelligenceRecord
from app.threat_intelligence.service import ThreatIntelligenceService

router = APIRouter(prefix="/threat-intelligence", tags=["Threat Intelligence"])

class ManualAdvisoryRequest(BaseModel):
    content: str
    source_name: Optional[str] = "Manual Security Advisory"

class ReassessRequest(BaseModel):
    threat_id: Optional[str] = None
    organization_id: Optional[str] = "Hospital A"
    simulated_p6_evidence: Optional[float] = None

class IngestRequest(BaseModel):
    offline_mode: bool = True

@router.get("/sources")
def get_sources():
    """Returns configured threat intelligence sources registry."""
    return {
        "status": "SUCCESS",
        "sources": ThreatIntelligenceService.load_sources_config()
    }

@router.get("/records")
def get_records(
    validation_status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Retrieves threat intelligence records from the local database."""
    query = db.query(ThreatIntelligenceRecord)
    if validation_status:
        query = query.filter(ThreatIntelligenceRecord.validation_status == validation_status)
    
    records = query.order_by(ThreatIntelligenceRecord.first_seen_at.desc()).limit(limit).all()
    
    return {
        "status": "SUCCESS",
        "total_count": len(records),
        "records": [
            {
                "threat_id": r.threat_id,
                "cve": r.cve,
                "source": r.source,
                "source_url": r.source_url,
                "title": r.title,
                "description": r.description,
                "published_at": r.published_at,
                "first_seen_at": r.first_seen_at.isoformat() if r.first_seen_at else None,
                "validation_status": r.validation_status,
                "affected_product": r.affected_product,
                "attack_type": r.attack_type,
                "model_assessment_status": r.model_assessment_status,
                "processed_at": r.processed_at.isoformat() if r.processed_at else None
            }
            for r in records
        ]
    }

@router.post("/ingest")
def trigger_ingestion(
    request: IngestRequest = Body(default_factory=IngestRequest),
    db: Session = Depends(get_db)
):
    """
    Triggers threat feed ingestion from configured sources.
    Defaults to offline mode (local cached feeds).
    """
    try:
        res = ThreatIntelligenceService.ingest_from_registry(db, offline_mode=request.offline_mode)
        return {"status": "SUCCESS", "result": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import-advisory")
def import_advisory(
    request: ManualAdvisoryRequest,
    db: Session = Depends(get_db)
):
    """Imports raw security advisory text or JSON snippet."""
    res = ThreatIntelligenceService.ingest_manual_advisory(db, request.content, request.source_name)
    return {"status": "SUCCESS", "result": res}

@router.post("/reassess")
def trigger_reassessment(
    request: ReassessRequest = Body(default_factory=ReassessRequest),
    db: Session = Depends(get_db)
):
    """
    Triggers automated P1-P6 evaluation + Fusion v2 + EAL reassessment + Fabric ledger commit.
    """
    try:
        results = ThreatIntelligenceService.run_reassessment(
            db=db,
            threat_id=request.threat_id,
            org_id=request.organization_id,
            simulated_p6_evidence=request.simulated_p6_evidence
        )
        return {
            "status": "SUCCESS",
            "reassessed_count": len(results),
            "reassessments": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
