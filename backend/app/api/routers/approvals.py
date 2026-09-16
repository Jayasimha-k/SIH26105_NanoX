from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.db_models import Recommendation, ApprovalRecord, SecurityControl, User
from app.schemas.schemas import ApprovalRequest, RecommendationOut
from app.api.deps import get_current_user
from app.services.ledger import LedgerService
from app.services.websocket_manager import manager

router = APIRouter(prefix="/approvals", tags=["Human-in-the-Loop Approvals"])

@router.post("/{recommendation_id}", response_model=RecommendationOut)
async def process_approval(
    recommendation_id: str,
    payload: ApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rec = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    action_status = "APPROVED" if payload.action.upper() == "APPROVED" else "REJECTED"
    rec.status = action_status

    # Record Approval entry
    approval = ApprovalRecord(
        recommendation_id=rec.id,
        user_id=current_user.username,
        user_role=current_user.role,
        action=action_status,
        comments=payload.comments
    )
    db.add(approval)

    # Update associated Security Control status
    ctrl = db.query(SecurityControl).filter(SecurityControl.id == rec.control_id).first()
    if ctrl and action_status == "APPROVED":
        ctrl.status = "APPROVED"

    db.commit()
    db.refresh(rec)

    # Record on Blockchain Audit Ledger
    audit_block = LedgerService.record_decision(
        db=db,
        action=f"RECOMMENDATION_{action_status}",
        user_id=current_user.username,
        details={
            "recommendation_id": rec.id,
            "title": rec.title,
            "cost": rec.cost,
            "expected_risk_reduction": rec.expected_risk_reduction,
            "comments": payload.comments,
            "user_role": current_user.role
        }
    )

    # Broadcast WebSocket Event to CISO, SOC, IT clients
    event_payload = {
        "event_type": "CONTROL_APPROVED" if action_status == "APPROVED" else "CONTROL_REJECTED",
        "recommendation_id": rec.id,
        "title": rec.title,
        "control_id": rec.control_id,
        "status": action_status,
        "approved_by": current_user.username,
        "role": current_user.role,
        "block_hash": audit_block.block_hash
    }
    await manager.broadcast(event_payload)

    return rec
