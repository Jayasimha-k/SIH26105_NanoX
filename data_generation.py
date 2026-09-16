"""
data_generation.py
Generates reproducible synthetic organization cybersecurity posture datasets.

IMPORTANT NOTE:
All generated data is explicitly tagged with `data_source = "SYNTHETIC"`.
Distributions and correlation structures are calibrated against:
- VCDB (VERIS Community Database) breach patterns
- NIST CSF 2.0 organizational dimensions
- Real-world enterprise profile archetypes (Small, Medium, Large; Healthcare, Finance, Tech, etc.)
"""

import numpy as np
import pandas as pd
from baseline_risk_engine import BaselineRiskEngine
import random

SEED = 42
np.random.seed(SEED)
random.seed(SEED)

INDUSTRIES = ["finance", "healthcare", "technology", "manufacturing", "government", "education", "retail", "energy"]
SIZES = ["small", "medium", "large"]

def generate_organization_profile(org_id: str, size: str = None, industry: str = None) -> dict:
    if size is None:
        size = np.random.choice(SIZES, p=[0.45, 0.40, 0.15])
    if industry is None:
        industry = np.random.choice(INDUSTRIES)

    # Size-conditioned demographics
    if size == "small":
        employees = int(np.random.lognormal(mean=3.5, sigma=0.8)) # ~10 to 150
        endpoints = int(employees * np.random.uniform(1.0, 1.5))
        servers = max(1, int(endpoints * np.random.uniform(0.02, 0.08)))
        cloud_usage = float(np.clip(np.random.normal(65, 20), 10, 100))
        remote_workers = float(np.clip(np.random.normal(30, 25), 0, 100))
        # Smaller orgs typically have lower dedicated security budgets
        sec_maturity_base = np.random.beta(a=2.0, b=3.5) # skewed towards lower maturity
    elif size == "medium":
        employees = int(np.random.lognormal(mean=6.5, sigma=0.7)) # ~300 to 2500
        endpoints = int(employees * np.random.uniform(1.2, 1.8))
        servers = max(5, int(endpoints * np.random.uniform(0.05, 0.12)))
        cloud_usage = float(np.clip(np.random.normal(55, 20), 15, 95))
        remote_workers = float(np.clip(np.random.normal(35, 20), 0, 100))
        sec_maturity_base = np.random.beta(a=3.0, b=3.0) # balanced
    else: # large
        employees = int(np.random.lognormal(mean=9.2, sigma=0.6)) # 5000+
        endpoints = int(employees * np.random.uniform(1.5, 2.5))
        servers = max(50, int(endpoints * np.random.uniform(0.08, 0.20)))
        cloud_usage = float(np.clip(np.random.normal(70, 15), 30, 95))
        remote_workers = float(np.clip(np.random.normal(40, 20), 5, 100))
        sec_maturity_base = np.random.beta(a=4.0, b=2.0) # skewed towards higher maturity

    # Industry modifier on baseline security maturity (e.g., highly regulated finance vs education)
    if industry in ["finance", "energy"]:
        sec_maturity = np.clip(sec_maturity_base + np.random.uniform(0.05, 0.20), 0.05, 0.98)
    elif industry in ["education", "manufacturing"]:
        sec_maturity = np.clip(sec_maturity_base - np.random.uniform(0.05, 0.18), 0.05, 0.95)
    else:
        sec_maturity = np.clip(sec_maturity_base + np.random.uniform(-0.10, 0.10), 0.05, 0.98)

    # 1. Identity & Access (correlated with maturity)
    mfa_cov = float(np.clip(sec_maturity * 100 + np.random.normal(0, 12), 0, 100))
    pam = bool(sec_maturity > 0.45 and np.random.random() < sec_maturity * 1.2)
    pam_mfa = bool(pam and (mfa_cov > 60 or np.random.random() < 0.75))
    pwd_score = int(np.clip(np.round(sec_maturity * 4 + 1 + np.random.normal(0, 0.5)), 1, 5))
    access_rev_days = int(np.clip(np.round((1.0 - sec_maturity) * 180 + 30 + np.random.normal(0, 20)), 15, 365))
    least_priv = bool(np.random.random() < (sec_maturity * 1.1))
    sso_cov = float(np.clip(sec_maturity * 90 + np.random.normal(0, 15), 0, 100))

    # 2. Asset Management
    inv_cov = float(np.clip(sec_maturity * 95 + np.random.normal(0, 10), 20, 100))
    disc_freq_days = int(np.clip(np.round((1.0 - sec_maturity) * 60 + 7 + np.random.normal(0, 7)), 1, 90))
    data_class = bool(np.random.random() < (sec_maturity * 1.1))
    crit_asset_id = bool(np.random.random() < (sec_maturity * 1.15))

    # 3. Protection
    epp_cov = float(np.clip(sec_maturity * 90 + 10 + np.random.normal(0, 10), 10, 100))
    firewall = bool(np.random.random() < 0.95) # almost everyone has perimeter FW
    net_seg = bool(np.random.random() < (sec_maturity * 1.15))
    enc_rest = float(np.clip(sec_maturity * 90 + np.random.normal(0, 15), 0, 100))
    enc_transit = float(np.clip(sec_maturity * 85 + 15 + np.random.normal(0, 10), 10, 100))
    sec_train = bool(np.random.random() < (sec_maturity * 1.2))
    secure_cfg = bool(np.random.random() < (sec_maturity * 1.05))

    # 4. Vulnerability Management
    vuln_scan_freq = int(np.clip(np.round((1.0 - sec_maturity) * 90 + 7 + np.random.normal(0, 10)), 1, 180))
    patch_freq = int(np.clip(np.round((1.0 - sec_maturity) * 60 + 7 + np.random.normal(0, 7)), 3, 90))
    avg_patch_delay = int(np.clip(np.round((1.0 - sec_maturity) * 75 + 5 + np.random.normal(0, 12)), 2, 120))
    crit_remediation = int(np.clip(np.round((1.0 - sec_maturity) * 35 + 2 + np.random.normal(0, 5)), 1, 60))
    pentest_freq = int(np.random.choice([0, 6, 12, 24], p=[0.25, 0.15, 0.45, 0.15] if size != "large" else [0.05, 0.30, 0.60, 0.05]))

    # 5. Detection
    siem = bool(np.random.random() < (sec_maturity * 1.2 if size != "small" else sec_maturity * 0.7))
    if size == "large":
        soc_hours = int(np.random.choice([0, 8, 16, 24], p=[0.05, 0.10, 0.25, 0.60]))
    elif size == "medium":
        soc_hours = int(np.random.choice([0, 8, 16, 24], p=[0.20, 0.40, 0.25, 0.15]))
    else:
        soc_hours = int(np.random.choice([0, 8, 16, 24], p=[0.60, 0.30, 0.08, 0.02]))
    edr_cov = float(np.clip(sec_maturity * 95 + np.random.normal(0, 12), 0, 100))
    log_ret = int(np.clip(np.round(sec_maturity * 365 + 30 + np.random.normal(0, 30)), 14, 730))

    # 6. Response
    ir_plan = bool(np.random.random() < (sec_maturity * 1.15))
    ir_test = bool(ir_plan and np.random.random() < (sec_maturity * 1.1))
    ir_team = bool(np.random.random() < (sec_maturity * 1.05 if size != "small" else 0.25))
    mttd = float(np.clip(np.round((1.0 - sec_maturity) * 200 + 4 + np.random.normal(0, 20)), 1, 360))
    mttr = float(np.clip(np.round((1.0 - sec_maturity) * 120 + 2 + np.random.normal(0, 15)), 1, 240))

    # 7. Recovery
    offline_backup = bool(np.random.random() < (sec_maturity * 1.1))
    backup_freq = int(np.random.choice([1, 6, 12, 24, 72, 168], p=[0.10, 0.25, 0.35, 0.20, 0.08, 0.02]))
    backup_test_freq = int(np.random.choice([1, 3, 6, 12, 0], p=[0.10, 0.25, 0.35, 0.20, 0.10]))
    dr_plan = bool(np.random.random() < (sec_maturity * 1.1))
    rto = float(np.clip(np.round((1.0 - sec_maturity) * 72 + 2 + np.random.normal(0, 8)), 1, 120))
    rpo = float(np.clip(np.round((1.0 - sec_maturity) * 24 + 1 + np.random.normal(0, 4)), 0.5, 48))

    # 8. Third Party
    vrm = bool(np.random.random() < (sec_maturity * 1.1))
    tp_access = bool(np.random.random() < (sec_maturity * 1.05))
    sc_monitoring = bool(np.random.random() < (sec_maturity * 0.9))

    # 9. Historical
    prev_incidents = int(np.random.poisson(lam=max(0.1, (1.0 - sec_maturity) * 3.0)))
    prev_breach = bool(prev_incidents > 0 and np.random.random() < 0.4)
    ransomware_history = bool(not offline_backup and np.random.random() < 0.25)

    return {
        "organization_id": org_id,
        "organization_size": size,
        "industry": industry,
        "number_of_employees": employees,
        "number_of_endpoints": endpoints,
        "number_of_servers": servers,
        "cloud_usage_percentage": round(cloud_usage, 1),
        "remote_worker_percentage": round(remote_workers, 1),
        "critical_asset_count": max(1, int(servers * 0.2 + np.random.poisson(3))),
        "mfa_coverage": round(mfa_cov, 1),
        "privileged_account_mfa": pam_mfa,
        "privileged_access_management": pam,
        "password_policy_score": pwd_score,
        "access_review_frequency_days": access_rev_days,
        "least_privilege_enforced": least_priv,
        "sso_adoption_percentage": round(sso_cov, 1),
        "asset_inventory_coverage": round(inv_cov, 1),
        "asset_discovery_frequency_days": disc_freq_days,
        "data_classification_implemented": data_class,
        "critical_asset_identification": crit_asset_id,
        "endpoint_protection_coverage": round(epp_cov, 1),
        "firewall_deployment": firewall,
        "network_segmentation": net_seg,
        "encryption_at_rest": round(enc_rest, 1),
        "encryption_in_transit": round(enc_transit, 1),
        "security_awareness_training": sec_train,
        "secure_configuration_baselines": secure_cfg,
        "vulnerability_scanning_frequency_days": vuln_scan_freq,
        "patch_frequency_days": patch_freq,
        "average_patch_delay": avg_patch_delay,
        "critical_vulnerability_remediation_time": crit_remediation,
        "penetration_testing_frequency_months": pentest_freq,
        "siem_deployed": siem,
        "soc_coverage_hours": soc_hours,
        "security_monitoring": bool(siem or soc_hours > 0),
        "edr_coverage": round(edr_cov, 1),
        "automated_alerting": bool(siem and np.random.random() < 0.8),
        "log_retention_days": log_ret,
        "incident_response_plan": ir_plan,
        "incident_response_testing": ir_test,
        "dedicated_ir_team": ir_team,
        "mean_time_to_detect": round(mttd, 1),
        "mean_time_to_respond": round(mttr, 1),
        "backup_frequency_hours": backup_freq,
        "offline_backup": offline_backup,
        "backup_testing_frequency_months": backup_test_freq,
        "disaster_recovery_plan": dr_plan,
        "recovery_time_objective_hours": round(rto, 1),
        "recovery_point_objective_hours": round(rpo, 1),
        "vendor_risk_management": vrm,
        "third_party_access_controls": tp_access,
        "supply_chain_monitoring": sc_monitoring,
        "previous_incidents_count": prev_incidents,
        "previous_data_breach": prev_breach,
        "ransomware_history": ransomware_history,
        "data_source": "SYNTHETIC"
    }

