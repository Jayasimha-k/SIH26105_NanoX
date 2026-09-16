import os
import logging
from typing import Dict, Any, List
from app.ml.adapter import BaseModelAdapter
from app.config import settings

logger = logging.getLogger(__name__)

class MLOrchestrator:
    def __init__(self, models_root: str = None):
        self.models_root = models_root or settings.MODELS_DIR
        self.base_models: Dict[str, BaseModelAdapter] = {}
        self.meta_model: BaseModelAdapter = None
        self.load_all_models()

    def load_all_models(self):
        """
        Scans models_root for model_1, model_2, model_3, model_4, and meta_model.
        Dynamically initializes adapters for plug-and-play operation.
        """
        logger.info(f"Scanning for ML model artifacts in {self.models_root}...")
        if not os.path.exists(self.models_root):
            os.makedirs(self.models_root, exist_ok=True)

        # Expected base model folders
        base_model_names = ["model_1", "model_2", "model_3", "model_4"]
        for name in base_model_names:
            model_dir = os.path.join(self.models_root, name)
            if not os.path.exists(model_dir):
                os.makedirs(model_dir, exist_ok=True)
            self.base_models[name] = BaseModelAdapter(model_dir)

        # Meta model folder
        meta_dir = os.path.join(self.models_root, "meta_model")
        if not os.path.exists(meta_dir):
            os.makedirs(meta_dir, exist_ok=True)
        self.meta_model = BaseModelAdapter(meta_dir)

        logger.info(f"ML Orchestrator initialized with {len(self.base_models)} base models and 1 meta-model.")

    def run_pipeline(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Full 2-stage execution flow:
        1. Preprocess features & run base models (Model 1..4) using trained XGBoost models
        2. Construct meta-model input vector from base model outputs
        3. Run Meta-Model to yield final calibrated probability score
        """
        try:
            from app.ml.production_loader import production_ml_engine
            vuln_dict = {
                "cvss_score": features.get("cvss_score", 7.5),
                "cwe_id": features.get("cwe_id", "CWE-787"),
                "epss_score": features.get("epss_score", 0.5),
                "cisa_kev": features.get("cisa_kev", False),
                "mitre_attack_technique": features.get("mitre_attack_technique", "T1190"),
                "exploitability_score": features.get("exploitability_score", 2.8),
                "impact_score": features.get("impact_score", 4.2),
                "attack_vector": features.get("attack_vector", "NETWORK")
            }
            asset_dict = {
                "criticality_score": features.get("criticality_score", 5.0),
                "exposure_level": features.get("exposure_level", "INTERNAL")
            }
            incident_count = features.get("incident_count", 0)
            res = production_ml_engine.predict_all(vuln_dict, asset_dict, incident_count)
            return {
                "base_model_predictions": {
                    "model_1": res["p1_nvd"],
                    "model_2": res["p2_epss"],
                    "model_3": res["p3_org_risk"],
                    "model_4": res["p4_mitre_attack"]
                },
                "meta_model_prediction": res["meta_exploitation_probability"],
                "final_exploitation_probability": res["organization_adapted_probability"],
                "models_used": res.get("models_used", []),
                "architecture": res.get("architecture", "")
            }
        except Exception as e:
            logger.warning(f"Production ML Engine fallback triggered: {e}")
            base_predictions = {}
            for name, adapter in self.base_models.items():
                try:
                    score = adapter.predict(features)
                    base_predictions[name] = round(score, 4)
                except Exception as ex:
                    logger.error(f"Error predicting with {name}: {ex}")
                    base_predictions[name] = 0.50

            meta_input = {**features, **base_predictions}
            try:
                final_prob = self.meta_model.predict(meta_input)
            except Exception as ex:
                logger.error(f"Error predicting with meta_model: {ex}")
                final_prob = sum(base_predictions.values()) / len(base_predictions)

            final_prob = round(float(final_prob), 4)

            return {
                "base_model_predictions": base_predictions,
                "meta_model_prediction": final_prob,
                "final_exploitation_probability": final_prob
            }

    def get_all_model_metadata(self) -> Dict[str, Any]:
        """Returns metadata configuration for all registered models."""
        result = {}
        for name, adapter in self.base_models.items():
            result[name] = adapter.get_metadata()
        if self.meta_model:
            result["meta_model"] = self.meta_model.get_metadata()
        return result

# Global singleton orchestrator
orchestrator = MLOrchestrator()
