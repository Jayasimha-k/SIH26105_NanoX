import os
import sys
sys.path.insert(0, os.path.abspath("backend"))

from app.ml.production_loader import ProductionMLInferenceEngine

def test_p5_profiles():
    engine = ProductionMLInferenceEngine()
    engine.load_models()
    
    profiles = {
        "BENIGN": (
            {"cvss_score": 3.1, "epss_score": 0.02, "mitre_attack_technique": "T1059", "attack_vector": "LOCAL"},
            {"criticality_score": 3.0, "exposure_level": "INTERNAL"}
        ),
        "DoS Hulk": (
            {"cvss_score": 7.5, "epss_score": 0.60, "mitre_attack_technique": "T1498", "attack_vector": "NETWORK"},
            {"criticality_score": 7.0, "exposure_level": "INTERNET_FACING"}
        ),
        "PortScan": (
            {"cvss_score": 5.0, "epss_score": 0.20, "mitre_attack_technique": "T1046", "attack_vector": "NETWORK"},
            {"criticality_score": 5.0, "exposure_level": "INTERNET_FACING"}
        ),
        "DDoS": (
            {"cvss_score": 7.5, "epss_score": 0.65, "mitre_attack_technique": "T1498", "attack_vector": "NETWORK"},
            {"criticality_score": 8.0, "exposure_level": "INTERNET_FACING"}
        ),
        "FTP-Patator": (
            {"cvss_score": 7.5, "epss_score": 0.70, "mitre_attack_technique": "T1110", "attack_vector": "NETWORK"},
            {"criticality_score": 6.0, "exposure_level": "INTERNET_FACING"}
        ),
        "SSH-Patator": (
            {"cvss_score": 7.5, "epss_score": 0.72, "mitre_attack_technique": "T1110", "attack_vector": "NETWORK"},
            {"criticality_score": 7.0, "exposure_level": "INTERNET_FACING"}
        ),
        "Web Attack - Brute Force": (
            {"cvss_score": 7.5, "epss_score": 0.65, "mitre_attack_technique": "T1110", "attack_vector": "NETWORK"},
            {"criticality_score": 7.0, "exposure_level": "INTERNET_FACING"}
        ),
        "Web Attack - XSS": (
            {"cvss_score": 6.1, "epss_score": 0.45, "mitre_attack_technique": "T1059", "attack_vector": "NETWORK"},
            {"criticality_score": 7.0, "exposure_level": "INTERNET_FACING"}
        ),
        "Web Attack - Sql Injection": (
            {"cvss_score": 9.8, "epss_score": 0.88, "mitre_attack_technique": "T1190", "attack_vector": "NETWORK"},
            {"criticality_score": 9.0, "exposure_level": "INTERNET_FACING"}
        ),
        "Heartbleed": (
            {"cvss_score": 7.5, "epss_score": 0.94, "mitre_attack_technique": "T1190", "attack_vector": "NETWORK"},
            {"criticality_score": 9.0, "exposure_level": "INTERNET_FACING"}
        ),
        "Bot": (
            {"cvss_score": 8.5, "epss_score": 0.75, "mitre_attack_technique": "T1071", "attack_vector": "NETWORK"},
            {"criticality_score": 7.0, "exposure_level": "INTERNET_FACING"}
        ),
        "Infiltration": (
            {"cvss_score": 8.8, "epss_score": 0.50, "mitre_attack_technique": "T1189", "attack_vector": "LOCAL"},
            {"criticality_score": 8.0, "exposure_level": "INTERNAL"}
        )
    }
    
    print(f"{'Category':28s} | {'P1_NVD':8s} | {'P2_EPSS':8s} | {'P3_Org':8s} | {'P4_ATT&CK':10s} | {'P5_Meta':8s}")
    print("-" * 80)
    for cat, (v, a) in profiles.items():
        r = engine.predict_all(v, a)
        print(f"{cat:28s} | {r['p1_nvd']:8.4f} | {r['p2_epss']:8.4f} | {r['p3_org_risk']:8.4f} | {r['p4_mitre_attack']:10.4f} | {r['meta_exploitation_probability']:8.4f}")

if __name__ == "__main__":
    test_p5_profiles()
