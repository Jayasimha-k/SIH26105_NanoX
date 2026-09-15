from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.db_models import AuditBlock
from app.schemas.schemas import AuditBlockSchema
from app.services.ledger import LedgerService

router = APIRouter(prefix="/audit", tags=["Blockchain Ledger Audit"])

@router.get("/blocks", response_model=List[AuditBlockSchema])
def get_audit_blocks(db: Session = Depends(get_db)):
    return db.query(AuditBlock).order_by(AuditBlock.block_index.asc()).all()

@router.get("/verify")
def verify_ledger_integrity(db: Session = Depends(get_db)):
    is_valid, message, count = LedgerService.verify_chain_integrity(db)
    return {
        "is_valid": is_valid,
        "message": message,
        "total_blocks_checked": count,
        "algorithm": "SHA-256 Block Chaining (Permissioned Ledger Standard)"
    }
