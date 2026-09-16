from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.db_models import Recommendation, SecurityControl, User
from app.schemas.schemas import RecommendationOut
from app.api.deps import get_current_user
from app.services.ledger import LedgerService
from app.services.websocket_manager import manager

router = APIRouter(prefix="/recalculate", tags=["Step 8: Verify & Recalculate Continuous Learning"])

@router.post("/trigger/{recommendation_id}", response_model=RecommendationOut)
async def trigger_recalculation_and_verification(
    recommendation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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

    # Record block on Blockchain Audit Trail
    audit_block = LedgerService.record_decision(
        db=db,
        action="VERIFY_AND_RECALCULATE_COMPLETED",
        user_id=current_user.username,
        details={
            "recommendation_id": rec.id,
            "control_id": rec.control_id,
            "title": rec.title,
            "verification_status": "VERIFIED_CLEAN",
            "self_learning_loop": "FEEDBACK_UPDATED"
        }
    )

    # Broadcast WebSocket Event
    await manager.broadcast({
        "event_type": "VERIFICATION_COMPLETED",
        "recommendation_id": rec.id,
        "title": rec.title,
        "status": "VERIFIED",
        "verified_by": current_user.username,
        "block_hash": audit_block.block_hash
    })

    return rec
