from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.db_models import Vulnerability, Asset, IncidentHistory, SecurityControl
from app.schemas.schemas import VulnerabilitySchema, AssetSchema, IncidentHistorySchema, SecurityControlSchema

router = APIRouter(prefix="/detect", tags=["Step 1: Data Collection"])

@router.get("/vulnerabilities", response_model=List[VulnerabilitySchema])
def get_public_vulnerabilities(db: Session = Depends(get_db)):
    """Fetch Public Cybersecurity Data: NVD/CVE, EPSS, CISA KEV, MITRE ATT&CK"""
    return db.query(Vulnerability).all()

@router.get("/assets", response_model=List[AssetSchema])
def get_enterprise_assets(db: Session = Depends(get_db)):
    """Fetch Enterprise Asset Inventory: IT, OT, Cloud Assets"""
    return db.query(Asset).all()

@router.get("/incidents", response_model=List[IncidentHistorySchema])
def get_incident_history(db: Session = Depends(get_db)):
    """Fetch Past Enterprise Incident History & Incurred Costs"""
    return db.query(IncidentHistory).all()

@router.get("/controls", response_model=List[SecurityControlSchema])
def get_existing_controls(db: Session = Depends(get_db)):
    """Fetch Existing Security Controls (EDR, Firewall, SIEM, WAF)"""
    return db.query(SecurityControl).all()
