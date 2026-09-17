import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)

class DriftDetector:
    """
    Population Stability Index (PSI) Drift Monitoring Engine.
    
    Evaluates:
    - Input feature distribution drift
    - Model prediction distribution drift
    - Confirmed outcome rate shifts
    
    Thresholds:
    - PSI < 0.10: STABLE (No significant distribution shift)
    - 0.10 <= PSI < 0.25: MONITOR (Moderate shift, review telemetry)
    - PSI >= 0.25: LEARNING_RECOMMENDED (Significant shift, retrain candidate)
    """

    DEFAULT_BINS = 10
    EPSILON = 1e-4

    PSI_STABLE_THRESHOLD = 0.10
    PSI_DRIFT_THRESHOLD = 0.25

    @classmethod
    def calculate_psi(
        cls,
        expected: np.ndarray,
        actual: np.ndarray,
        num_bins: int = DEFAULT_BINS
    ) -> float:
        """
        Computes Population Stability Index between reference (expected) and current (actual) arrays.
        Uses quantile-based binning from reference (expected) distribution with Laplace smoothing.
        """
        expected = np.asarray(expected, dtype=float)
        actual = np.asarray(actual, dtype=float)

        expected = expected[~np.isnan(expected)]
        actual = actual[~np.isnan(actual)]

        if len(expected) == 0 or len(actual) == 0:
            return 0.0

        min_val = min(np.min(expected), np.min(actual))
        max_val = max(np.max(expected), np.max(actual))

        if min_val == max_val:
            return 0.0

        # Adaptive bins based on sample size to prevent empty bin blowout
        n_min = min(len(expected), len(actual))
        effective_bins = max(2, min(num_bins, max(2, n_min // 5)))

        # Quantile-based bin edges from reference (expected) distribution
        quantiles = np.linspace(0, 100, effective_bins + 1)
        bins = np.unique(np.percentile(expected, quantiles))
        if len(bins) < 3:
            # Fallback to uniform bins if unique values are very few (e.g. binary indicators)
            bins = np.linspace(min_val, max_val, effective_bins + 1)

        # Ensure full domain coverage
        bins[0] = min(bins[0], min_val) - 1e-6
        bins[-1] = max(bins[-1], max_val) + 1e-6

        expected_counts, _ = np.histogram(expected, bins=bins)
        actual_counts, _ = np.histogram(actual, bins=bins)

        k = len(expected_counts)
        # Standard Laplace smoothing for empirical bin distributions
        expected_pct = (expected_counts + 0.5) / (len(expected) + 0.5 * k)
        actual_pct = (actual_counts + 0.5) / (len(actual) + 0.5 * k)

        psi_val = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
        return float(round(max(0.0, psi_val), 4))

    @classmethod
    def evaluate_dataset_drift(
        cls,
        reference_df: pd.DataFrame,
        current_df: pd.DataFrame,
        feature_columns: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Evaluates PSI across all input features between reference and current evidence datasets.
        """
        cols = feature_columns or [c for c in reference_df.columns if c in current_df.columns]
        feature_psi = {}
        high_drift_features = []
        moderate_drift_features = []

        for col in cols:
            if col not in reference_df or col not in current_df:
                continue
            ref_vals = reference_df[col].values
            curr_vals = current_df[col].values

            psi = cls.calculate_psi(ref_vals, curr_vals)
            feature_psi[col] = psi

            if psi >= cls.PSI_DRIFT_THRESHOLD:
                high_drift_features.append(col)
            elif psi >= cls.PSI_STABLE_THRESHOLD:
                moderate_drift_features.append(col)

        mean_psi = float(round(np.mean(list(feature_psi.values())), 4)) if feature_psi else 0.0
        max_psi = float(round(np.max(list(feature_psi.values())), 4)) if feature_psi else 0.0

        if high_drift_features or mean_psi >= cls.PSI_DRIFT_THRESHOLD:
            overall_status = "LEARNING_RECOMMENDED"
            action_recommendation = f"Significant feature drift detected on {len(high_drift_features)} features ({', '.join(high_drift_features[:3])}). Candidate model training recommended."
        elif moderate_drift_features or mean_psi >= cls.PSI_STABLE_THRESHOLD:
            overall_status = "MONITOR"
            action_recommendation = f"Moderate distribution shift on {len(moderate_drift_features)} features. Monitor telemetry before retraining."
        else:
            overall_status = "STABLE"
            action_recommendation = "Feature distributions are stable relative to baseline reference."

        return {
            "overall_status": overall_status,
            "mean_psi": mean_psi,
            "max_psi": max_psi,
            "feature_psi": feature_psi,
            "high_drift_features": high_drift_features,
            "moderate_drift_features": moderate_drift_features,
            "action_recommendation": action_recommendation,
            "reference_sample_count": len(reference_df),
            "current_sample_count": len(current_df)
        }

    @classmethod
    def evaluate_prediction_drift(
        cls,
        champion_predictions: np.ndarray,
        candidate_predictions: np.ndarray
    ) -> Dict[str, Any]:
        """
        Evaluates prediction distribution drift between Champion and Candidate models.
        A very high prediction PSI (e.g. > 0.35) can signal catastrophic model divergence.
        """
        psi = cls.calculate_psi(champion_predictions, candidate_predictions)
        
        if psi >= cls.PSI_DRIFT_THRESHOLD:
            status = "DIVERGENT"
            safe_to_promote = False
            msg = f"Candidate prediction distribution strongly diverges (PSI={psi:.4f} >= {cls.PSI_DRIFT_THRESHOLD})."
        elif psi >= cls.PSI_STABLE_THRESHOLD:
            status = "MODERATE_SHIFT"
            safe_to_promote = True
            msg = f"Candidate shows acceptable adaptation shift (PSI={psi:.4f})."
        else:
            status = "CONSERVATIVE_MATCH"
            safe_to_promote = True
            msg = f"Candidate closely aligns with current predictions (PSI={psi:.4f})."

        return {
            "prediction_psi": psi,
            "status": status,
            "safe_to_promote": safe_to_promote,
            "message": msg
        }
