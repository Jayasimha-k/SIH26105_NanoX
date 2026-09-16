import sys
import os
import unittest
import json
import joblib
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.ml.adapter import BaseModelAdapter
from app.ml.risk_models import FullAIRiskPipeline, MetaModelEnsemble
from app.ml.train_meta_model import META_MODEL_FEATURES

class TestTabularMetaModel(unittest.TestCase):

    def setUp(self):
        self.backend_dir = os.path.abspath(os.path.dirname(__file__))
        self.meta_artifact_dir = os.path.join(self.backend_dir, "models_artifacts", "meta_model")
        self.model_path = os.path.join(self.meta_artifact_dir, "model.joblib")
        self.metadata_path = os.path.join(self.meta_artifact_dir, "metadata.json")

    def test_artifact_and_metadata_exist(self):
        """Verifies that the trained model binary and metadata.json exist."""
        self.assertTrue(os.path.exists(self.model_path), "model.joblib artifact not found!")
        self.assertTrue(os.path.exists(self.metadata_path), "metadata.json not found!")

        with open(self.metadata_path, "r") as f:
            meta = json.load(f)

        self.assertEqual(meta["model_type"], "TabularLogisticRegression")
        self.assertEqual(meta["input_features"], META_MODEL_FEATURES)
        self.assertEqual(len(meta["input_features"]), 12)
        self.assertIn("performance_metrics", meta)

    def test_direct_model_artifact_inference(self):
        """Loads model artifact directly with joblib and verifies predict_proba in [0, 1]."""
        model = joblib.load(self.model_path)
        
        # Test vector with 12 features
        test_vector = np.array([[
            0.95,  # p1
            0.88,  # p2
            0.95,  # p3
            0.90,  # p4
            9.0,   # asset_criticality
            1.0,   # exposure_level (INTERNET_FACING)
            2.0,   # incident_count
            0.0,   # severity_exploitation_conflict
            0.0,   # kev_epss_conflict
            0.0,   # threat_asset_exposure_conflict
            0.07,  # spread
            0.026  # std
        ]])

        probs = model.predict_proba(test_vector)
        self.assertEqual(probs.shape, (1, 2))
        prob_1 = float(probs[0][1])
        
        self.assertGreaterEqual(prob_1, 0.0)
        self.assertLessEqual(prob_1, 1.0)
        self.assertGreater(prob_1, 0.5, "High threat on internet-facing asset should produce high exploitation probability")

    def test_adapter_meta_model_integration(self):
        """Tests that BaseModelAdapter loads the artifact and infers correctly."""
        adapter = BaseModelAdapter(self.meta_artifact_dir)
        self.assertIsNotNone(adapter.model)

        features = {
            "p1": 0.95,
            "p2": 0.88,
            "p3": 0.95,
            "p4": 0.90,
            "asset_criticality": 9.0,
            "exposure_level": "INTERNET_FACING",
            "incident_count": 2,
            "severity_exploitation_conflict": 0.0,
            "kev_epss_conflict": 0.0,
            "threat_asset_exposure_conflict": 0.0,
            "spread": 0.07,
            "std": 0.026
        }

        prob = adapter.predict(features)
        self.assertIsInstance(prob, float)
        self.assertGreaterEqual(prob, 0.0)
        self.assertLessEqual(prob, 1.0)

    def test_full_pipeline_with_meta_model(self):
        """Tests FullAIRiskPipeline end-to-end with the new trainable meta-model."""
        ai_output = FullAIRiskPipeline.run_pipeline(
            cvss_score=9.8,
            cwe_id="CWE-787",
            epss_score=0.88,
            is_cisa_kev=True,
            mitre_technique="T1190",
            asset_criticality=9.0,
            exposure_level="INTERNET_FACING",
            incident_count=2
        )

        self.assertIn("p1_nvd", ai_output)
        self.assertIn("p2_epss", ai_output)
        self.assertIn("p3_cisa_kev", ai_output)
        self.assertIn("p4_mitre_attack", ai_output)
        self.assertIn("meta_exploitation_probability", ai_output)
        self.assertIn("organization_adapted_probability", ai_output)
        self.assertIn("conflict_information", ai_output)

        meta_p = ai_output["meta_exploitation_probability"]
        org_p = ai_output["organization_adapted_probability"]

        self.assertTrue(0.0 <= meta_p <= 1.0, f"meta_p {meta_p} is outside [0, 1]")
        self.assertTrue(0.0 <= org_p <= 1.0, f"org_p {org_p} is outside [0, 1]")

    def test_deterministic_inference(self):
        """Ensures that repeated inferences with identical features yield exact identical outputs."""
        features = {
            "p1": 0.85,
            "p2": 0.72,
            "p3": 0.95,
            "p4": 0.88,
            "asset_criticality": 7.5,
            "exposure_level": "INTERNAL",
            "incident_count": 1
        }

        adapter = BaseModelAdapter(self.meta_artifact_dir)
        pred1 = adapter.predict(features)
        
        for _ in range(50):
            pred_k = adapter.predict(features)
            self.assertEqual(pred1, pred_k)

if __name__ == "__main__":
    unittest.main(verbosity=2)
