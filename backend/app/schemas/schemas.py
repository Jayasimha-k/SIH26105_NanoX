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
    asset_type: str  # IT Asset, OT Asset, Cloud Infrastructure
    criticality_score: float
    financial_value: float
    ip_address: Optional[str] = None
    owner: Optional[str] = None
    exposure_level: str = "INTERNAL"
    sla_hours: int = 24

    class Config:
        from_attributes = True

# Vulnerability Schemas (PDF Data Collection)
class VulnerabilitySchema(BaseModel):
    id: str
    cve_id: str
    title: str
    cvss_score: float
    epss_score: float
    cisa_kev: bool = False
    mitre_attack_technique: str = "T1190"
    mitre_attack_name: str = "Exploit Public-Facing Application"
    cwe_id: str = "CWE-787"
    affected_products: str = "Standard System Component"
    attack_vector: str = "NETWORK"
    complexity: str = "LOW"
    privileges_required: str = "NONE"
    financial_impact_base: float

    class Config:
        from_attributes = True

# Incident History Schema
class IncidentHistorySchema(BaseModel):
    id: int
    asset_id: str
    incident_name: str
    incident_type: str
    loss_incurred: float
    date_occurred: str

    class Config:
        from_attributes = True

# Security Control Schema
class SecurityControlSchema(BaseModel):
    id: str
    code: str
    name: str
    category: str  # EDR, Firewall, SIEM, WAF, IAM, Patching
    cost: float
    effectiveness: float
    implementation_time_days: int = 7
    status: str = "PROPOSED"
    requires_control_id: Optional[str] = None

    class Config:
        from_attributes = True

# Predict & Quantify Schemas
class RiskPredictRequest(BaseModel):
    asset_id: str
    vulnerability_id: str

class RiskPredictResponse(BaseModel):
    asset_id: str
    vulnerability_id: str
    p1_nvd: float
    p2_epss: float
    p3_cisa_kev: float
    p4_mitre_attack: float
    raw_probability: Optional[float] = None
    calibrated_probability: Optional[float] = None
    meta_exploitation_probability: float
    organization_adapted_probability: float
    financial_impact: float
    eal_pre_control: float
    conflict_information: Optional[Dict[str, Any]] = None
    p1_class: Optional[int] = None
    p2_class: Optional[int] = None
    p3_class: Optional[int] = None
    p4_class: Optional[int] = None
    meta_prediction_class: Optional[int] = None
    probability_horizon: Optional[str] = "Annualized Expected Exploitation Frequency"
    models_used: Optional[List[str]] = []
    architecture: Optional[str] = "P1 + P2 + P3 + P4 -> Meta Model 5 -> P5"

# Optimization Schemas
class OptimizationRequest(BaseModel):
    budget: float
    enforce_control_ids: Optional[List[str]] = []
    exclude_control_ids: Optional[List[str]] = []

class OptimizationResponse(BaseModel):
    budget: float
    selected_controls: List[SecurityControlSchema]
    total_cost: float
    pre_eal: float
    post_eal: float
    risk_reduction: float
    risk_reduction_pct: float
    rosi: float
    execution_time_ms: float

# Recommendation Schema
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
