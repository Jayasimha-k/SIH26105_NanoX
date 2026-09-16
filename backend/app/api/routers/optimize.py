from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.db_models import SecurityControl, Asset, Vulnerability, OptimizationRun, Recommendation, IncidentHistory
from app.schemas.schemas import OptimizationRequest, OptimizationResponse, RecommendationOut, SecurityControlSchema
from app.services.optimizer import OptimizationEngine
from app.services.risk_engine import RiskEngine
from app.ml.risk_models import FullAIRiskPipeline

router = APIRouter(prefix="/optimize", tags=["Steps 4 & 5: Optimization & Recommendations"])

@router.post("/run", response_model=OptimizationResponse)
def run_budget_optimization(payload: OptimizationRequest, db: Session = Depends(get_db)):
    controls = db.query(SecurityControl).all()
    assets = db.query(Asset).all()
    vulns = db.query(Vulnerability).all()

    total_pre_eal = 0.0
    for a in assets:
        inc_count = db.query(IncidentHistory).filter(IncidentHistory.asset_id == a.id).count()
        for v in vulns:
            ai_out = FullAIRiskPipeline.run_pipeline(
                cvss_score=v.cvss_score, cwe_id=v.cwe_id, epss_score=v.epss_score,
                is_cisa_kev=v.cisa_kev, mitre_technique=v.mitre_attack_technique,
                asset_criticality=a.criticality_score, exposure_level=a.exposure_level,
                incident_count=inc_count
            )
            prob = ai_out["organization_adapted_probability"]
            impact = v.financial_impact_base * (a.criticality_score / 5.0)
            total_pre_eal += RiskEngine.calculate_eal_pre(prob, impact)

    result = OptimizationEngine.optimize_security_budget(
        available_budget=payload.budget,
        controls=controls,
        pre_eal=total_pre_eal,
        enforce_control_ids=payload.enforce_control_ids,
        exclude_control_ids=payload.exclude_control_ids
    )

    run_record = OptimizationRun(
        budget=payload.budget,
        selected_control_ids=[c.id for c in result["selected_controls"]],
        pre_eal=result["pre_eal"],
        post_eal=result["post_eal"],
        risk_reduction=result["risk_reduction"],
        rosi=result["rosi"]
    )
    db.add(run_record)
    db.commit()

    pct = round((result["risk_reduction"] / total_pre_eal * 100.0), 1) if total_pre_eal > 0 else 0.0

    return OptimizationResponse(
        budget=result["budget"],
        selected_controls=[SecurityControlSchema.from_orm(c) for c in result["selected_controls"]],
        total_cost=result["total_cost"],
        pre_eal=result["pre_eal"],
        post_eal=result["post_eal"],
        risk_reduction=result["risk_reduction"],
        risk_reduction_pct=pct,
        rosi=result["rosi"],
        execution_time_ms=result["execution_time_ms"]
    )

@router.get("/recommendations", response_model=List[RecommendationOut])
def get_recommendations(db: Session = Depends(get_db)):
    return db.query(Recommendation).all()
