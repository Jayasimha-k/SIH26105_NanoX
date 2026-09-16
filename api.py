"""
api.py
Local FastAPI service for Organization Cyber Risk Quantification and Investment Optimization.

Runs completely offline without internet or external API calls.
Endpoints:
- POST /api/v1/organization-risk/predict
- GET  /api/v1/organization-risk/metadata
- GET  /api/v1/organization-risk/health
- POST /api/v1/organization-risk/optimize
"""

import os
import json
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from predict import OrganizationRiskPredictor
from investment_optimizer import InvestmentOptimizer

app = FastAPI(
    title="Cyber Risk Quantification & Investment Optimization API",
    description="Offline-capable organization cybersecurity posture risk assessment and continuous investment optimization platform for SIH 2026.",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Global predictor instance
predictor = OrganizationRiskPredictor()
optimizer = InvestmentOptimizer(predictor.predict_raw_score)


class OrganizationPostureInput(BaseModel):
    organization_size: Optional[str] = Field("medium", description="small, medium, or large")
    industry: Optional[str] = Field("technology", description="finance, healthcare, technology, etc.")
    number_of_employees: Optional[int] = Field(250, ge=1)
    number_of_endpoints: Optional[int] = Field(350, ge=1)
    number_of_servers: Optional[int] = Field(25, ge=0)
    cloud_usage_percentage: Optional[float] = Field(50.0, ge=0, le=100)
    remote_worker_percentage: Optional[float] = Field(30.0, ge=0, le=100)
    mfa_coverage: Optional[float] = Field(50.0, ge=0, le=100)
    privileged_account_mfa: Optional[bool] = False
    privileged_access_management: Optional[bool] = False
    average_patch_delay: Optional[int] = Field(30, ge=0)
    critical_vulnerability_remediation_time: Optional[int] = Field(14, ge=0)
    offline_backup: Optional[bool] = False
    backup_frequency_hours: Optional[int] = Field(24, ge=1)
    edr_coverage: Optional[float] = Field(50.0, ge=0, le=100)
    siem_deployed: Optional[bool] = False
    network_segmentation: Optional[bool] = False
    endpoint_protection_coverage: Optional[float] = Field(70.0, ge=0, le=100)
    incident_response_plan: Optional[bool] = True
    incident_response_testing: Optional[bool] = False
    vendor_risk_management: Optional[bool] = False

    class Config:
        extra = "allow"


class OptimizationInput(BaseModel):
    organization_posture: OrganizationPostureInput
    budget_inr: float = Field(..., ge=0, description="Available budget ceiling in INR (₹)")


@app.get("/api/v1/organization-risk/health")
def health_check():
    return {
        "status": "online",
        "offline_mode": True,
        "onnx_available": predictor.onnx_session is not None,
        "sklearn_available": predictor.sklearn_pipeline is not None,
        "version": "0.1.0"
    }


@app.get("/api/v1/organization-risk/metadata")
def get_metadata():
    meta_path = os.path.join(os.path.dirname(__file__), "models", "organization-risk", "metadata.json")
    if os.path.exists(meta_path):
        with open(meta_path, "r") as f:
            return json.load(f)
    return {
        "name": "organization-risk",
        "version": "0.1.0",
        "framework": "ONNX",
        "task": "organization-cyber-risk-assessment",
        "offline": True
    }


@app.post("/api/v1/organization-risk/predict")
def predict_risk(posture: OrganizationPostureInput):
    try:
        data = posture.model_dump()
        result = predictor.predict_posture(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/organization-risk/optimize")
def optimize_investments(opt_req: OptimizationInput):
    try:
        data = opt_req.organization_posture.model_dump()
        budget = opt_req.budget_inr
        result = optimizer.optimize_portfolio(data, budget)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
