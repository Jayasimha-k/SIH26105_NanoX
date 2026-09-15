from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.db_models import Recommendation, SecurityControl, User
from app.schemas.schemas import RecommendationOut
from app.api.deps import get_current_user_optional
from app.services.ledger import LedgerService
from app.services.websocket_manager import manager

router = APIRouter(prefix="/execution", tags=["Implementation & Execution"])

@router.post("/execute/{recommendation_id}", response_model=RecommendationOut)
async def mark_execution(
    recommendation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    rec = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.status = "EXECUTED"
    ctrl = db.query(SecurityControl).filter(SecurityControl.id == rec.control_id).first()
    if ctrl:
        ctrl.status = "EXECUTED"

    db.commit()
    db.refresh(rec)

    # Record audit block
    audit_block = LedgerService.record_decision(
        db=db,
        action="CONTROL_EXECUTED",
        user_id=current_user.username,
        details={"recommendation_id": rec.id, "control_id": rec.control_id, "title": rec.title}
    )

    await manager.broadcast({
        "event_type": "EXECUTION_UPDATED",
        "recommendation_id": rec.id,
        "title": rec.title,
        "status": "EXECUTED",
        "executed_by": current_user.username,
        "block_hash": audit_block.block_hash
    })

    return rec

@router.post("/verify/{recommendation_id}", response_model=RecommendationOut)
async def verify_execution(
    recommendation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    rec = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.status = "VERIFIED"
    ctrl = db.query(SecurityControl).filter(SecurityControl.id == rec.control_id).first()
    if ctrl:
        ctrl.status = "VERIFIED"

    db.commit()
    db.refresh(rec)

    # Record audit block
    audit_block = LedgerService.record_decision(
        db=db,
        action="CONTROL_VERIFIED",
        user_id=current_user.username,
        details={"recommendation_id": rec.id, "control_id": rec.control_id, "title": rec.title}
    )

    await manager.broadcast({
        "event_type": "VERIFICATION_COMPLETED",
        "recommendation_id": rec.id,
        "title": rec.title,
        "status": "VERIFIED",
        "verified_by": current_user.username,
        "block_hash": audit_block.block_hash
    })

    return rec
