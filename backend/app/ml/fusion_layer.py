"""
backend/app/ml/fusion_layer.py
Evidence Fusion Layer: Combines P5 Meta-Ensemble and P6 Network Evidence.

Preserves 100% backward compatibility with P1-P5 production pipelines.
Loads versioned configurations from models/fusion/ (v1, v2) with runtime override capability.
Provides full model provenance for backend audit trails and consortium blockchain anchoring.

Equation:
    P_fused = (1 - w_p6) * P_5 + w_p6 * P_6
"""

import os
import json
import time
from typing import Dict, Any, Optional

DEFAULT_FUSION_DIR = os.path.abspath(os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "models", "fusion"
))

def load_fusion_config(version: str = "v2", config_dir: str = DEFAULT_FUSION_DIR) -> Dict[str, Any]:
    """Loads versioned fusion configuration (e.g. fusion_v2.json or fusion_v1.json)."""
    cfg_file = os.path.join(config_dir, f"fusion_{version}.json")
    if os.path.exists(cfg_file):
        try:
            with open(cfg_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    # Safe default fallback
    fallback_weights = {"v1": 0.25, "v2": 0.90}
    w = fallback_weights.get(version, 0.90)
    return {
        "fusion_version": version,
        "p5_weight": round(1.0 - w, 2),
        "p6_weight": w,
        "selection_method": "Default fallback configuration",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

def fuse_risk_evidence(
    p5_risk_score: float,
    p6_network_evidence: Optional[float] = None,
    p6_weight: Optional[float] = None,
    fusion_version: str = "v2",
    assessment_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Fuses P5 meta-ensemble risk probability with empirical network evidence P6.
    
    If p6_network_evidence is None, returns P5 unchanged (zero side effects on existing system).
    If provided, fuses according to versioned or explicit convex combination.
    Preserves comprehensive provenance for Fabric audit logs and SOC investigations.
    """
    p5_clamped = max(0.0, min(1.0, float(p5_risk_score)))
    current_time = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    if p6_network_evidence is None:
        return {
            "fused_probability": round(p5_clamped, 4),
            "p5_prior_probability": round(p5_clamped, 4),
            "p6_empirical_probability": None,
            "p5_weight": 1.0,
            "p6_weight": 0.0,
            "fusion_mode": "p5_only",
            "fusion_version": "none",
            "p5_model_version": "CyberOptRQ_Meta_XGBoost_FINAL_4INPUT",
            "p6_model_version": None,
            "assessment_id": assessment_id,
            "timestamp": current_time
        }
        
    p6_clamped = max(0.0, min(1.0, float(p6_network_evidence)))
    
    # Resolve weight from config or argument
    if p6_weight is not None:
        w = max(0.0, min(1.0, float(p6_weight)))
        cfg_ver = f"custom_w{w:.2f}"
    else:
        cfg = load_fusion_config(version=fusion_version)
        w = float(cfg.get("p6_weight", 0.90))
        cfg_ver = cfg.get("fusion_version", fusion_version)
        
    w_p5 = round(1.0 - w, 4)
    
    # Convex combination
    fused_val = w_p5 * p5_clamped + w * p6_clamped
    fused_clamped = max(0.0, min(1.0, fused_val))
    
    return {
        "fused_probability": round(fused_clamped, 4),
        "p5_prior_probability": round(p5_clamped, 4),
        "p6_empirical_probability": round(p6_clamped, 4),
        "p5_weight": round(w_p5, 4),
        "p6_weight": round(w, 4),
        "fusion_mode": "p5_p6_convex_combination",
        "fusion_version": cfg_ver,
        "empirical_boost": round(fused_clamped - p5_clamped, 4),
        "p5_model_version": "CyberOptRQ_Meta_XGBoost_FINAL_4INPUT",
        "p6_model_version": "CyberOptRQ_P6_CIC2017_XGBoost_v1",
        "assessment_id": assessment_id,
        "timestamp": current_time
    }
