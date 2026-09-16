import os
import sys
import json
import random
import logging
import joblib
import numpy as np
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, List

# Ensure app package is importable
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from app.ml.tabular_model import TabularLogisticRegression, calculate_classification_metrics

logger = logging.getLogger(__name__)

META_MODEL_FEATURES = [
    "p1",
    "p2",
    "p3",
    "p4",
    "asset_criticality",
    "exposure_level",
    "incident_count",
    "severity_exploitation_conflict",
    "kev_epss_conflict",
    "threat_asset_exposure_conflict",
    "spread",
    "std"
]

def generate_training_dataset(num_samples: int = 3000, random_state: int = 42) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generates a deterministic synthetic threat dataset reflecting real-world vulnerability exploitation.
    Features: Core P1..P4, Organization Context, and Conflict Indicators.
    Target y: Binary ground truth indicating confirmed active exploitation.
    """
    rng = random.Random(random_state)

    rows: List[List[float]] = []
    targets: List[int] = []

    for _ in range(num_samples):
        # 1. Core Signals P1..P4
        p1 = round(min(1.0, max(0.0, rng.betavariate(5.0, 3.0))), 4)
        p2 = round(min(1.0, max(0.0, rng.betavariate(1.5, 4.0))), 4)
        is_kev = rng.random() < 0.22
        p3 = 0.95 if is_kev else 0.20
        # P4 covers critical initial access (0.75-0.90), execution (0.40-0.65), and discovery/default (0.10-0.25)
        p4 = rng.choice([0.10, 0.15, 0.18, 0.20, 0.25, 0.45, 0.50, 0.55, 0.60, 0.65, 0.75, 0.78, 0.82, 0.88, 0.90])

        # 2. Organization Context
        asset_criticality = round(rng.uniform(1.0, 10.0), 2)
        exposure_level = rng.choice([1.0, 0.5, 0.1])  # INTERNET_FACING, INTERNAL, ISOLATED
        incident_count = float(min(10, int(rng.expovariate(1.0 / 1.2))))

        # 3. Conflict Indicators
        severity_exp_conflict = 1.0 if ((p1 >= 0.70 and p2 <= 0.20) or (p1 <= 0.40 and p2 >= 0.60)) else 0.0
        kev_epss_conflict = 1.0 if ((p3 >= 0.80 and p2 <= 0.20) or (p3 <= 0.30 and p2 >= 0.80)) else 0.0
        
        threat_max = max(p2, p3)
        threat_exposure_conflict = 1.0 if (threat_max >= 0.70 and exposure_level == 0.1) else 0.0

        # Numerical Disagreement
        signals = [p1, p2, p3, p4]
        spread = round(max(signals) - min(signals), 4)
        mean = sum(signals) / 4.0
        std = round((sum((x - mean) ** 2 for x in signals) / 4.0) ** 0.5, 4)

        row = [
            p1,
            p2,
            p3,
            p4,
            asset_criticality,
            exposure_level,
            incident_count,
            severity_exp_conflict,
            kev_epss_conflict,
            threat_exposure_conflict,
            spread,
            std
        ]

        # Objective latent exploitation likelihood
        latent_score = (
            0.38 * p2
            + 0.42 * (p3 - 0.20) / 0.75
            + 0.10 * p1
            + 0.15 * (p4 - 0.15) / 0.75
            + 0.15 * exposure_level
            + 0.05 * min(incident_count, 5.0) / 5.0
            - 0.35 * threat_exposure_conflict
            - 0.08 * severity_exp_conflict
            + rng.gauss(0, 0.05)
        )

        prob = 1.0 / (1.0 + np.exp(-6.0 * (latent_score - 0.40)))
        y = 1 if (rng.random() < prob) else 0

        rows.append(row)
        targets.append(y)

    return np.array(rows, dtype=float), np.array(targets, dtype=int)

def train_and_save_meta_model(
    output_dir: str,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Trains a reproducible tabular Meta Model and saves the model artifact + metadata.json.
    """
    os.makedirs(output_dir, exist_ok=True)

    X, y = generate_training_dataset(num_samples=3000, random_state=random_state)
    
    # Input column validation
    assert X.shape[1] == len(META_MODEL_FEATURES), f"Expected {len(META_MODEL_FEATURES)} features, got {X.shape[1]}"

    # Deterministic train/test split (75% train, 25% test)
    rng = random.Random(random_state)
    indices = list(range(len(y)))
    rng.shuffle(indices)

    split_point = int(len(y) * 0.75)
    train_idx = indices[:split_point]
    test_idx = indices[split_point:]

    X_train, y_train = X[train_idx], y[train_idx]
    X_test, y_test = X[test_idx], y[test_idx]

    # Train model with standardized Adam optimization
    model = TabularLogisticRegression(
        learning_rate=0.05,
        max_iter=2500,
        l2_reg=0.001,
        random_state=random_state
    )
    model.fit(X_train, y_train)

    # Evaluate performance metrics
    y_prob = model.predict_proba(X_test)[:, 1]
    metrics = calculate_classification_metrics(y_test, y_prob)

    # Save model artifact
    model_path = os.path.join(output_dir, "model.joblib")
    joblib.dump(model, model_path)
    logger.info(f"Saved trained meta-model artifact to {model_path}")

    # Learned weights dictionary
    learned_weights = {
        feat: round(float(coef), 4) for feat, coef in zip(META_MODEL_FEATURES, model.coef_[0])
    }

    # Save metadata.json
    metadata = {
        "model_name": "Meta Model - Tabular Exploitability Predictor",
        "model_type": "TabularLogisticRegression",
        "version": "3.0.0-trainable",
        "trained_timestamp": datetime.now(timezone.utc).isoformat(),
        "random_state": random_state,
        "input_features": META_MODEL_FEATURES,
        "learned_coefficients": learned_weights,
        "intercept": round(float(model.intercept_[0]), 4),
        "output_type": "probability",
        "output_range": [0.0, 1.0],
        "performance_metrics": metrics
    }

    meta_path = os.path.join(output_dir, "metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"Saved meta-model metadata to {meta_path}")

    return {
        "model_path": model_path,
        "metadata_path": meta_path,
        "metrics": metrics,
        "features": META_MODEL_FEATURES
    }

if __name__ == "__main__":
    artifacts_meta_dir = os.path.abspath(os.path.join(backend_root, "models_artifacts", "meta_model"))
    res = train_and_save_meta_model(artifacts_meta_dir)
    print("=== Meta Model Trained and Saved Successfully ===")
    print("Artifact Directory:", artifacts_meta_dir)
    print("Metrics:", json.dumps(res["metrics"], indent=2))
