from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models.db_models import Asset, Vulnerability, SecurityControl
from app.schemas.schemas import RiskAssessRequest, RiskAssessResponse
from app.ml.orchestrator import orchestrator
from app.services.risk_engine import RiskEngine

router = APIRouter(prefix="/risk", tags=["Risk Engine"])

@router.post("/assess", response_model=RiskAssessResponse)
def assess_risk_profile(payload: RiskAssessRequest, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == payload.asset_id).first()
    vuln = db.query(Vulnerability).filter(Vulnerability.id == payload.vulnerability_id).first()
    if not asset or not vuln:
        raise HTTPException(status_code=404, detail="Asset or Vulnerability not found")

    controls = db.query(SecurityControl).filter(SecurityControl.id.in_(payload.control_ids)).all() if payload.control_ids else []

    features = {
        "cvss_score": vuln.cvss_score,
        "epss_score": vuln.epss_score,
        "cisa_kev": vuln.cisa_kev,
        "criticality_score": asset.criticality_score
    }
    ml_result = orchestrator.run_pipeline(features)
    prob = ml_result["final_exploitation_probability"]
    impact = vuln.financial_impact_base * (asset.criticality_score / 5.0)

    eval_data = RiskEngine.evaluate_risk_profile(prob, impact, controls)

    return RiskAssessResponse(
        asset_id=asset.id,
        vulnerability_id=vuln.id,
        exploitation_probability=eval_data["exploitation_probability"],
        financial_impact=eval_data["financial_impact"],
        eal_pre_control=eval_data["eal_pre"],
        eal_post_control=eval_data["eal_post"],
        risk_reduction=eval_data["risk_reduction"],
        total_control_cost=eval_data["total_control_cost"],
        rosi=eval_data["rosi"]
    )

from app.api.routers.demo import _attack_state

@router.get("/overview")
def get_enterprise_risk_overview(db: Session = Depends(get_db)):
    """Computes enterprise aggregate EAL, active threats, ROSI stats, reflecting active attack telemetry."""
    assets = db.query(Asset).all()
    vulns = db.query(Vulnerability).all()
    controls = db.query(SecurityControl).all()

    total_pre_eal = 0.0

    for a in assets:
        for v in vulns:
            features = {"cvss_score": v.cvss_score, "epss_score": v.epss_score, "criticality_score": a.criticality_score}
            prob = orchestrator.run_pipeline(features)["final_exploitation_probability"]
            impact = v.financial_impact_base * (a.criticality_score / 5.0)
            pre = RiskEngine.calculate_eal_pre(prob, impact)
            total_pre_eal += pre

    # Attack telemetry state
    is_attack = bool(_attack_state.get("active")) or _attack_state.get("status") == "ATTACK_STARTED"
    is_completed = _attack_state.get("status") == "ATTACK_COMPLETED"
    pipeline_info = _attack_state.get("pipeline") or {}
    attack_surge = float(pipeline_info.get("eal_spike_inr") or 21787680.0)

    if is_attack:
        total_pre_eal += attack_surge

    # Active implemented controls
    active_controls = [c for c in controls if c.status in ["APPROVED", "EXECUTED", "VERIFIED"]]
    if is_completed:
        total_post_eal = round(total_pre_eal * 0.16, 2)
    else:
        total_post_eal = RiskEngine.calculate_eal_post(total_pre_eal, active_controls)

    total_risk_reduction = RiskEngine.calculate_risk_reduction(total_pre_eal, total_post_eal)
    total_cost = RiskEngine.calculate_total_cost(active_controls)
    rosi = RiskEngine.calculate_rosi(total_risk_reduction, total_cost)

    return {
        "total_assets": len(assets),
        "total_vulnerabilities": len(vulns),
        "total_pre_control_eal": round(total_pre_eal, 2),
        "total_post_control_eal": round(total_post_eal, 2),
        "total_risk_reduction": round(total_risk_reduction, 2),
        "active_controls_cost": round(total_cost, 2),
        "enterprise_rosi": rosi,
        "is_attack_active": is_attack,
        "is_attack_completed": is_completed,
        "currency": "INR",
        "last_updated": "Just now"
    }
