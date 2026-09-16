from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.db_models import Asset, Vulnerability, IncidentHistory, RiskAssessment
from app.schemas.schemas import RiskPredictRequest, RiskPredictResponse
from app.ml.risk_models import FullAIRiskPipeline
from app.services.risk_engine import RiskEngine

router = APIRouter(prefix="/predict", tags=["Step 2: AI Prediction Models"])

@router.post("/run", response_model=RiskPredictResponse)
def predict_vulnerability_risk(payload: RiskPredictRequest, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == payload.asset_id).first()
    vuln = db.query(Vulnerability).filter(Vulnerability.id == payload.vulnerability_id).first()

    if not asset or not vuln:
        raise HTTPException(status_code=404, detail="Asset or Vulnerability not found")

    # Fetch incident count for asset
    incident_count = db.query(IncidentHistory).filter(IncidentHistory.asset_id == asset.id).count()

    # Execute Full AI Pipeline: P1 (NVD) + P2 (EPSS) + P3 (CISA KEV) + P4 (MITRE ATT&CK) -> Meta Model -> Org Adapt
    ai_output = FullAIRiskPipeline.run_pipeline(
        cvss_score=vuln.cvss_score,
        cwe_id=vuln.cwe_id,
        epss_score=vuln.epss_score,
        is_cisa_kev=vuln.cisa_kev,
        mitre_technique=vuln.mitre_attack_technique,
        asset_criticality=asset.criticality_score,
        exposure_level=asset.exposure_level,
        incident_count=incident_count
    )

    financial_impact = vuln.financial_impact_base * (asset.criticality_score / 5.0)
    eal_pre = RiskEngine.calculate_eal_pre(ai_output["organization_adapted_probability"], financial_impact)

    # Save RiskAssessment record
    record = RiskAssessment(
        asset_id=asset.id,
        vulnerability_id=vuln.id,
        p1_nvd=ai_output["p1_nvd"],
        p2_epss=ai_output["p2_epss"],
        p3_kev=ai_output["p3_cisa_kev"],
        p4_mitre=ai_output["p4_mitre_attack"],
        meta_prob=ai_output["meta_exploitation_probability"],
        org_adapted_prob=ai_output["organization_adapted_probability"],
        eal_pre=eal_pre,
        eal_post=eal_pre,
        risk_reduction=0.0
    )
    db.add(record)
    db.commit()

    return RiskPredictResponse(
        asset_id=asset.id,
        vulnerability_id=vuln.id,
        p1_nvd=ai_output["p1_nvd"],
        p2_epss=ai_output["p2_epss"],
        p3_cisa_kev=ai_output["p3_cisa_kev"],
        p4_mitre_attack=ai_output["p4_mitre_attack"],
        meta_exploitation_probability=ai_output["meta_exploitation_probability"],
        organization_adapted_probability=ai_output["organization_adapted_probability"],
        financial_impact=round(financial_impact, 2),
        eal_pre_control=eal_pre
    )
