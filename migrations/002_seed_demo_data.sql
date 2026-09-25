-- ==============================================================================
-- 002_seed_demo_data.sql: Enterprise Plans, Default Organization & Demo Entities
-- ==============================================================================

-- 1. Subscription Plans
INSERT INTO subscription_plans (id, name, description, tier, features, price_annual, status)
VALUES
('CORE', 'CyberOptRQ Core', 'Essential automated cyber-risk quantification & FAIR model EAL assessment', 'CORE',
 '["risk_quantification", "explainable_risk_drivers", "basic_controls", "audit_ledger"]'::jsonb, 490000.00, 'ACTIVE'),
('ENTERPRISE', 'CyberOptRQ Enterprise SaaS', 'Complete multi-tenant cyber risk platform with continuous intelligence, Model 6 network behavioral analysis & Knapsack optimization', 'ENTERPRISE',
 '["risk_quantification", "network_intelligence", "continuous_intelligence", "financial_intelligence", "optimization", "security_testing", "model_governance", "fabric_audit"]'::jsonb, 1850000.00, 'ACTIVE'),
('AIR_GAPPED', 'CyberOptRQ Sovereign Air-Gapped', 'Self-contained sovereign on-premises deployment with local offline .eml parsing, zero external telemetry egress, and dedicated consortium ledger', 'AIR_GAPPED',
 '["risk_quantification", "network_intelligence", "continuous_intelligence", "financial_intelligence", "optimization", "security_testing", "model_governance", "fabric_audit", "air_gapped_offline"]'::jsonb, 4500000.00, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 2. Demo Organization (ABC Technologies)
INSERT INTO organizations (
    id, name, slug, domain, industry, business_size, country_region,
    technology_stack, cloud_providers, critical_services, mfa_coverage_pct, edr_coverage_pct,
    historical_incidents_count, financial_exposure, status
) VALUES (
    'org_abc_tech',
    'ABC Technologies Enterprise',
    'abc-technologies',
    'abctech.internal',
    'FinTech & Enterprise Cloud',
    'Enterprise (2500 Employees)',
    'India / South Asia',
    '["Kubernetes", "Linux Container Runtime / runc", "PostgreSQL", "AWS ECS", "Kafka", "Active Directory"]'::jsonb,
    '["AWS", "Azure Hybrid Cloud"]'::jsonb,
    '["Customer Payment Processing API", "High-Volume Ledger DB", "Identity Directory"]'::jsonb,
    98.50,
    95.00,
    2,
    3500000.00,
    'ACTIVE'
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- 3. Default Enterprise Subscription for Demo Org
INSERT INTO subscriptions (organization_id, plan_id, status, enabled_modules)
VALUES (
    'org_abc_tech',
    'ENTERPRISE',
    'ACTIVE',
    '["risk_quantification", "network_intelligence", "continuous_intelligence", "financial_intelligence", "optimization", "security_testing", "model_governance", "fabric_audit"]'::jsonb
) ON CONFLICT DO NOTHING;

-- 4. Initial Core Assets
INSERT INTO assets (id, organization_id, name, asset_type, criticality_score, financial_value, ip_address, owner, exposure_level, sla_hours, status)
VALUES
('ASSET-001', 'org_abc_tech', 'Core Oracle Production DB', 'OT Asset', 9.5, 12000000.00, '10.0.1.50', 'Database Admin', 'INTERNAL', 12, 'ACTIVE'),
('ASSET-002', 'org_abc_tech', 'Production K8s Microservices Cluster', 'Cloud Infrastructure', 9.0, 8500000.00, '10.0.2.100', 'DevOps Team', 'INTERNET_FACING', 6, 'ACTIVE'),
('ASSET-003', 'org_abc_tech', 'Payment API Gateway', 'Cloud Infrastructure', 8.8, 6000000.00, '10.0.3.10', 'FinTech Engineering', 'INTERNET_FACING', 4, 'ACTIVE'),
('ASSET-004', 'org_abc_tech', 'Executive Email & Active Directory', 'IT Asset', 8.2, 4500000.00, '10.0.1.12', 'IT Infrastructure', 'INTERNAL', 24, 'ACTIVE'),
('ASSET-005', 'org_abc_tech', 'Customer Support Web Portal', 'IT Asset', 6.5, 2000000.00, '10.0.4.80', 'Customer Ops', 'INTERNET_FACING', 48, 'ACTIVE')
ON CONFLICT (id, organization_id) DO NOTHING;

-- 5. Standard Vulnerabilities
INSERT INTO vulnerabilities (id, cve_id, title, cvss_score, epss_score, cisa_kev, mitre_attack_technique, mitre_attack_name, cwe_id, affected_products, attack_vector, complexity, privileges_required, financial_impact_base, status)
VALUES
('CVE-2024-21626', 'CVE-2024-21626', 'runc Container Escape RCE', 9.8, 0.8800, TRUE, 'T1190', 'Exploit Public-Facing Application', 'CWE-787', 'Linux Container Runtime / runc', 'NETWORK', 'LOW', 'NONE', 3500000.00, 'ACTIVE'),
('CVE-2024-3094', 'CVE-2024-3094', 'XZ Utils Supply Chain Backdoor', 10.0, 0.9500, TRUE, 'T1068', 'Exploitation for Privilege Escalation', 'CWE-94', 'liblzma / SSH Daemon', 'NETWORK', 'LOW', 'NONE', 5000000.00, 'ACTIVE'),
('CVE-2023-4863', 'CVE-2023-4863', 'libwebp Heap Buffer Overflow', 8.8, 0.7200, TRUE, 'T1190', 'Exploit Public-Facing Application', 'CWE-787', 'libwebp Web Browsers & Electron apps', 'NETWORK', 'LOW', 'NONE', 2800000.00, 'ACTIVE'),
('CVE-2023-46604', 'CVE-2023-46604', 'Apache ActiveMQ RCE Exploitation', 9.8, 0.9200, TRUE, 'T1190', 'Exploit Public-Facing Application', 'CWE-502', 'Apache ActiveMQ Message Broker', 'NETWORK', 'LOW', 'NONE', 4200000.00, 'ACTIVE'),
('CVE-2023-44487', 'CVE-2023-44487', 'HTTP/2 Rapid Reset DDoS Zero-Day', 7.5, 0.6500, TRUE, 'T1498', 'Network Denial of Service', 'CWE-400', 'HTTP/2 protocol implementations', 'NETWORK', 'LOW', 'NONE', 1800000.00, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 6. Initial Security Controls
INSERT INTO security_controls (id, organization_id, code, name, category, cost, effectiveness, implementation_time_days, status, requires_control_id)
VALUES
('CTRL-001', 'org_abc_tech', 'EDR-MDR', 'CrowdStrike Falcon Enterprise EDR & Managed Detection', 'EDR', 250000.00, 0.650, 7, 'PROPOSED', NULL),
('CTRL-002', 'org_abc_tech', 'WAF-PRO', 'Cloudflare Enterprise Layer 7 WAF & DDoS Shield', 'WAF', 150000.00, 0.550, 3, 'PROPOSED', NULL),
('CTRL-003', 'org_abc_tech', 'IAM-MFA', 'Zero-Trust FIDO2 Hardware Token Multi-Factor Auth', 'IAM', 80000.00, 0.400, 5, 'PROPOSED', NULL),
('CTRL-004', 'org_abc_tech', 'PATCH-AUTO', 'Automated Patch Management & Kernel Hotpatching Pipeline', 'Patching', 60000.00, 0.500, 10, 'PROPOSED', NULL),
('CTRL-005', 'org_abc_tech', 'SIEM-SOAR', 'Datadog Cloud SIEM & Automated Incident Response Runbooks', 'SIEM', 200000.00, 0.450, 14, 'PROPOSED', 'CTRL-001'),
('CTRL-006', 'org_abc_tech', 'ZT-MICROSEG', 'Zero-Trust Microsegmentation & Network Isolation', 'Microsegmentation', 120000.00, 0.700, 12, 'PROPOSED', NULL)
ON CONFLICT (id, organization_id) DO NOTHING;
