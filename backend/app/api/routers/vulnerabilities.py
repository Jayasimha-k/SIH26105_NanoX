from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.db_models import Vulnerability
from app.schemas.schemas import VulnerabilitySchema

router = APIRouter(prefix="/vulnerabilities", tags=["Vulnerabilities"])

@router.get("/", response_model=List[VulnerabilitySchema])
def get_vulnerabilities(db: Session = Depends(get_db)):
    return db.query(Vulnerability).all()

@router.get("/{vuln_id}", response_model=VulnerabilitySchema)
def get_vulnerability(vuln_id: str, db: Session = Depends(get_db)):
    vuln = db.query(Vulnerability).filter(Vulnerability.id == vuln_id).first()
    if not vuln:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    return vuln
