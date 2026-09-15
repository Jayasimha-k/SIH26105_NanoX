from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.db_models import SecurityControl, Asset, Vulnerability, OptimizationRun
from app.schemas.schemas import OptimizationRequest, OptimizationResponse, WhatIfRequest, WhatIfResponse, SecurityControlSchema
from app.services.optimizer import OptimizationEngine
from app.services.risk_engine import RiskEngine
from app.ml.orchestrator import orchestrator

router = APIRouter(prefix="/optimization", tags=["Optimization Engine"])

@router.get("/controls", response_model=List[SecurityControlSchema])
def get_security_controls(db: Session = Depends(get_db)):
    return db.query(SecurityControl).all()

@router.post("/run", response_model=OptimizationResponse)
def run_budget_optimization(payload: OptimizationRequest, db: Session = Depends(get_db)):
    controls = db.query(SecurityControl).all()
    assets = db.query(Asset).all()
    vulns = db.query(Vulnerability).all()

    # Calculate baseline baseline pre_eal
    total_pre_eal = 0.0
    for a in assets:
        for v in vulns:
            feat = {"cvss_score": v.cvss_score, "epss_score": v.epss_score, "criticality_score": a.criticality_score}
            prob = orchestrator.run_pipeline(feat)["final_exploitation_probability"]
            impact = v.financial_impact_base * (a.criticality_score / 5.0)
            total_pre_eal += RiskEngine.calculate_eal_pre(prob, impact)

    result = OptimizationEngine.optimize_security_budget(
        available_budget=payload.budget,
        controls=controls,
        pre_eal=total_pre_eal,
        enforce_control_ids=payload.enforce_control_ids,
        exclude_control_ids=payload.exclude_control_ids,
        target_metric=payload.target_metric
    )

    # Save run to DB
    run_record = OptimizationRun(
        budget=payload.budget,
        target_metric=payload.target_metric,
        selected_control_ids=[c.id for c in result["selected_controls"]],
        pre_eal=result["pre_eal"],
        post_eal=result["post_eal"],
        risk_reduction=result["risk_reduction"],
        rosi=result["rosi"]
    )
    db.add(run_record)
    db.commit()

    return OptimizationResponse(
        budget=result["budget"],
        selected_controls=[SecurityControlSchema.from_orm(c) for c in result["selected_controls"]],
        total_cost=result["total_cost"],
        pre_eal=result["pre_eal"],
        post_eal=result["post_eal"],
        risk_reduction=result["risk_reduction"],
        rosi=result["rosi"],
        execution_time_ms=result["execution_time_ms"]
    )

@router.post("/what-if", response_model=WhatIfResponse)
def simulate_what_if_scenario(payload: WhatIfRequest, db: Session = Depends(get_db)):
    controls = db.query(SecurityControl).filter(SecurityControl.id.in_(payload.active_control_ids)).all()
    assets = db.query(Asset).all()
    vulns = db.query(Vulnerability).all()

    total_pre_eal = 0.0
    for a in assets:
        for v in vulns:
            feat = {"cvss_score": v.cvss_score, "epss_score": v.epss_score, "criticality_score": a.criticality_score}
            prob = orchestrator.run_pipeline(feat)["final_exploitation_probability"] * payload.threat_multiplier
            impact = v.financial_impact_base * (a.criticality_score / 5.0)
            total_pre_eal += RiskEngine.calculate_eal_pre(min(1.0, prob), impact)

    post_eal = RiskEngine.calculate_eal_post(total_pre_eal, controls)
    risk_reduction = RiskEngine.calculate_risk_reduction(total_pre_eal, post_eal)
    total_cost = RiskEngine.calculate_total_cost(controls)
    rosi = RiskEngine.calculate_rosi(risk_reduction, total_cost)

    return WhatIfResponse(
        simulated_budget=payload.budget,
        active_control_count=len(controls),
        total_cost=total_cost,
        simulated_pre_eal=round(total_pre_eal, 2),
        simulated_post_eal=round(post_eal, 2),
        simulated_risk_reduction=round(risk_reduction, 2),
        simulated_rosi=rosi
    )
