-- ==============================================================================
-- CYBEROPTRQ — SUPABASE / POSTGRESQL MULTI-TENANT ENTERPRISE SCHEMA (v1.0)
-- Aligned with: SIH 26105 Production Architecture + Supabase RLS + RBAC
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. MULTI-TENANT FOUNDATION & RBAC
-- ==============================================================================

-- Organizations (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(128) NOT NULL UNIQUE,
    domain VARCHAR(255) NOT NULL,
    industry VARCHAR(128) DEFAULT 'Technology',
    business_size VARCHAR(64) DEFAULT 'Enterprise (1000-5000)',
    country_region VARCHAR(128) DEFAULT 'India / South Asia',
    technology_stack JSONB DEFAULT '[]'::jsonb,
    cloud_providers JSONB DEFAULT '[]'::jsonb,
    critical_services JSONB DEFAULT '[]'::jsonb,
    mfa_coverage_pct NUMERIC(5,2) DEFAULT 95.00,
    edr_coverage_pct NUMERIC(5,2) DEFAULT 92.50,
    historical_incidents_count INT DEFAULT 2,
    financial_exposure NUMERIC(15,2) DEFAULT 3500000.00,
    status VARCHAR(32) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles (Linked to Supabase auth.users or internal auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE, -- References auth.users(id) in Supabase
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    default_organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE SET NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'VIEWER', -- ADMIN, CISO, CFO, SECURITY_ANALYST, VIEWER
    status VARCHAR(32) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Memberships (Multi-tenancy mapping)
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'SECURITY_ANALYST', -- ADMIN, CISO, CFO, SECURITY_ANALYST, VIEWER
    permissions JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(32) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, profile_id)
);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(64) PRIMARY KEY, -- CORE, ENTERPRISE, AIR_GAPPED
    name VARCHAR(128) NOT NULL,
    description TEXT,
    tier VARCHAR(32) NOT NULL,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    price_annual NUMERIC(12,2) DEFAULT 0.00,
    status VARCHAR(32) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions (Per-tenant entitlements)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id VARCHAR(64) NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, TRIALING, PAST_DUE, CANCELLED
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year'),
    enabled_modules JSONB NOT NULL DEFAULT '["risk_quantification", "network_intelligence", "continuous_intelligence", "financial_intelligence", "optimization", "security_testing"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. CORE CYBER DOMAIN
-- ==============================================================================

-- Assets Inventory
CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(64) NOT NULL,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(64) NOT NULL, -- IT Asset, OT Asset, Cloud Infrastructure
    criticality_score NUMERIC(3,1) NOT NULL, -- 1.0 to 10.0
    financial_value NUMERIC(15,2) NOT NULL,
    ip_address VARCHAR(45),
    owner VARCHAR(128),
    exposure_level VARCHAR(32) DEFAULT 'INTERNAL', -- INTERNET_FACING, INTERNAL, ISOLATED
    sla_hours INT DEFAULT 24,
    status VARCHAR(32) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(id, organization_id)
);

-- Asset Technologies
CREATE TABLE IF NOT EXISTS asset_technologies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id VARCHAR(64) NOT NULL,
    organization_id VARCHAR(64) NOT NULL,
    technology_name VARCHAR(128) NOT NULL,
    version VARCHAR(64),
    category VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY(asset_id, organization_id) REFERENCES assets(id, organization_id) ON DELETE CASCADE
);

