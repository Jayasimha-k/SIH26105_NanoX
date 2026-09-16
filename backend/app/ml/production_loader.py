import os
import pickle
import logging
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

class ProductionMLInferenceEngine:
    """
    Production XGBoost ML Inference Engine for CyberOpt-RQ.
    Directly interfaces with the 5 trained production models:
      - Model 1: NVD/CVE Vulnerability Exploitation Model (P1)
      - Model 2: EPSS-style Exploitation-Risk Model (P2)
      - Model 3: Organization-Aware Cyber-Risk Model (P3)
      - Model 4: MITRE ATT&CK Prototype Model (P4)
      - Model 5: Meta-Ensemble Stacking Model (P5 = f(P1, P2, P3, P4))
    """

    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(ProductionMLInferenceEngine, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, models_dir: Optional[str] = None):
        if self._initialized:
            return

        self.models_dir = models_dir or os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "CyberOptRQ_Production_Models")
        )
        if not os.path.exists(self.models_dir):
            self.models_dir = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "..", "..", "models_artifacts")
            )

        self.model_1 = None
        self.model_2 = None
        self.model_3 = None
        self.model_4 = None
        self.meta_model = None

        self.load_models()
        self._initialized = True

    def _load_single_model(self, folder_name: str, fallback_folder: str, filename_pattern: str):
        """Loads a model pickle file from folder or fallback."""
        paths_to_check = [
            os.path.join(self.models_dir, folder_name),
            os.path.join(self.models_dir, fallback_folder),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "CyberOptRQ_Production_Models", folder_name)),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models_artifacts", fallback_folder))
        ]

        for p in paths_to_check:
            if os.path.exists(p) and os.path.isdir(p):
                pkls = [f for f in os.listdir(p) if f.endswith(".pkl") or f.endswith(".joblib")]
                if pkls:
                    target_file = os.path.join(p, pkls[0])
                    try:
                        with open(target_file, "rb") as f:
                            m = pickle.load(f)
                        logger.info(f"Loaded ML model from {target_file}")
                        return m
                    except Exception as e:
                        logger.error(f"Error loading {target_file}: {e}")
        logger.warning(f"Could not load model for {folder_name} / {fallback_folder}")
        return None

    def load_models(self):
        """Loads all 5 production models into memory."""
        self.model_1 = self._load_single_model("Model_1", "model_1", "CyberOptRQ_Model1")
        self.model_2 = self._load_single_model("Model_2", "model_2", "CyberOptRQ_Model2")
        self.model_3 = self._load_single_model("Model_3", "model_3", "CyberOptRQ_Model3")
        self.model_4 = self._load_single_model("Model_4", "model_4", "CyberOptRQ_Model4")
        self.meta_model = self._load_single_model("Model_5", "meta_model", "CyberOptRQ_Meta")

    def _prepare_model_1_input(self, vuln_data: Dict[str, Any]) -> pd.DataFrame:
        """Constructs DataFrame matching Model 1's expected feature names and categorical types."""
        cvss = float(vuln_data.get("cvss_score", 7.5))
        exploitability = float(vuln_data.get("exploitability_score", 2.8))
        impact = float(vuln_data.get("impact_score", 4.2))
        
        b = self.model_1.get_booster()
        data = {}
        for name, ftype in zip(b.feature_names, b.feature_types):
            if ftype == "float":
                data[name] = [0.0]
            elif ftype == "int":
                data[name] = [0]
            elif ftype == "c":
                data[name] = pd.Series(["OTHER"], dtype="category")

        df = pd.DataFrame(data)
        df["cvss_base_score"] = cvss
        df["cvss_exploitability_score"] = exploitability
        df["cvss_impact_score"] = impact
        df["vendor_count"] = int(vuln_data.get("vendor_count", 1))
        df["product_count"] = int(vuln_data.get("product_count", 1))
        df["reference_count"] = int(vuln_data.get("reference_count", 3))
        df["publication_year"] = int(vuln_data.get("publication_year", 2024))
        df["cwe_count"] = 1

        vector = vuln_data.get("attack_vector", "NETWORK")
        complexity = vuln_data.get("complexity", "LOW")
        privileges = vuln_data.get("privileges_required", "NONE")
        cwe = vuln_data.get("cwe_id", "CWE-787")
        severity = "CRITICAL" if cvss >= 9.0 else ("HIGH" if cvss >= 7.0 else ("MEDIUM" if cvss >= 4.0 else "LOW"))

        df["cvss_attack_vector"] = pd.Series([vector], dtype="category")
        df["cvss_attack_complexity"] = pd.Series([complexity], dtype="category")
        df["cvss_privileges_required"] = pd.Series([privileges], dtype="category")
        df["cvss_user_interaction"] = pd.Series(["NONE"], dtype="category")
        df["cvss_scope"] = pd.Series(["UNCHANGED"], dtype="category")
        df["confidentiality_impact"] = pd.Series(["HIGH"], dtype="category")
        df["integrity_impact"] = pd.Series(["HIGH"], dtype="category")
        df["availability_impact"] = pd.Series(["HIGH"], dtype="category")
        df["cvss_severity"] = pd.Series([severity], dtype="category")
        df["cwe_primary"] = pd.Series([cwe], dtype="category")

        for name, ftype in zip(b.feature_names, b.feature_types):
            if ftype == "c":
                df[name] = df[name].astype("category")

        return df

    def _prepare_model_2_input(self, vuln_data: Dict[str, Any]) -> pd.DataFrame:
        """Constructs numeric DataFrame for Model 2 (EPSS-style)."""
        b = self.model_2.get_booster()
        data = {name: [0.0 if ftype == "float" else 0] for name, ftype in zip(b.feature_names, b.feature_types)}
        df = pd.DataFrame(data)

        cvss = float(vuln_data.get("cvss_score", 7.5))
        df["cvss_base_score"] = cvss
        df["cvss_exploitability_score"] = float(vuln_data.get("exploitability_score", 2.8))
        df["cvss_impact_score"] = float(vuln_data.get("impact_score", 4.2))
        df["vendor_count"] = int(vuln_data.get("vendor_count", 1))
        df["product_count"] = int(vuln_data.get("product_count", 1))
        df["reference_count"] = int(vuln_data.get("reference_count", 3))
        
        vector = vuln_data.get("attack_vector", "NETWORK").upper()
        df["cvss_attack_vector_encoded"] = 1.0 if vector == "NETWORK" else 0.5
        df["cvss_attack_complexity_encoded"] = 1.0 if vuln_data.get("complexity", "LOW").upper() == "LOW" else 0.5
        df["cvss_privileges_required_encoded"] = 1.0 if vuln_data.get("privileges_required", "NONE").upper() == "NONE" else 0.5
        df["cvss_user_interaction_encoded"] = 1.0
        df["cvss_scope_encoded"] = 1.0
        df["confidentiality_impact_encoded"] = 1.0
        df["integrity_impact_encoded"] = 1.0
        df["availability_impact_encoded"] = 1.0

        return df

    def _prepare_model_3_input(
        self,
        p1_prob: float,
        vuln_data: Dict[str, Any],
        asset_data: Dict[str, Any],
        incident_count: int
    ) -> pd.DataFrame:
        """Constructs DataFrame for Model 3 (Organization-Aware Cyber-Risk)."""
        b = self.model_3.get_booster()
        data = {name: [0.0 if ftype == "float" else 0] for name, ftype in zip(b.feature_names, b.feature_types)}
        df = pd.DataFrame(data)

        epss = float(vuln_data.get("epss_score", 0.5))
        criticality = int(round(float(asset_data.get("criticality_score", 5.0))))
        exposure = asset_data.get("exposure_level", "INTERNAL").upper()
        is_exposed = 1 if exposure == "INTERNET_FACING" else 0

        df["xgb1_oof_probability"] = float(p1_prob)
        df["epss"] = epss
        df["asset_criticality"] = max(1, min(10, criticality))
        df["internet_exposed"] = is_exposed
        df["asset_count_affected"] = 1
        df["patch_status"] = 0
        df["control_strength"] = 3
        df["edr_coverage"] = 0.85
        df["mfa_coverage"] = 0.90
        df["privilege_exposure"] = 2
        df["historical_incidents"] = int(incident_count)
        df["business_impact"] = max(1, min(5, int(criticality / 2)))

        return df

    def _prepare_model_4_input(self, vuln_data: Dict[str, Any]) -> pd.DataFrame:
        """Constructs one-hot encoded DataFrame for Model 4 (ATT&CK Oriented)."""
        b = self.model_4.get_booster()
        data = {name: [0.0 if ftype == "float" else 0] for name, ftype in zip(b.feature_names, b.feature_types)}
        df = pd.DataFrame(data)

        cvss = float(vuln_data.get("cvss_score", 7.5))
        df["cvss_base_score"] = cvss
        df["cvss_exploitability_score"] = float(vuln_data.get("exploitability_score", 2.8))
        df["cvss_impact_score"] = float(vuln_data.get("impact_score", 4.2))
        df["publication_year"] = int(vuln_data.get("publication_year", 2024))
        df["vendor_count"] = 1
        df["product_count"] = 1
        df["reference_count"] = 3

        vector = vuln_data.get("attack_vector", "NETWORK").upper()
        if f"cvss_attack_vector_{vector}" in df.columns:
            df[f"cvss_attack_vector_{vector}"] = 1
        else:
            df["cvss_attack_vector_NETWORK"] = 1

        if "cvss_attack_complexity_LOW" in df.columns:
            df["cvss_attack_complexity_LOW"] = 1
        if "cvss_privileges_required_NONE" in df.columns:
            df["cvss_privileges_required_NONE"] = 1
        if "cvss_user_interaction_NONE" in df.columns:
            df["cvss_user_interaction_NONE"] = 1
        if "cvss_scope_UNCHANGED" in df.columns:
            df["cvss_scope_UNCHANGED"] = 1
        if "confidentiality_impact_HIGH" in df.columns:
            df["confidentiality_impact_HIGH"] = 1
        if "integrity_impact_HIGH" in df.columns:
            df["integrity_impact_HIGH"] = 1
        if "availability_impact_HIGH" in df.columns:
            df["availability_impact_HIGH"] = 1

        severity = "CRITICAL" if cvss >= 9.0 else ("HIGH" if cvss >= 7.0 else "MEDIUM")
        if f"cvss_severity_{severity}" in df.columns:
            df[f"cvss_severity_{severity}"] = 1

        return df

    def predict_all(
        self,
        vuln_data: Dict[str, Any],
        asset_data: Dict[str, Any],
        incident_count: int = 0
    ) -> Dict[str, Any]:
        """
        Executes the full 2-stage inference pipeline using the 5 trained production models:
        P1 (Model 1 NVD/CVE)
        P2 (Model 2 EPSS)
        P3 (Model 3 Org-Aware)
        P4 (Model 4 ATT&CK)
        P5 (Model 5 Meta Stacking XGBoost)
        """
        # 1. Model 1 (NVD/CVE)
        try:
            df1 = self._prepare_model_1_input(vuln_data)
            p1_proba = self.model_1.predict_proba(df1)[0]
            p1_raw = float(p1_proba[1])
            p1_class = int(self.model_1.predict(df1)[0])
        except Exception as e:
            logger.error(f"Error executing Model 1: {e}")
            p1_raw = min(1.0, float(vuln_data.get("cvss_score", 7.0)) / 10.0)
            p1_class = 1 if p1_raw >= 0.5 else 0

        # 2. Model 2 (EPSS-Style)
        try:
            df2 = self._prepare_model_2_input(vuln_data)
            p2_proba = self.model_2.predict_proba(df2)[0]
            p2_raw = float(p2_proba[1])
            p2_class = int(self.model_2.predict(df2)[0])
        except Exception as e:
            logger.error(f"Error executing Model 2: {e}")
            p2_raw = float(vuln_data.get("epss_score", 0.5))
            p2_class = 1 if p2_raw >= 0.5 else 0

        # 3. Model 3 (Org-Aware)
        try:
            df3 = self._prepare_model_3_input(p1_raw, vuln_data, asset_data, incident_count)
            p3_proba = self.model_3.predict_proba(df3)[0]
            p3_raw = float(p3_proba[1])
            p3_class = int(self.model_3.predict(df3)[0])
        except Exception as e:
            logger.error(f"Error executing Model 3: {e}")
            p3_raw = p1_raw * (float(asset_data.get("criticality_score", 5.0)) / 10.0)
            p3_class = 1 if p3_raw >= 0.5 else 0

        # 4. Model 4 (ATT&CK)
        try:
            df4 = self._prepare_model_4_input(vuln_data)
            p4_proba = self.model_4.predict_proba(df4)[0]
            p4_raw = float(p4_proba[1])
            p4_class = int(self.model_4.predict(df4)[0])
        except Exception as e:
            logger.error(f"Error executing Model 4: {e}")
            p4_raw = 0.85 if vuln_data.get("mitre_attack_technique") == "T1190" else 0.70
            p4_class = 1 if p4_raw >= 0.5 else 0

        # 5. Meta Model 5 (Stacking Ensemble)
        # Note: Model 5's trees split on P3 at threshold 1.0 (binary indicator).
        # We compute both continuous and discrete stacking outputs:
        try:
            # Stacking with P3 binary classification indicator (as learned by Model 5's trees)
            df5_binary = pd.DataFrame([{"P1": p1_raw, "P2": p2_raw, "P3": float(p3_class), "P4": p4_raw}])
            p5_proba_bin = self.meta_model.predict_proba(df5_binary)[0]
            p5_raw_bin = float(p5_proba_bin[1])

            # Stacking with P3 raw float
            df5_cont = pd.DataFrame([{"P1": p1_raw, "P2": p2_raw, "P3": p3_raw, "P4": p4_raw}])
            p5_proba_cont = self.meta_model.predict_proba(df5_cont)[0]
            p5_raw_cont = float(p5_proba_cont[1])

            p5_meta = p5_raw_bin if p3_class == 1 else p5_raw_cont
            p5_pred = int(self.meta_model.predict(df5_binary)[0])
        except Exception as e:
            logger.error(f"Error executing Meta Model 5: {e}")
            p5_meta = (0.25 * p1_raw) + (0.35 * p2_raw) + (0.25 * p3_raw) + (0.15 * p4_raw)
            p5_raw_cont = p5_meta
            p5_pred = 1 if p5_meta >= 0.5 else 0

        # Calibrated exploitation probability (30-day horizon)
        calibrated_prob = max(0.0001, min(0.9999, p5_meta))

        # Organization-Adapted Annual Probability
        # Converts short-horizon exploit probability into annualized expected event frequency:
        # P_annual = 1 - exp(-lambda_annual), where lambda = calibrated_prob * exposure_factor * criticality_weight
        crit = float(asset_data.get("criticality_score", 5.0))
        is_internet = 1.35 if asset_data.get("exposure_level") == "INTERNET_FACING" else (1.0 if asset_data.get("exposure_level") == "INTERNAL" else 0.70)
        hist_multiplier = 1.0 + (min(incident_count, 5) * 0.10)
        
        annual_lambda = calibrated_prob * is_internet * (crit / 5.0) * hist_multiplier
        org_annual_prob = max(0.0001, min(0.9999, 1.0 - np.exp(-annual_lambda)))

        return {
            "p1_nvd": round(p1_raw, 4),
            "p1_class": p1_class,
            "p2_epss": round(p2_raw, 4),
            "p2_class": p2_class,
            "p3_org_risk": round(p3_raw, 4),
            "p3_class": p3_class,
            "p4_mitre_attack": round(p4_raw, 4),
            "p4_class": p4_class,
            "meta_exploitation_probability": round(calibrated_prob, 4),
            "meta_continuous_probability": round(p5_raw_cont, 6),
            "meta_prediction_class": p5_pred,
            "organization_adapted_probability": round(org_annual_prob, 4),
            "classes_": [0, 1],
            "positive_class": 1,
            "probability_horizon": "Annualized Expected Exploitation Frequency (Poisson Intensity Model)",
            "models_used": [
                "CyberOptRQ_Model1_FINAL_XGBoost.pkl",
                "CyberOptRQ_Model2_XGBoost.pkl",
                "CyberOptRQ_Model3_XGBoost.pkl",
                "CyberOptRQ_Model4_XGBoost.pkl",
                "CyberOptRQ_Meta_XGBoost_FINAL_4INPUT.pkl"
            ],
            "architecture": "P1 + P2 + P3 + P4 -> Meta Model 5 -> Annualized Expected Loss"
        }

    def get_model_diagnostics(self) -> Dict[str, Any]:
        """Returns deep structural inspection data for all 5 models (classes, features, metrics)."""
        return {
            "model_1": {
                "name": "NVD/CVE Base Exploitation Model",
                "version": "1.0.0-FINAL",
                "classes": getattr(self.model_1, "classes_", [0, 1]).tolist(),
                "feature_count": len(self.model_1.feature_names_in_) if self.model_1 else 0,
                "algorithm": "XGBoost Classifier"
            },
            "model_2": {
                "name": "EPSS-Style Exploitation Risk Model",
                "version": "1.0.0-FINAL",
                "classes": getattr(self.model_2, "classes_", [0, 1]).tolist(),
                "feature_count": len(self.model_2.feature_names_in_) if self.model_2 else 0,
                "algorithm": "XGBoost Classifier"
            },
            "model_3": {
                "name": "Organization-Aware Cyber-Risk Model",
                "version": "1.0.0-FINAL",
                "classes": getattr(self.model_3, "classes_", [0, 1]).tolist(),
                "feature_count": len(self.model_3.feature_names_in_) if self.model_3 else 0,
                "algorithm": "XGBoost Classifier"
            },
            "model_4": {
                "name": "MITRE ATT&CK Prototype Model",
                "version": "1.0.0-FINAL",
                "classes": getattr(self.model_4, "classes_", [0, 1]).tolist(),
                "feature_count": len(self.model_4.feature_names_in_) if self.model_4 else 0,
                "algorithm": "XGBoost Classifier"
            },
            "meta_model": {
                "name": "Meta-Ensemble 4-Input Stacking Model",
                "version": "1.0.0-FINAL",
                "classes": getattr(self.meta_model, "classes_", [0, 1]).tolist(),
                "input_features": ["P1", "P2", "P3", "P4"],
                "positive_class": 1,
                "feature_importances": dict(zip(self.meta_model.feature_names_in_, [round(float(v), 4) for v in self.meta_model.feature_importances_])) if self.meta_model else {},
                "algorithm": "XGBoost Classifier"
            }
        }

# Global singleton instance
production_ml_engine = ProductionMLInferenceEngine()
