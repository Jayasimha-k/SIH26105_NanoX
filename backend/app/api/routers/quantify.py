from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.db_models import Asset, Vulnerability, SecurityControl, IncidentHistory
from app.ml.risk_models import FullAIRiskPipeline
from app.services.risk_engine import RiskEngine

router = APIRouter(prefix="/quantify", tags=["Step 3: Risk Quantification"])

@router.get("/overview")
def get_risk_quantification_overview(db: Session = Depends(get_db)):
    """Quantifies financial risk in terms of Expected Annual Loss (EAL) across enterprise portfolio"""
    assets = db.query(Asset).all()
    vulns = db.query(Vulnerability).all()
    controls = db.query(SecurityControl).all()

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
            prob = ai_out["organization_adapted_probability"]
            impact = v.financial_impact_base * (a.criticality_score / 5.0)
            pre = RiskEngine.calculate_eal_pre(prob, impact)
            asset_pre_eal += pre
            total_pre_eal += pre

        asset_breakdown.append({
            "asset_id": a.id,
            "asset_name": a.name,
            "asset_type": a.asset_type,
            "criticality_score": a.criticality_score,
            "financial_value": a.financial_value,
            "exposure_level": a.exposure_level,
            "pre_eal": round(asset_pre_eal, 2)
        })

    active_controls = [c for c in controls if c.status in ["APPROVED", "EXECUTED", "VERIFIED"]]
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
        "risk_reduction_pct": round((total_risk_reduction / total_pre_eal * 100.0), 1) if total_pre_eal > 0 else 0.0,
        "active_controls_cost": round(total_cost, 2),
        "enterprise_rosi": rosi,
        "asset_breakdown": asset_breakdown,
        "fair_model_aligned": True
    }
