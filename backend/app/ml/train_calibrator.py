import os
import sys
import json
import random
import logging
import joblib
import numpy as np
from datetime import datetime, timezone
from typing import Dict, Any, Tuple

# Ensure app package is importable
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from app.ml.tabular_model import TabularLogisticRegression
from app.ml.calibrator import (
    PlattCalibrator,
    compute_brier_score,
    compute_log_loss,
    compute_calibration_curve
)
from app.ml.train_meta_model import generate_training_dataset, META_MODEL_FEATURES

logger = logging.getLogger(__name__)

def run_temporal_calibration_pipeline(
    calibrator_output_dir: str,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Executes temporal probability calibration pipeline:
    1. Generates chronologically ordered threat observations.
    2. Temporal Split (no future-data leakage):
       - Period 1 (50%): Meta-model training partition
       - Period 2 (25%): Separate Calibration partition
       - Period 3 (25%): Out-of-time Future Evaluation partition
    3. Fits Platt calibrator on Period 2 predictions.
    4. Evaluates and compares Raw vs Calibrated on Period 3.
    5. Persists calibrator artifact and metadata.
    """
    os.makedirs(calibrator_output_dir, exist_ok=True)

    # 1. Generate chronologically ordered observations
    num_samples = 4000
    X, y = generate_training_dataset(num_samples=num_samples, random_state=random_state)

    # 2. Sequential Temporal Split (Strictly forward time without leakage)
    idx_train_end = int(num_samples * 0.50)      # 0 to 2000: Model training
    idx_cal_end = int(num_samples * 0.75)        # 2000 to 3000: Model calibration
    # 3000 to 4000: Out-of-time evaluation

    X_train, y_train = X[:idx_train_end], y[:idx_train_end]
    X_cal, y_cal = X[idx_train_end:idx_cal_end], y[idx_train_end:idx_cal_end]
    X_test, y_test = X[idx_cal_end:], y[idx_cal_end:]

    # 3. Train Base Meta-Model solely on Period 1
    base_model = TabularLogisticRegression(
        learning_rate=0.08,
        max_iter=1500,
        l2_reg=0.005,
        random_state=random_state
    )
    base_model.fit(X_train, y_train)

    # 4. Predict raw probabilities on separate Calibration partition (Period 2)
    raw_probs_cal = base_model.predict_proba(X_cal)[:, 1]

    # 5. Fit Platt Calibrator strictly on Calibration partition
    calibrator = PlattCalibrator(learning_rate=0.05, max_iter=1500, l2_reg=0.001)
    calibrator.fit(raw_probs_cal, y_cal)

    # 6. Out-of-Time Future Evaluation on Period 3 (Test Set)
    raw_probs_test = base_model.predict_proba(X_test)[:, 1]
    calibrated_probs_test = calibrator.calibrate(raw_probs_test)

    # 7. Comparative Metrics
    raw_brier = compute_brier_score(y_test, raw_probs_test)
    cal_brier = compute_brier_score(y_test, calibrated_probs_test)

    raw_log_loss = compute_log_loss(y_test, raw_probs_test)
    cal_log_loss = compute_log_loss(y_test, calibrated_probs_test)

    raw_curve = compute_calibration_curve(y_test, raw_probs_test, n_bins=5)
    cal_curve = compute_calibration_curve(y_test, calibrated_probs_test, n_bins=5)

    comparison_report = {
        "dataset_split": {
            "total_samples": num_samples,
            "train_samples": len(y_train),
            "calibration_samples": len(y_cal),
            "test_samples": len(y_test),
            "temporal_split_order": "Train -> Calibration -> Test (zero future leakage)"
        },
        "raw_vs_calibrated_metrics": {
            "raw_brier_score": round(raw_brier, 4),
            "calibrated_brier_score": round(cal_brier, 4),
            "brier_score_improvement": round(raw_brier - cal_brier, 4),
            "raw_log_loss": round(raw_log_loss, 4),
            "calibrated_log_loss": round(cal_log_loss, 4),
            "log_loss_improvement": round(raw_log_loss - cal_log_loss, 4),
            "raw_expected_calibration_error": raw_curve["expected_calibration_error"],
            "calibrated_expected_calibration_error": cal_curve["expected_calibration_error"]
        },
        "reliability_curve": {
            "raw": raw_curve,
            "calibrated": cal_curve
        }
    }

    # 8. Save Calibrator Artifact
    calibrator_path = os.path.join(calibrator_output_dir, "calibrator.joblib")
    joblib.dump(calibrator, calibrator_path)
    logger.info(f"Saved calibrator artifact to {calibrator_path}")

    # 9. Save Calibrator Metadata
    metadata = {
        "artifact_type": "ProbabilityCalibrator",
        "calibration_method": "PlattSigmoidScaling",
        "version": "1.0.0-platt",
        "trained_timestamp": datetime.now(timezone.utc).isoformat(),
        "parameters": {
            "slope_a": round(calibrator.a, 4),
            "intercept_b": round(calibrator.b, 4)
        },
        "evaluation_summary": comparison_report
    }

    metadata_path = os.path.join(calibrator_output_dir, "metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"Saved calibrator metadata to {metadata_path}")

    return {
        "calibrator_path": calibrator_path,
        "metadata_path": metadata_path,
        "calibrator": calibrator,
        "comparison_report": comparison_report
    }

if __name__ == "__main__":
    calibrator_dir = os.path.abspath(os.path.join(backend_root, "models_artifacts", "calibrator"))
    res = run_temporal_calibration_pipeline(calibrator_dir)
    print("=== Probability Calibration Completed Successfully ===")
    print("Calibrator Directory:", calibrator_dir)
    print("Parameters a (slope):", res["calibrator"].a, "| b (intercept):", res["calibrator"].b)
    print("\nComparison Summary:")
    print(json.dumps(res["comparison_report"]["raw_vs_calibrated_metrics"], indent=2))
