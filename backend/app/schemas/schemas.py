from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "SOC"

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: str
    organization: str
    is_active: bool

    class Config:
        from_attributes = True

# Asset Schemas
class AssetSchema(BaseModel):
    id: str
    name: str
    asset_type: str
    criticality_score: float
    financial_value: float
    ip_address: Optional[str] = None
    owner: Optional[str] = None
    exposure_level: str = "INTERNAL"

    class Config:
        from_attributes = True

# Vulnerability Schemas
class VulnerabilitySchema(BaseModel):
    id: str
    cve_id: str
    title: str
    cvss_score: float
    epss_score: float
    cisa_kev: bool = False
    attack_vector: str = "NETWORK"
    complexity: str = "LOW"
    privileges_required: str = "NONE"
    financial_impact_base: float

    class Config:
        from_attributes = True

# Security Control Schemas
class SecurityControlSchema(BaseModel):
    id: str
    code: str
    name: str
    category: str
    cost: float
    effectiveness: float
    implementation_time_days: int = 7
    status: str = "PROPOSED"
    requires_control_id: Optional[str] = None

    class Config:
        from_attributes = True

# ML Prediction Schemas
class PredictRequest(BaseModel):
    asset_id: str
    vulnerability_id: str
    features: Optional[Dict[str, Any]] = None

class PredictResponse(BaseModel):
    asset_id: str
    vulnerability_id: str
    base_model_predictions: Dict[str, float]
    meta_model_prediction: float
    exploitation_probability: float
    financial_impact: float
    eal_pre_control: float

# Risk Engine Schemas
class RiskAssessRequest(BaseModel):
    asset_id: str
    vulnerability_id: str
    control_ids: List[str] = []

class RiskAssessResponse(BaseModel):
    asset_id: str
    vulnerability_id: str
    exploitation_probability: float
    financial_impact: float
    eal_pre_control: float
    eal_post_control: float
    risk_reduction: float
    total_control_cost: float
    rosi: float

# Optimization Schemas
class OptimizationRequest(BaseModel):
    budget: float
    target_metric: str = "MAX_RISK_REDUCTION"
    enforce_control_ids: Optional[List[str]] = []
    exclude_control_ids: Optional[List[str]] = []

class OptimizationResponse(BaseModel):
    budget: float
    selected_controls: List[SecurityControlSchema]
    total_cost: float
    pre_eal: float
    post_eal: float
    risk_reduction: float
    rosi: float
    execution_time_ms: float

# What-If Analysis Schemas
class WhatIfRequest(BaseModel):
    budget: float
    active_control_ids: List[str]
    threat_multiplier: float = 1.0

class WhatIfResponse(BaseModel):
    simulated_budget: float
    active_control_count: int
    total_cost: float
    simulated_pre_eal: float
    simulated_post_eal: float
    simulated_risk_reduction: float
    simulated_rosi: float

# Recommendation & Approval Schemas
class RecommendationOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    asset_id: str
    vulnerability_id: str
    control_id: str
    priority: str
    expected_risk_reduction: float
    cost: float
    rosi: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ApprovalRequest(BaseModel):
    action: str  # APPROVED or REJECTED
    comments: Optional[str] = ""

# Blockchain Audit Block Schema
class AuditBlockSchema(BaseModel):
    id: int
    block_index: int
    timestamp: str
    action: str
    user_id: str
    details_json: str
    previous_hash: str
    block_hash: str

    class Config:
        from_attributes = True
