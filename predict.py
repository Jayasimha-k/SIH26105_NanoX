"""
predict.py
Unified prediction and explainability module supporting both ONNX Runtime (preferred offline)
and local Scikit-Learn pipeline fallback.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from baseline_risk_engine import BaselineRiskEngine
from investment_optimizer import InvestmentOptimizer
from train import ALL_INPUT_FEATURES, BOOLEAN_FEATURES, NUMERIC_FEATURES, CATEGORICAL_FEATURES

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models", "organization-risk")
ONNX_PATH = os.path.join(MODEL_DIR, "model.onnx")
PKL_PATH = os.path.join(MODEL_DIR, "model_pipeline.pkl")


class OrganizationRiskPredictor:
    def __init__(self, use_onnx: bool = True):
        self.baseline_engine = BaselineRiskEngine()
        self.investment_optimizer = InvestmentOptimizer(self.predict_raw_score)
        self.use_onnx = use_onnx
        self.onnx_session = None
        self.sklearn_pipeline = None

        if use_onnx and os.path.exists(ONNX_PATH):
            try:
                import onnxruntime as rt
                self.onnx_session = rt.InferenceSession(ONNX_PATH, providers=["CPUExecutionProvider"])
                print(f"[Predictor] Loaded offline ONNX model: {ONNX_PATH}")
            except Exception as e:
                print(f"[Predictor] Failed to load ONNX: {e}. Falling back to scikit-learn.")
                self.use_onnx = False

        if not self.use_onnx or self.onnx_session is None:
            if os.path.exists(PKL_PATH):
                self.sklearn_pipeline = joblib.load(PKL_PATH)
                print(f"[Predictor] Loaded scikit-learn pipeline: {PKL_PATH}")
            else:
                print(f"[Predictor] Warning: No trained ML model found at {PKL_PATH}. Using baseline engine only.")

    def predict_raw_score(self, posture_dict: dict) -> dict:
        """
        Fast raw score calculation for investment simulation without triggering recursive optimization loops.
        """
        df_row = self._normalize_input(posture_dict)
        ml_score = self.predict_score_ml(df_row)
        calibrated_score = round(max(0.0, min(100.0, ml_score)), 1)
        if calibrated_score < 25.0:
            level = "Low"
        elif calibrated_score < 50.0:
            level = "Moderate"
        elif calibrated_score < 75.0:
            level = "High"
        else:
            level = "Critical"
        return {"risk_score": calibrated_score, "risk_level": level}

    def _normalize_input(self, data: dict) -> pd.DataFrame:
        row = {}
        for col in ALL_INPUT_FEATURES:
            if col in data:
                val = data[col]
            else:
                # Reasonable defaults
                if col in CATEGORICAL_FEATURES:
                    val = "technology" if col == "industry" else "medium"
                elif col in BOOLEAN_FEATURES:
                    val = 0
                else:
                    val = 50.0
            
            if col in BOOLEAN_FEATURES:
                row[col] = int(bool(val))
            elif col in NUMERIC_FEATURES:
                row[col] = float(val)
            else:
                row[col] = str(val)

        return pd.DataFrame([row])

    def predict_score_ml(self, df_row: pd.DataFrame) -> float:
        """
        Runs inference through ONNX Runtime or Scikit-learn.
        """
        if self.onnx_session:
            # Build ONNX feed dictionary
            feed_dict = {}
            for inp in self.onnx_session.get_inputs():
                name = inp.name
                val = df_row[name].values
                if name in CATEGORICAL_FEATURES:
                    feed_dict[name] = np.array([[str(v)] for v in val], dtype=object)
                elif name in BOOLEAN_FEATURES:
                    feed_dict[name] = np.array([[int(v)] for v in val], dtype=np.int64)
                else:
                    feed_dict[name] = np.array([[float(v)] for v in val], dtype=np.float32)

            onnx_pred = self.onnx_session.run(None, feed_dict)[0]
            score = float(onnx_pred[0][0])
            return score

        elif self.sklearn_pipeline:
            pred = self.sklearn_pipeline.predict(df_row)[0]
            return float(pred)
        else:
            # Baseline fallback
            res = self.baseline_engine.evaluate_organization(df_row.to_dict(orient="records")[0])
            return float(res["risk_score"])

    def predict_posture(self, posture_dict: dict) -> dict:
        """
        Full prediction output with risk score, level, category breakdown,
        contributing factors, strengths, and recommended investments.
        """
        df_row = self._normalize_input(posture_dict)
        baseline_eval = self.baseline_engine.evaluate_organization(posture_dict)

        # ML Risk Score
        ml_score = self.predict_score_ml(df_row)
        calibrated_score = round(max(0.0, min(100.0, ml_score)), 1)

        # Determine Risk Level
        if calibrated_score < 25.0:
            level = "Low"
        elif calibrated_score < 50.0:
            level = "Moderate"
        elif calibrated_score < 75.0:
            level = "High"
        else:
            level = "Critical"

        # Explainability: Top contributing factors & protective factors
        top_risk_factors = []
        protective_factors = []

        # Feature checks for human-interpretable explanation
        mfa = posture_dict.get("mfa_coverage", 50)
        if mfa < 50:
            top_risk_factors.append(f"Low Multi-Factor Authentication (MFA) coverage ({mfa}%)")
        elif mfa >= 90:
            protective_factors.append(f"High MFA coverage ({mfa}%) across user accounts")

        patch_delay = posture_dict.get("average_patch_delay", 30)
        if patch_delay > 40:
            top_risk_factors.append(f"Prolonged vulnerability patch delay ({patch_delay} days)")
        elif patch_delay <= 14:
            protective_factors.append(f"Rapid vulnerability patching SLA ({patch_delay} days)")

        if not posture_dict.get("offline_backup", False):
            top_risk_factors.append("No immutable/air-gapped offline backup (high ransomware exposure)")
        else:
            protective_factors.append("Immutable offline backup maintained")

        edr = posture_dict.get("edr_coverage", 50)
        if edr < 40:
            top_risk_factors.append(f"Insufficient Endpoint Detection & Response (EDR) coverage ({edr}%)")
        elif edr >= 85:
            protective_factors.append(f"Comprehensive EDR deployment ({edr}%)")

        if not posture_dict.get("network_segmentation", False):
            top_risk_factors.append("Lack of network microsegmentation between critical assets")
        else:
            protective_factors.append("Zero-Trust network segmentation active")

        if not posture_dict.get("incident_response_plan", False):
            top_risk_factors.append("No formally documented Incident Response (IR) plan")
        elif posture_dict.get("incident_response_testing", False):
            protective_factors.append("Tested and exercised Incident Response plan")

        # Recommended immediate security investments
        investment_candidates = self.investment_optimizer.evaluate_investment_impacts(posture_dict)
        recommended = [inv for inv in investment_candidates if inv["expected_risk_reduction"] >= 1.5][:4]

        return {
            "risk_score": calibrated_score,
            "risk_level": level,
            "baseline_rule_score": baseline_eval["risk_score"],
            "model_version": "0.1.0",
            "inference_engine": "ONNX Runtime" if self.onnx_session else "Scikit-Learn Pipeline",
            "category_scores": baseline_eval["category_scores"],
            "top_risk_factors": top_risk_factors,
            "protective_factors": protective_factors,
            "recommended_investments": recommended
        }


if __name__ == "__main__":
    predictor = OrganizationRiskPredictor()
    test_org = {
        "organization_size": "medium",
        "industry": "healthcare",
        "number_of_employees": 1200,
        "mfa_coverage": 35.0,
        "average_patch_delay": 55,
        "offline_backup": False,
        "edr_coverage": 25.0,
        "network_segmentation": False,
        "incident_response_plan": True,
        "incident_response_testing": False
    }
    result = predictor.predict_posture(test_org)
    print("\n--- PREDICTION OUTPUT ---")
    print(json.dumps(result, indent=2))
