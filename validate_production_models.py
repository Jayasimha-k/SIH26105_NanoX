"""
validate_production_models.py
================================================================================
SIH 2026 Problem Statement 26105:
PRODUCTION XGBOOST MODELS VALIDATION & INFERENCE SUITE
================================================================================
"""

import os
import sys
import joblib
import pandas as pd
import numpy as np

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "CyberOptRQ_Production_Models"))


def validate_all_production_models():
    print("=" * 80)
    print("  CyberOpt-RQ Production XGBoost Model Suite Validation")
    print("=" * 80)
    print(f"Location: {PROD_DIR}\n")

    if not os.path.exists(PROD_DIR):
        print(f"ERROR: Production models directory missing at {PROD_DIR}!")
        sys.exit(1)

    model_paths = {
        "P1 (Model 1)": os.path.join(PROD_DIR, "Model_1", "CyberOptRQ_Model1_FINAL_XGBoost.pkl"),
        "P2 (Model 2)": os.path.join(PROD_DIR, "Model_2", "CyberOptRQ_Model2_XGBoost.pkl"),
        "P3 (Model 3)": os.path.join(PROD_DIR, "Model_3", "CyberOptRQ_Model3_XGBoost.pkl"),
        "P4 (Model 4)": os.path.join(PROD_DIR, "Model_4", "CyberOptRQ_Model4_XGBoost.pkl"),
        "Meta Model (Model 5)": os.path.join(PROD_DIR, "Model_5", "CyberOptRQ_Meta_XGBoost_FINAL_4INPUT.pkl")
    }

    loaded_models = {}
    for name, path in model_paths.items():
        if not os.path.exists(path):
            print(f"[FAIL] Missing model file for {name}: {path}")
            sys.exit(1)
        try:
            model = joblib.load(path)
            loaded_models[name] = model
            n_features = getattr(model, "n_features_in_", "Unknown")
            print(f"[LOAD OK] {name:<20} | Type: {type(model).__name__:<15} | Features: {n_features}")
        except Exception as e:
            print(f"[FAIL] Error loading {name}: {str(e)}")
            sys.exit(1)

    print("\nExecuting End-to-End Inference Verification Across All 5 Production Models...")

    # --- P1 Inference ---
    m1 = loaded_models["P1 (Model 1)"]
    df1 = pd.DataFrame([{
        'cvss_base_score': 9.8, 'cvss_exploitability_score': 3.9, 'cvss_impact_score': 5.9,
        'vendor_count': 1, 'product_count': 1, 'reference_count': 5, 'cve_tag_count': 2, 'publication_year': 2023,
        'cwe_count': 1, 'cwe_noinfo': 0, 'cwe_other': 0, 'cwe_multiple': 0, 'cwe_missing': 0,
        'vendor_missing': 0, 'product_missing': 0, 'cvss_missing': 0,
        'cvss_attack_vector': 'NETWORK', 'cvss_attack_complexity': 'LOW', 'cvss_privileges_required': 'NONE',
        'cvss_user_interaction': 'NONE', 'cvss_scope': 'UNCHANGED',
        'confidentiality_impact': 'HIGH', 'integrity_impact': 'HIGH', 'availability_impact': 'HIGH',
        'cvss_severity': 'CRITICAL', 'cwe_primary': 'CWE-787'
    }])
    for col in df1.select_dtypes(include=['object', 'string']).columns:
        df1[col] = df1[col].astype('category')
    p1 = float(m1.predict_proba(df1)[0, 1])

    # --- P2 Inference ---
    m2 = loaded_models["P2 (Model 2)"]
    df2 = pd.DataFrame([{
        'cvss_base_score': 9.8, 'cvss_exploitability_score': 3.9, 'cvss_impact_score': 5.9,
        'vendor_count': 1, 'product_count': 1, 'reference_count': 5, 'cve_tag_count': 2,
        'cvss_attack_vector_encoded': 3.0, 'cvss_attack_complexity_encoded': 1.0,
        'cvss_privileges_required_encoded': 0.0, 'cvss_user_interaction_encoded': 0.0,
        'cvss_scope_encoded': 0.0, 'confidentiality_impact_encoded': 3.0,
        'integrity_impact_encoded': 3.0, 'availability_impact_encoded': 3.0
    }])
    p2 = float(m2.predict_proba(df2)[0, 1])

    # --- P3 Inference ---
    m3 = loaded_models["P3 (Model 3)"]
    df3 = pd.DataFrame([{
        'xgb1_oof_probability': p1, 'epss': 0.95, 'asset_criticality': 9, 'internet_exposed': 1,
        'asset_count_affected': 15, 'patch_status': 0, 'control_strength': 2,
        'edr_coverage': 0.3, 'mfa_coverage': 0.5, 'privilege_exposure': 1,
        'historical_incidents': 2, 'business_impact': 9
    }])
    p3 = float(m3.predict_proba(df3)[0, 1])

    # --- P4 Inference ---
    m4 = loaded_models["P4 (Model 4)"]
    m4_cols = list(m4.feature_names_in_)
    df4_dict = {col: 0 for col in m4_cols}
    df4_dict.update({
        'cvss_base_score': 9.8, 'cvss_exploitability_score': 3.9, 'cvss_impact_score': 5.9,
        'vendor_count': 1, 'product_count': 1, 'reference_count': 5, 'cve_tag_count': 2,
        'publication_year': 2023, 'cvss_attack_vector_NETWORK': 1, 'cvss_attack_complexity_LOW': 1,
        'cvss_privileges_required_NONE': 1, 'cvss_user_interaction_NONE': 1, 'cvss_scope_UNCHANGED': 1,
        'confidentiality_impact_HIGH': 1, 'integrity_impact_HIGH': 1, 'availability_impact_HIGH': 1,
        'cvss_severity_CRITICAL': 1
    })
    df4 = pd.DataFrame([df4_dict])
    p4 = float(m4.predict_proba(df4)[0, 1])

    # --- Meta Model Inference ---
    m5 = loaded_models["Meta Model (Model 5)"]
    df5 = pd.DataFrame([{'P1': p1, 'P2': p2, 'P3': p3, 'P4': p4}])
    p5_meta = float(m5.predict_proba(df5)[0, 1])

    print("-" * 80)
    print(f"  P1 (Model 1 - NVD/CVE) Probability       : {p1:.6f}")
    print(f"  P2 (Model 2 - EPSS Threat) Probability   : {p2:.6f}")
    print(f"  P3 (Model 3 - Org Posture) Probability   : {p3:.6f}")
    print(f"  P4 (Model 4 - ATT&CK Vector) Probability : {p4:.6f}")
    print(f"  P5 (Model 5 - Meta Ensemble) Probability : {p5_meta:.6f}")
    print("-" * 80)
    print("[SUCCESS] All 5 production XGBoost models loaded and verified successfully!\n")


if __name__ == "__main__":
    validate_all_production_models()
