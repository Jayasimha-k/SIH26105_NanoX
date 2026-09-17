from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.db_models import Asset, Vulnerability, SecurityControl, IncidentHistory
from app.ml.risk_models import FullAIRiskPipeline
from app.services.risk_engine import RiskEngine
from app.api.routers.demo import _attack_state

router = APIRouter(prefix="/quantify", tags=["Step 3: Risk Quantification"])

@router.get("/overview")
def get_risk_quantification_overview(db: Session = Depends(get_db)):
    """Quantifies financial risk in terms of Expected Annual Loss (EAL) across enterprise portfolio, dynamically reflecting active attack telemetry."""
    assets = db.query(Asset).all()
    vulns = db.query(Vulnerability).all()
    controls = db.query(SecurityControl).all()

    active_controls = [c for c in controls if c.status in ["APPROVED", "EXECUTED", "VERIFIED"]]
    effective_controls = active_controls if active_controls else controls

    # Attack telemetry state
    is_attack = bool(_attack_state.get("active")) or _attack_state.get("status") == "ATTACK_STARTED"
    is_completed = _attack_state.get("status") == "ATTACK_COMPLETED"
    target_asset_id = _attack_state.get("asset_id", "ASSET-001")
    pipeline_info = _attack_state.get("pipeline") or {}
    attack_surge = float(pipeline_info.get("eal_spike_inr") or 21787680.0)

    total_pre_eal = 0.0
    asset_breakdown = []

    for a in assets:
        inc_count = db.query(IncidentHistory).filter(IncidentHistory.asset_id == a.id).count()
        asset_pre_eal = 0.0

        for v in vulns:
            ai_out = FullAIRiskPipeline.run_pipeline(
                cvss_score=v.cvss_score, cwe_id=v.cwe_id, epss_score=v.epss_score,
                is_cisa_kev=v.cisa_kev, mitre_technique=v.mitre_attack_technique,
                asset_criticality=a.criticality_score, exposure_level=a.exposure_level,
                incident_count=inc_count
            )
            prob = ai_out["calibrated_probability"]
            impact = v.financial_impact_base * (a.criticality_score / 5.0)
            pre = RiskEngine.calculate_eal_pre(prob, impact)
            asset_pre_eal += pre
            total_pre_eal += pre

        # If attack is active against this asset, surge its EAL
        is_this_attacked = is_attack and (a.id == target_asset_id or (not any(x.id == target_asset_id for x in assets) and a.id == "ASSET-001"))
        if is_this_attacked:
            asset_pre_eal += attack_surge
            total_pre_eal += attack_surge

        asset_post_eal = RiskEngine.calculate_eal_post(asset_pre_eal, effective_controls)
        asset_reduction = RiskEngine.calculate_risk_reduction(asset_pre_eal, asset_post_eal)

        asset_breakdown.append({
            "asset_id": a.id,
            "asset_name": a.name,
            "asset_type": a.asset_type,
            "criticality_score": a.criticality_score,
            "financial_value": a.financial_value,
            "exposure_level": a.exposure_level,
            "pre_eal": round(asset_pre_eal, 2),
            "post_eal": round(asset_post_eal, 2),
            "risk_reduction": round(asset_reduction, 2),
            "is_under_attack": is_this_attacked
        })

    if is_completed:
        total_post_eal = round(total_pre_eal * 0.16, 2)
    else:
        total_post_eal = RiskEngine.calculate_eal_post(total_pre_eal, effective_controls)

    total_risk_reduction = RiskEngine.calculate_risk_reduction(total_pre_eal, total_post_eal)
    total_cost = RiskEngine.calculate_total_cost(effective_controls)
    rosi = RiskEngine.calculate_rosi(total_risk_reduction, total_cost)

    return {
        "total_assets": len(assets),
        "total_vulnerabilities": len(vulns),
        "total_pre_control_eal": round(total_pre_eal, 2),
        "total_post_control_eal": round(total_post_eal, 2),
        "total_risk_reduction": round(total_risk_reduction, 2),
        "risk_reduction_pct": round((total_risk_reduction / total_pre_eal * 100.0), 1) if total_pre_eal > 0 else 0.0,
        "active_controls_cost": round(total_cost, 2),
        "enterprise_rosi": rosi,
        "is_attack_active": is_attack,
        "is_attack_completed": is_completed,
        "correlation_id": _attack_state.get("correlation_id"),
        "asset_breakdown": asset_breakdown,
        "controls_mode": "active" if active_controls else "recommended",
        "fair_model_aligned": True
    }