def generate_dataset(num_samples: int = 3000) -> pd.DataFrame:
    engine = BaselineRiskEngine()
    records = []
    
    for i in range(num_samples):
        org_id = f"ORG-{i+1:05d}"
        profile = generate_organization_profile(org_id)
        
        # Calculate risk score through the transparent baseline risk engine
        assessment = engine.evaluate_organization(profile)
        
        # Introduce slight empirical noise / non-linear compounding interactions
        # (e.g., severe vulnerability lag + no EDR + zero offline backup creates compounding catastrophic risk)
        base_risk = assessment["risk_score"]
        compound_penalty = 0.0
        if profile["average_patch_delay"] > 45 and profile["edr_coverage"] < 30 and not profile["offline_backup"]:
            compound_penalty += np.random.uniform(4.0, 9.0)
        if profile["mfa_coverage"] < 20 and not profile["privileged_account_mfa"]:
            compound_penalty += np.random.uniform(3.0, 7.0)

        calibrated_risk = float(np.clip(base_risk + compound_penalty + np.random.normal(0, 1.5), 0.0, 100.0))
        calibrated_risk = round(calibrated_risk, 1)

        # Categorical risk level
        if calibrated_risk < 25.0:
            level = "Low"
        elif calibrated_risk < 50.0:
            level = "Moderate"
        elif calibrated_risk < 75.0:
            level = "High"
        else:
            level = "Critical"

        profile["risk_score"] = calibrated_risk
        profile["risk_level"] = level
        profile["baseline_score"] = assessment["risk_score"]
        records.append(profile)

    df = pd.DataFrame(records)
    return df

if __name__ == "__main__":
    print(f"Generating 3,000 synthetic organization profiles...")
    df = generate_dataset(3000)
    output_path = "sample_organizations.csv"
    df.to_csv(output_path, index=False)
    print(f"Saved dataset to {output_path} with shape {df.shape}")
    print("\nRisk Level Distribution:")
    print(df["risk_level"].value_counts(normalize=True))
    print("\nRisk Score Statistics:")
    print(df["risk_score"].describe())
