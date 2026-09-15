import os
import json
import logging
import joblib
import numpy as np
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

def parse_float_feature(val: Any) -> float:
    """Safely converts numerical or categorical string features into numeric floats."""
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, bool):
        return 1.0 if val else 0.0
    if isinstance(val, str):
        v = val.strip().upper()
        if v == "INTERNET_FACING":
            return 1.0
        elif v == "INTERNAL":
            return 0.5
        elif v == "ISOLATED":
            return 0.1
        try:
            return float(val)
        except ValueError:
            return 0.5
    return 0.5

class BaseModelAdapter:
    def __init__(self, model_dir: str):
        self.model_dir = model_dir
        self.metadata_path = os.path.join(model_dir, "metadata.json")
        self.metadata = self._load_metadata()
        self.model = None
        self._load_model()

    def _load_metadata(self) -> Dict[str, Any]:
        if not os.path.exists(self.metadata_path):
            logger.warning(f"Metadata not found at {self.metadata_path}. Using fallback defaults.")
            return {
                "model_name": os.path.basename(self.model_dir),
                "version": "1.0-default",
                "input_features": ["cvss_score", "epss_score", "criticality_score"],
                "output_type": "probability",
                "output_range": [0, 1]
            }
        with open(self.metadata_path, "r") as f:
            return json.load(f)

    def _load_model(self):
        for filename in ["model.pkl", "model.joblib"]:
            path = os.path.join(self.model_dir, filename)
            if os.path.exists(path):
                try:
                    self.model = joblib.load(path)
                    logger.info(f"Loaded ML model from {path}")
                    return
                except Exception as e:
                    logger.error(f"Failed to load model file {path}: {e}")
        logger.info(f"No binary model file found in {self.model_dir}. Operating in metadata/mock fallback mode.")

    def predict(self, features: Dict[str, Any]) -> float:
        required_features = self.metadata.get("input_features", [])
        
        # If binary model exists and callable/predictable
        if self.model is not None:
            try:
                vector = [parse_float_feature(features.get(feat, 0.5)) for feat in required_features]
                arr = np.array([vector])
                if hasattr(self.model, "predict_proba"):
                    probs = self.model.predict_proba(arr)
                    val = float(probs[0][1] if probs.shape[1] > 1 else probs[0][0])
                elif hasattr(self.model, "predict"):
                    preds = self.model.predict(arr)
                    val = float(preds[0])
                elif callable(self.model):
                    val = float(self.model(vector))
                else:
                    val = 0.5
                
                out_range = self.metadata.get("output_range", [0, 1])
                return float(np.clip(val, out_range[0], out_range[1]))
            except Exception as e:
                logger.error(f"Error calling loaded model in {self.model_dir}: {e}. Falling back to metadata rule.")

        # Fallback metadata-driven estimation
        weights = self.metadata.get("feature_weights", {})
        if weights and all(f in features for f in weights):
            score = sum(parse_float_feature(features.get(f, 0.5)) * parse_float_feature(w) for f, w in weights.items())
        else:
            name = self.metadata.get("model_name", "").lower()
            cvss = parse_float_feature(features.get("cvss_score", 7.0)) / 10.0
            epss = parse_float_feature(features.get("epss_score", 0.5))
            cisa = 1.0 if features.get("cisa_kev", False) else 0.2
            criticality = parse_float_feature(features.get("criticality_score", 5.0)) / 10.0

            if "exploit" in name or "model_1" in name:
                score = 0.4 * epss + 0.4 * cisa + 0.2 * cvss
            elif "threat" in name or "model_2" in name:
                score = 0.5 * cvss + 0.3 * epss + 0.2 * criticality
            elif "asset" in name or "model_3" in name:
                score = 0.6 * criticality + 0.4 * cvss
            elif "impact" in name or "model_4" in name:
                score = 0.5 * criticality + 0.3 * cisa + 0.2 * epss
            elif "meta" in name:
                m1 = parse_float_feature(features.get("model_1", 0.5))
                m2 = parse_float_feature(features.get("model_2", 0.5))
                m3 = parse_float_feature(features.get("model_3", 0.5))
                m4 = parse_float_feature(features.get("model_4", 0.5))
                score = 0.35 * m1 + 0.25 * m2 + 0.20 * m3 + 0.20 * m4
            else:
                score = 0.5 * (cvss + epss)

        out_range = self.metadata.get("output_range", [0, 1])
        return float(np.clip(score, out_range[0], out_range[1]))

    def get_metadata(self) -> Dict[str, Any]:
        return self.metadata
