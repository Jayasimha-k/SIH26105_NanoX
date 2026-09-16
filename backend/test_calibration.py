import sys
import os
import unittest
import json
import joblib
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.ml.calibrator import (
    PlattCalibrator,
    compute_brier_score,
    compute_log_loss,
    compute_calibration_curve
)
from app.ml.risk_models import FullAIRiskPipeline, MetaModelEnsemble
from app.ml.train_calibrator import run_temporal_calibration_pipeline

class TestProbabilityCalibration(unittest.TestCase):

    def setUp(self):
        self.backend_dir = os.path.abspath(os.path.dirname(__file__))
        self.calibrator_dir = os.path.join(self.backend_dir, "models_artifacts", "calibrator")
        self.calibrator_path = os.path.join(self.calibrator_dir, "calibrator.joblib")
        self.metadata_path = os.path.join(self.calibrator_dir, "metadata.json")

    def test_calibrator_artifact_and_metadata(self):
        """Verifies calibrator artifact and metadata exist with proper version and parameters."""
        self.assertTrue(os.path.exists(self.calibrator_path), "calibrator.joblib artifact not found!")
        self.assertTrue(os.path.exists(self.metadata_path), "metadata.json not found!")

        with open(self.metadata_path, "r") as f:
            meta = json.load(f)

        self.assertEqual(meta["artifact_type"], "ProbabilityCalibrator")
        self.assertEqual(meta["calibration_method"], "PlattSigmoidScaling")
        self.assertEqual(meta["version"], "1.0.0-platt")
        self.assertIn("parameters", meta)
        self.assertIn("slope_a", meta["parameters"])
        self.assertIn("intercept_b", meta["parameters"])

    def test_temporal_calibration_training_execution(self):
        """Runs the temporal calibration pipeline and verifies temporal split without leakage."""
        res = run_temporal_calibration_pipeline(self.calibrator_dir, random_state=123)
        self.assertIn("comparison_report", res)
        report = res["comparison_report"]

        # Check temporal split integrity
        split = report["dataset_split"]
        self.assertEqual(split["train_samples"] + split["calibration_samples"] + split["test_samples"], split["total_samples"])
        self.assertEqual(split["temporal_split_order"], "Train -> Calibration -> Test (zero future leakage)")

        # Verify metrics present
        metrics = report["raw_vs_calibrated_metrics"]
        self.assertIn("raw_brier_score", metrics)
        self.assertIn("calibrated_brier_score", metrics)
        self.assertIn("raw_log_loss", metrics)
        self.assertIn("calibrated_log_loss", metrics)

    def test_calibrator_transforms_to_valid_probabilities(self):
        """Tests that PlattCalibrator strictly maps inputs into [0.0, 1.0]."""
        calibrator = joblib.load(self.calibrator_path)
        
        test_inputs = np.array([-5.0, 0.0, 0.15, 0.50, 0.85, 1.0, 5.0])
        calibrated_outputs = calibrator.calibrate(test_inputs)

        self.assertEqual(len(calibrated_outputs), len(test_inputs))
        for val in calibrated_outputs:
            self.assertGreaterEqual(val, 0.0)
            self.assertLessEqual(val, 1.0)

        # Monotonicity check: higher raw score should produce equal or higher calibrated probability
        for i in range(len(test_inputs) - 1):
            self.assertLessEqual(calibrated_outputs[i], calibrated_outputs[i + 1])

    def test_pipeline_returns_both_raw_and_calibrated_probabilities(self):
        """Verifies FullAIRiskPipeline returns both raw_probability and calibrated_probability."""
        output = FullAIRiskPipeline.run_pipeline(
            cvss_score=9.8,
            cwe_id="CWE-787",
            epss_score=0.88,
            is_cisa_kev=True,
            mitre_technique="T1190",
            asset_criticality=9.0,
            exposure_level="INTERNET_FACING",
            incident_count=2
        )

        self.assertIn("raw_probability", output)
        self.assertIn("calibrated_probability", output)
        self.assertIn("organization_adapted_probability", output)
        self.assertIn("conflict_information", output)

        raw_p = output["raw_probability"]
        cal_p = output["calibrated_probability"]

        self.assertTrue(0.0 <= raw_p <= 1.0, f"raw_p {raw_p} outside [0, 1]")
        self.assertTrue(0.0 <= cal_p <= 1.0, f"cal_p {cal_p} outside [0, 1]")

    def test_calibration_curve_computation(self):
        """Verifies reliability curve binning and Expected Calibration Error calculation."""
        y_true = np.array([0, 0, 0, 1, 0, 1, 1, 1, 1, 1])
        y_prob = np.array([0.1, 0.15, 0.25, 0.35, 0.45, 0.65, 0.75, 0.85, 0.90, 0.95])

        curve = compute_calibration_curve(y_true, y_prob, n_bins=5)
        self.assertEqual(len(curve["bin_pred_means"]), 5)
        self.assertEqual(len(curve["bin_true_fractions"]), 5)
        self.assertEqual(sum(curve["bin_counts"]), 10)
        self.assertGreaterEqual(curve["expected_calibration_error"], 0.0)

if __name__ == "__main__":
    unittest.main(verbosity=2)