-- Public & Cataloged Vulnerabilities
CREATE TABLE IF NOT EXISTS vulnerabilities (
    id VARCHAR(64) PRIMARY KEY, -- e.g., CVE-2024-21626
    cve_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    cvss_score NUMERIC(3,1) NOT NULL,
    epss_score NUMERIC(5,4) NOT NULL,
    cisa_kev BOOLEAN DEFAULT FALSE,
    mitre_attack_technique VARCHAR(32) DEFAULT 'T1190',
    mitre_attack_name VARCHAR(128) DEFAULT 'Exploit Public-Facing Application',
    cwe_id VARCHAR(32) DEFAULT 'CWE-787',
    affected_products TEXT DEFAULT 'Linux Container Runtime / runc',
    attack_vector VARCHAR(32) DEFAULT 'NETWORK',
    complexity VARCHAR(32) DEFAULT 'LOW',
    privileges_required VARCHAR(32) DEFAULT 'NONE',
    financial_impact_base NUMERIC(15,2) NOT NULL,
    status VARCHAR(32) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security Controls
CREATE TABLE IF NOT EXISTS security_controls (
    id VARCHAR(64) NOT NULL,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL, -- EDR, Firewall, SIEM, WAF, IAM, Patching, Microsegmentation
    cost NUMERIC(12,2) NOT NULL,
    effectiveness NUMERIC(4,3) NOT NULL, -- 0.0 to 1.0
    implementation_time_days INT DEFAULT 7,
    status VARCHAR(32) DEFAULT 'PROPOSED', -- PROPOSED, APPROVED, EXECUTED, VERIFIED
    requires_control_id VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(id, organization_id)
);

-- Incident History
CREATE TABLE IF NOT EXISTS incident_history (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id VARCHAR(64) NOT NULL,
    incident_name VARCHAR(255) NOT NULL,
    incident_type VARCHAR(64) NOT NULL, -- Ransomware, Data Breach, DDoS, Privilege Escalation
    loss_incurred NUMERIC(15,2) NOT NULL,
    date_occurred VARCHAR(64) NOT NULL,
    status VARCHAR(32) DEFAULT 'RESOLVED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Network Events & Telemetry (Model 6 Empirical Flows)
CREATE TABLE IF NOT EXISTS network_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id VARCHAR(64) NOT NULL,
    flow_id VARCHAR(128),
    duration_s NUMERIC(10,4),
    src_ip VARCHAR(45),
    dst_ip VARCHAR(45),
    flow_bytes_s NUMERIC(14,2),
    flow_packets_s NUMERIC(14,2),
    flag_counts JSONB DEFAULT '{}'::jsonb,
    p6_malicious_probability NUMERIC(5,4) NOT NULL,
    is_anomaly BOOLEAN DEFAULT FALSE,
    dataset_source VARCHAR(64) DEFAULT 'CIC-IDS2017',
    status VARCHAR(32) DEFAULT 'PROCESSED',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Observed Attack Events (Security Lab & Authorized Demo Telemetry)
CREATE TABLE IF NOT EXISTS observed_attack_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id VARCHAR(128) NOT NULL UNIQUE,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id VARCHAR(64) NOT NULL,
    scenario VARCHAR(128) NOT NULL,
    scope VARCHAR(64) DEFAULT 'local_demo',
    status VARCHAR(32) NOT NULL DEFAULT 'ATTACK_STARTED', -- ATTACK_STARTED, DETECTED, REMEDIATED, COMPLETED, RESET
    telemetry_payload JSONB DEFAULT '{}'::jsonb,
    fabric_tx_id VARCHAR(128),
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    remediated_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- ==============================================================================
-- 3. RISK CALCULATIONS, EAL & OPTIMIZATION
-- ==============================================================================

-- Risk Assessments (P1-P6 & Meta/Fusion outputs)
CREATE TABLE IF NOT EXISTS risk_assessments (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id VARCHAR(64) NOT NULL,
    vulnerability_id VARCHAR(64) NOT NULL REFERENCES vulnerabilities(id),
    p1_nvd NUMERIC(5,4) NOT NULL,
    p2_epss NUMERIC(5,4) NOT NULL,
    p3_kev NUMERIC(5,4) NOT NULL,
    p4_mitre NUMERIC(5,4) NOT NULL,
    meta_prob NUMERIC(5,4) NOT NULL,
    p6_network NUMERIC(5,4) DEFAULT 0.0000,
    fused_probability NUMERIC(5,4) DEFAULT 0.0000,
    org_adapted_prob NUMERIC(5,4) NOT NULL,
    eal_pre NUMERIC(15,2) NOT NULL,
    eal_post NUMERIC(15,2) NOT NULL,
    risk_reduction NUMERIC(15,2) NOT NULL,
    status VARCHAR(32) DEFAULT 'ACTIVE',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Optimization Runs (0-1 Knapsack / ILP Solver)
CREATE TABLE IF NOT EXISTS optimization_runs (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    budget NUMERIC(14,2) NOT NULL,
    selected_control_ids JSONB NOT NULL,
    pre_eal NUMERIC(15,2) NOT NULL,
    post_eal NUMERIC(15,2) NOT NULL,
    risk_reduction NUMERIC(15,2) NOT NULL,
    rosi NUMERIC(8,2) NOT NULL,
    solver_status VARCHAR(64) DEFAULT 'Optimal',
    execution_time_ms NUMERIC(8,2) DEFAULT 12.5,
    status VARCHAR(32) DEFAULT 'COMPLETED',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Recommendations & Approvals
CREATE TABLE IF NOT EXISTS recommendations (
    id VARCHAR(64) NOT NULL,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    asset_id VARCHAR(64) NOT NULL,
    vulnerability_id VARCHAR(64) NOT NULL REFERENCES vulnerabilities(id),
    control_id VARCHAR(64) NOT NULL,
    priority VARCHAR(32) DEFAULT 'HIGH', -- CRITICAL, HIGH, MEDIUM, LOW
    expected_risk_reduction NUMERIC(15,2) NOT NULL,
    cost NUMERIC(12,2) NOT NULL,
    rosi NUMERIC(8,2) NOT NULL,
    status VARCHAR(32) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, EXECUTED, VERIFIED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(id, organization_id)
);

CREATE TABLE IF NOT EXISTS approval_records (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    recommendation_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(128) NOT NULL,
    user_role VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL, -- APPROVED, REJECTED
    comments TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. MODEL GOVERNANCE & DATASETS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_format VARCHAR(16) NOT NULL, -- CSV, JSON, PARQUET
    file_size_bytes BIGINT NOT NULL,
    row_count INT NOT NULL,
    column_count INT NOT NULL,
    date_range VARCHAR(64),
    source VARCHAR(128) NOT NULL,
    schema_status VARCHAR(32) DEFAULT 'VALIDATED',
    quality_status VARCHAR(32) DEFAULT 'HIGH_QUALITY',
    validation_status VARCHAR(32) DEFAULT 'READY_FOR_USE',
    feature_mapping JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_governance_records (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    model_id VARCHAR(128) NOT NULL,
    version VARCHAR(64) NOT NULL,
    status VARCHAR(32) DEFAULT 'CHAMPION', -- CHAMPION, CANDIDATE, REJECTED, SUPERSEDED
    parent_version VARCHAR(64),
    training_sample_count INT DEFAULT 0,
    dataset_hash VARCHAR(128) NOT NULL,
    artifact_path VARCHAR(255) NOT NULL,
    artifact_hash VARCHAR(128) NOT NULL,
    feature_schema_version VARCHAR(32) DEFAULT '1.0.0',
    metrics_json TEXT NOT NULL,
    drift_json TEXT,
    governance_decision VARCHAR(32) DEFAULT 'APPROVED',
    decision_reason TEXT,
    fabric_tx_id VARCHAR(128),
    fabric_status VARCHAR(32) DEFAULT 'COMMITTED',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, version)
);

CREATE TABLE IF NOT EXISTS continual_learning_evidence (
    id SERIAL PRIMARY KEY,
    evidence_id VARCHAR(128) NOT NULL UNIQUE,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id VARCHAR(64) NOT NULL,
    threat_id VARCHAR(64),
    p1_nvd NUMERIC(5,4) DEFAULT 0.0,
    p2_epss NUMERIC(5,4) DEFAULT 0.0,
    p3_org NUMERIC(5,4) DEFAULT 0.0,
    p4_mitre NUMERIC(5,4) DEFAULT 0.0,
    p5_meta NUMERIC(5,4) DEFAULT 0.0,
    p6_network NUMERIC(5,4) DEFAULT 0.0,
    fused_probability NUMERIC(5,4) DEFAULT 0.0,
    org_risk_score NUMERIC(5,2) DEFAULT 0.0,
    expected_annual_loss NUMERIC(15,2) DEFAULT 0.0,
    confirmation_status VARCHAR(64) DEFAULT 'PENDING_CONFIRMATION',
    target_label INT,
    observed_loss_inr NUMERIC(15,2),
    confirmed_by VARCHAR(128),
    confirmed_at TIMESTAMPTZ,
    evidence_hash VARCHAR(128) NOT NULL UNIQUE,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. CONTINUOUS INTELLIGENCE & NEWSLETTER / EMAIL PIPELINE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS email_connections (
    id SERIAL PRIMARY KEY,
    connection_id VARCHAR(128) NOT NULL UNIQUE,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider VARCHAR(64) NOT NULL, -- GMAIL, OUTLOOK, IMAP, DEDICATED, OFFLINE
    email_address VARCHAR(255) NOT NULL,
    folder_label VARCHAR(128) DEFAULT 'CyberOptRQ-Intelligence',
    status VARCHAR(32) DEFAULT 'CONNECTED',
    last_sync TIMESTAMPTZ,
    processed_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_messages (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(128) NOT NULL UNIQUE,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source_id VARCHAR(64) NOT NULL,
    sender VARCHAR(255) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(512) NOT NULL,
    date_str VARCHAR(64),
    content_hash VARCHAR(128) NOT NULL UNIQUE,
    raw_path VARCHAR(255),
    body_text TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'RECEIVED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intelligence_events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(128) NOT NULL UNIQUE,
    correlation_id VARCHAR(128) NOT NULL,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    message_id VARCHAR(128),
    category VARCHAR(32) NOT NULL, -- CYBERSECURITY, FINANCIAL
    source_name VARCHAR(128) NOT NULL,
    cve VARCHAR(64),
    affected_product VARCHAR(255),
    version VARCHAR(64),
    attack_technique VARCHAR(64),
    threat_actor VARCHAR(128),
    exploitation_observed BOOLEAN DEFAULT FALSE,
    reported_outcome VARCHAR(64) DEFAULT 'UNKNOWN',
    confidence NUMERIC(4,3) DEFAULT 0.85,
    financial_impact_est NUMERIC(15,2),
    raw_extraction_json TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'EXTRACTED', -- EXTRACTED, MATCHED, IN_REVIEW, VALIDATED, REJECTED
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_intelligence_matches (
    id SERIAL PRIMARY KEY,
    match_id VARCHAR(128) NOT NULL UNIQUE,
    event_id VARCHAR(128) NOT NULL,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    matched_asset_id VARCHAR(64),
    matched_asset_name VARCHAR(255),
    matched_vulnerability_id VARCHAR(64),
    previous_prediction_id INT,
    previous_predicted_risk NUMERIC(5,4),
    previous_eal NUMERIC(15,2),
    relevance_level VARCHAR(32) DEFAULT 'HIGH',
    relevance_reasons_json TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS human_reviews (
    id SERIAL PRIMARY KEY,
    review_id VARCHAR(128) NOT NULL UNIQUE,
    event_id VARCHAR(128) NOT NULL,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    reviewer_id VARCHAR(128) NOT NULL,
    reviewer_role VARCHAR(64) NOT NULL, -- CISO, CFO, SECURITY_ANALYST
    decision VARCHAR(32) NOT NULL, -- CONFIRM, CORRECT, REJECT, NEED_INVESTIGATION
    original_extraction_json TEXT NOT NULL,
    corrected_extraction_json TEXT,
    reason TEXT,
    correlation_id VARCHAR(128) NOT NULL,
    reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS observed_outcomes (
    id SERIAL PRIMARY KEY,
    outcome_id VARCHAR(128) NOT NULL UNIQUE,
    event_id VARCHAR(128) NOT NULL,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    correlation_id VARCHAR(128) NOT NULL,
    outcome_state VARCHAR(64) NOT NULL, -- OUTCOME_PENDING, EXPLOITED_SUCCESSFULLY, EXPLOIT_ATTEMPTED_FAILED, NO_EXPLOITATION_OBSERVED
    observed_loss_inr NUMERIC(15,2),
    observation_notes TEXT,
    observed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_intelligence_events (
    id SERIAL PRIMARY KEY,
    financial_id VARCHAR(128) NOT NULL UNIQUE,
    event_id VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(128) NOT NULL,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    company VARCHAR(128) NOT NULL,
    ticker VARCHAR(32),
    sector VARCHAR(128),
    market_event VARCHAR(255),
    newsletter_claim TEXT NOT NULL,
    newsletter_forecast TEXT NOT NULL,
    cyberoptrq_forecast TEXT,
    risk_signal VARCHAR(32) DEFAULT 'MODERATE',
    volatility_signal VARCHAR(32) DEFAULT 'LOW',
    relevant_exposure_inr NUMERIC(15,2) DEFAULT 0.0,
    confidence NUMERIC(4,3) DEFAULT 0.85,
    actual_observed_outcome TEXT,
    forecast_accuracy NUMERIC(5,2),
    cfo_review_status VARCHAR(32) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. SECURITY TESTING & STRIX INTEGRATION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS security_test_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id VARCHAR(128) NOT NULL UNIQUE,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    test_type VARCHAR(64) NOT NULL, -- STRIX_AUTONOMOUS, CONTROLLED_DEMO, VULNERABILITY_VALIDATION
    target_scope JSONB NOT NULL, -- Authorized URLs, asset IDs, IP ranges
    scope_authorization_token VARCHAR(255) NOT NULL,
    authorized_by VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, RUNNING, VALIDATING, COMPLETED, FAILED
    findings_count INT DEFAULT 0,
    raw_findings_json JSONB DEFAULT '[]'::jsonb,
    summary_report TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS security_test_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES security_test_runs(id) ON DELETE CASCADE,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id VARCHAR(64) NOT NULL,
    vulnerability_title VARCHAR(255) NOT NULL,
    cve VARCHAR(64),
    severity VARCHAR(32) NOT NULL, -- CRITICAL, HIGH, MEDIUM, LOW
    exploit_technique VARCHAR(64),
    proof_of_concept_summary TEXT,
    is_validated BOOLEAN DEFAULT TRUE,
    matched_pipeline_risk NUMERIC(5,4),
    impact_eal_surge NUMERIC(15,2),
    status VARCHAR(32) DEFAULT 'CONFIRMED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. AUDIT & CONSORTIUM BLOCKCHAIN PROVENANCE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS audit_blocks (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    block_index INT NOT NULL,
    timestamp VARCHAR(64) NOT NULL,
    action VARCHAR(128) NOT NULL,
    user_id VARCHAR(128) NOT NULL,
    details_json TEXT NOT NULL,
    previous_hash VARCHAR(128) NOT NULL,
    block_hash VARCHAR(128) NOT NULL
);

CREATE TABLE IF NOT EXISTS fabric_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_id VARCHAR(128) NOT NULL UNIQUE,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    channel_name VARCHAR(64) DEFAULT 'cyber-risk-channel',
    chaincode_name VARCHAR(64) DEFAULT 'cyber_risk_audit',
    action_type VARCHAR(64) NOT NULL,
    payload_hash VARCHAR(128) NOT NULL,
    status VARCHAR(32) DEFAULT 'COMMITTED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on Tenant-Specific Tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE observed_attack_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_governance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE continual_learning_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_intelligence_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE observed_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_intelligence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_test_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabric_transactions ENABLE ROW LEVEL SECURITY;

-- Helper function: Get Current User's Active Organization ID
CREATE OR REPLACE FUNCTION get_current_org_id()
RETURNS VARCHAR AS $$
BEGIN
    RETURN current_setting('request.jwt.claims', true)::json->>'org_id';
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Tenant Isolation Policies:
-- Service role bypasses RLS; authenticated users strictly access their own organization.
CREATE POLICY tenant_isolation_organizations ON organizations
    FOR ALL USING (id = get_current_org_id() OR current_setting('role', true) = 'service_role');

CREATE POLICY tenant_isolation_assets ON assets
    FOR ALL USING (organization_id = get_current_org_id() OR current_setting('role', true) = 'service_role');

CREATE POLICY tenant_isolation_controls ON security_controls
    FOR ALL USING (organization_id = get_current_org_id() OR current_setting('role', true) = 'service_role');

CREATE POLICY tenant_isolation_incidents ON incident_history
    FOR ALL USING (organization_id = get_current_org_id() OR current_setting('role', true) = 'service_role');

CREATE POLICY tenant_isolation_network_events ON network_events
    FOR ALL USING (organization_id = get_current_org_id() OR current_setting('role', true) = 'service_role');

CREATE POLICY tenant_isolation_attack_events ON observed_attack_events
    FOR ALL USING (organization_id = get_current_org_id() OR current_setting('role', true) = 'service_role');

CREATE POLICY tenant_isolation_risk ON risk_assessments
    FOR ALL USING (organization_id = get_current_org_id() OR current_setting('role', true) = 'service_role');

CREATE POLICY tenant_isolation_optimization ON optimization_runs
    FOR ALL USING (organization_id = get_current_org_id() OR current_setting('role', true) = 'service_role');

CREATE POLICY tenant_isolation_recommendations ON recommendations
    FOR ALL USING (organization_id = get_current_org_id() OR current_setting('role', true) = 'service_role');

CREATE POLICY tenant_isolation_datasets ON datasets
    FOR ALL USING (organization_id = get_current_org_id() OR current_setting('role', true) = 'service_role');

CREATE POLICY tenant_isolation_governance ON model_governance_records
    FOR ALL USING (organization_id = get_current_org_id() OR current_setting('role', true) = 'service_role');

CREATE POLICY tenant_isolation_intel_events ON intelligence_events
    FOR ALL USING (organization_id = get_current_org_id() OR current_setting('role', true) = 'service_role');

CREATE POLICY tenant_isolation_financial_intel ON financial_intelligence_events
    FOR ALL USING (organization_id = get_current_org_id() OR current_setting('role', true) = 'service_role');

CREATE POLICY tenant_isolation_security_runs ON security_test_runs
    FOR ALL USING (organization_id = get_current_org_id() OR current_setting('role', true) = 'service_role');

CREATE POLICY tenant_isolation_audit_blocks ON audit_blocks
    FOR ALL USING (organization_id = get_current_org_id() OR current_setting('role', true) = 'service_role');
