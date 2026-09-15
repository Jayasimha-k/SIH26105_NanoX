from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.database import get_db
from app.models.db_models import Asset, Vulnerability, ModelPrediction
from app.schemas.schemas import PredictRequest, PredictResponse
from app.ml.orchestrator import orchestrator
from app.services.risk_engine import RiskEngine

router = APIRouter(prefix="/ml", tags=["ML Engine"])

@router.get("/models")
def get_model_metadata():
    """Returns metadata, inputs, metrics for plug-and-play models 1..4 + meta_model"""
    return orchestrator.get_all_model_metadata()

@router.post("/predict", response_model=PredictResponse)
def predict_vulnerability_risk(payload: PredictRequest, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == payload.asset_id).first()
    vuln = db.query(Vulnerability).filter(Vulnerability.id == payload.vulnerability_id).first()

    if not asset or not vuln:
        raise HTTPException(status_code=404, detail="Specified Asset or Vulnerability not found")

    # Build normalized feature vector
    features = {
        "cvss_score": vuln.cvss_score,
        "epss_score": vuln.epss_score,
        "cisa_kev": vuln.cisa_kev,
        "criticality_score": asset.criticality_score,
        "financial_value": asset.financial_value,
        "exposure_level": asset.exposure_level,
        "financial_impact_base": vuln.financial_impact_base
    }

    # Override with custom client features if provided
    if payload.features:
        features.update(payload.features)

    # Execute ML Orchestrator 2-stage pipeline
    ml_result = orchestrator.run_pipeline(features)
    exploit_prob = ml_result["final_exploitation_probability"]
    financial_impact = vuln.financial_impact_base * (asset.criticality_score / 5.0)
    eal_pre = RiskEngine.calculate_eal_pre(exploit_prob, financial_impact)

    # Record prediction in DB
    record = ModelPrediction(
        asset_id=asset.id,
        vulnerability_id=vuln.id,
        model_1_score=ml_result["base_model_predictions"].get("model_1", 0.5),
        model_2_score=ml_result["base_model_predictions"].get("model_2", 0.5),
        model_3_score=ml_result["base_model_predictions"].get("model_3", 0.5),
        model_4_score=ml_result["base_model_predictions"].get("model_4", 0.5),
        meta_model_score=ml_result["meta_model_prediction"]
    )
    db.add(record)
    db.commit()

    return PredictResponse(
        asset_id=asset.id,
        vulnerability_id=vuln.id,
        base_model_predictions=ml_result["base_model_predictions"],
        meta_model_prediction=ml_result["meta_model_prediction"],
        exploitation_probability=exploit_prob,
        financial_impact=round(financial_impact, 2),
        eal_pre_control=eal_pre
    )
