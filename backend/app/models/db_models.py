import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="SOC")  # CISO, SOC, Security, IT
    organization = Column(String, default="Global Cyber Enterprise")
    is_active = Column(Boolean, default=True)

class Asset(Base):
    __tablename__ = "assets"

    id = Column(String, primary_key=True, index=True)  # e.g., ASSET-001
    name = Column(String, nullable=False)
    asset_type = Column(String, nullable=False)  # IT Asset, OT Asset, Cloud Infrastructure
    criticality_score = Column(Float, nullable=False)  # 1.0 to 10.0
    financial_value = Column(Float, nullable=False)  # Value in INR/USD
    ip_address = Column(String, nullable=True)
    owner = Column(String, nullable=True)
    exposure_level = Column(String, default="INTERNAL")  # INTERNET_FACING, INTERNAL, ISOLATED
    sla_hours = Column(Integer, default=24)

class Vulnerability(Base):
    __tablename__ = "vulnerabilities"

    id = Column(String, primary_key=True, index=True)  # e.g., CVE-2024-21626
    cve_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    cvss_score = Column(Float, nullable=False)
    epss_score = Column(Float, nullable=False)  # 0.0 to 1.0
    cisa_kev = Column(Boolean, default=False)  # Known Exploited Vulnerability flag
    mitre_attack_technique = Column(String, default="T1190")  # e.g. T1190 Exploit Public-Facing App
    mitre_attack_name = Column(String, default="Exploit Public-Facing Application")
    cwe_id = Column(String, default="CWE-787")
    affected_products = Column(String, default="Linux Container Runtime / runc")
    attack_vector = Column(String, default="NETWORK")
    complexity = Column(String, default="LOW")
    privileges_required = Column(String, default="NONE")
    financial_impact_base = Column(Float, nullable=False)  # Base breach cost

class IncidentHistory(Base):
    __tablename__ = "incident_history"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String, ForeignKey("assets.id"), nullable=False)
    incident_name = Column(String, nullable=False)
    incident_type = Column(String, nullable=False)  # Ransomware, Data Breach, DDoS, Privilege Escalation
    loss_incurred = Column(Float, nullable=False)
    date_occurred = Column(String, nullable=False)

class SecurityControl(Base):
    __tablename__ = "security_controls"

    id = Column(String, primary_key=True, index=True)  # e.g., CTRL-001
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # EDR, Firewall, SIEM, WAF, IAM, Patching
    cost = Column(Float, nullable=False)  # Implementation cost
    effectiveness = Column(Float, nullable=False)  # Risk reduction factor (0.0 to 1.0)
    implementation_time_days = Column(Integer, default=7)
    status = Column(String, default="PROPOSED")  # PROPOSED, APPROVED, EXECUTED, VERIFIED
    requires_control_id = Column(String, nullable=True)

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String, ForeignKey("assets.id"), nullable=False)
    vulnerability_id = Column(String, ForeignKey("vulnerabilities.id"), nullable=False)
    p1_nvd = Column(Float, nullable=False)  # Model 1
    p2_epss = Column(Float, nullable=False)  # Model 2
    p3_kev = Column(Float, nullable=False)  # Model 3
    p4_mitre = Column(Float, nullable=False)  # Model 4
    meta_prob = Column(Float, nullable=False)  # Meta Model Ensemble Output
    org_adapted_prob = Column(Float, nullable=False)  # Organization-specific self-learning adaptation
    eal_pre = Column(Float, nullable=False)
    eal_post = Column(Float, nullable=False)
    risk_reduction = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class OptimizationRun(Base):
    __tablename__ = "optimization_runs"

    id = Column(Integer, primary_key=True, index=True)
    budget = Column(Float, nullable=False)
    selected_control_ids = Column(JSON, nullable=False)
    pre_eal = Column(Float, nullable=False)
    post_eal = Column(Float, nullable=False)
    risk_reduction = Column(Float, nullable=False)
    rosi = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String, primary_key=True, index=True)  # REC-001
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    asset_id = Column(String, ForeignKey("assets.id"), nullable=False)
    vulnerability_id = Column(String, ForeignKey("vulnerabilities.id"), nullable=False)
    control_id = Column(String, ForeignKey("security_controls.id"), nullable=False)
    priority = Column(String, default="HIGH")  # CRITICAL, HIGH, MEDIUM, LOW
    expected_risk_reduction = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)
    rosi = Column(Float, nullable=False)
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED, EXECUTED, VERIFIED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ApprovalRecord(Base):
    __tablename__ = "approval_records"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(String, ForeignKey("recommendations.id"), nullable=False)
    user_id = Column(String, nullable=False)
    user_role = Column(String, nullable=False)
    action = Column(String, nullable=False)  # APPROVED, REJECTED
    comments = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class AuditBlock(Base):
    __tablename__ = "audit_blocks"

    id = Column(Integer, primary_key=True, index=True)
    block_index = Column(Integer, nullable=False)
    timestamp = Column(String, nullable=False)
    action = Column(String, nullable=False)
    user_id = Column(String, nullable=False)
    details_json = Column(Text, nullable=False)
    previous_hash = Column(String, nullable=False)
    block_hash = Column(String, nullable=False)
