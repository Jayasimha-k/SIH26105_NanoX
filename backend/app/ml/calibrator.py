import os
import json
import logging
import joblib
import numpy as np
from typing import Dict, Any, Tuple, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class PlattCalibrator:
    """
    Sigmoid / Platt Probability Calibrator.
    Maps raw model output scores/probabilities into empirical calibrated probabilities:
    P(y=1 | s) = 1 / (1 + exp(-(a * s + b)))
    """

    def __init__(self, learning_rate: float = 0.05, max_iter: int = 1500, l2_reg: float = 0.001):
        self.learning_rate = learning_rate
        self.max_iter = max_iter
        self.l2_reg = l2_reg
        self.a: float = 1.0  # slope
        self.b: float = 0.0  # intercept
        self.is_fitted: bool = False

    @staticmethod
    def _sigmoid(z: np.ndarray) -> np.ndarray:
        z_clipped = np.clip(z, -30.0, 30.0)
        return 1.0 / (1.0 + np.exp(-z_clipped))

    def fit(self, raw_scores: np.ndarray, y_true: np.ndarray) -> "PlattCalibrator":
        """
        Fits the calibration parameters (a, b) on separate calibration data.
        Uses Platt's smoothed target formulation to avoid overconfidence.
        """
        s = np.asarray(raw_scores, dtype=float).flatten()
        y = np.asarray(y_true, dtype=float).flatten()

        n_samples = len(y)
        if n_samples == 0:
            raise ValueError("Empty calibration dataset provided.")

        # Platt target regularizer (Platt 1999) to prevent extreme logit divergence
        n_pos = np.sum(y == 1)
        n_neg = np.sum(y == 0)
        t_pos = (n_pos + 1.0) / (n_pos + 2.0)
        t_neg = 1.0 / (n_neg + 2.0)
        targets = np.where(y == 1, t_pos, t_neg)

        # Gradient descent optimization
        a = 1.0
        b = 0.0

        for _ in range(self.max_iter):
            z = a * s + b
            p = self._sigmoid(z)
            err = p - targets

            grad_a = (1.0 / n_samples) * np.sum(err * s) + (self.l2_reg * a)
            grad_b = (1.0 / n_samples) * np.sum(err)

            a -= self.learning_rate * grad_a
            b -= self.learning_rate * grad_b

        self.a = float(a)
        self.b = float(b)
        self.is_fitted = True
        return self

    def calibrate(self, raw_scores: np.ndarray) -> np.ndarray:
        """Applies fitted Platt calibration to raw probabilities/scores."""
        if not self.is_fitted:
            # If unfitted, identity pass-through
            return np.clip(np.asarray(raw_scores, dtype=float), 0.0, 1.0)
        
        s = np.asarray(raw_scores, dtype=float)
        z = self.a * s + self.b
        calibrated = self._sigmoid(z)
        return np.clip(calibrated, 0.0, 1.0)


def compute_calibration_curve(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    n_bins: int = 5
) -> Dict[str, Any]:
    """
    Computes reliability curve points and Expected Calibration Error (ECE).
    """
    y_true = np.asarray(y_true, dtype=int).flatten()
    y_prob = np.asarray(y_prob, dtype=float).flatten()
    n_samples = len(y_true)

    bin_edges = np.linspace(0.0, 1.0, n_bins + 1)
    bin_centers = []
    empirical_probs = []
    bin_counts = []
    ece = 0.0

    for i in range(n_bins):
        low, high = bin_edges[i], bin_edges[i + 1]
        if i == n_bins - 1:
            mask = (y_prob >= low) & (y_prob <= high)
        else:
            mask = (y_prob >= low) & (y_prob < high)

        count = int(np.sum(mask))
        if count > 0:
            mean_pred = float(np.mean(y_prob[mask]))
            true_fraction = float(np.mean(y_true[mask]))
            bin_centers.append(round(mean_pred, 4))
            empirical_probs.append(round(true_fraction, 4))
            bin_counts.append(count)
            ece += (count / n_samples) * abs(true_fraction - mean_pred)
        else:
            bin_centers.append(round((low + high) / 2.0, 4))
            empirical_probs.append(0.0)
            bin_counts.append(0)

    return {
        "bin_pred_means": bin_centers,
        "bin_true_fractions": empirical_probs,
        "bin_counts": bin_counts,
        "expected_calibration_error": round(float(ece), 4)
    }


def compute_log_loss(y_true: np.ndarray, y_prob: np.ndarray, eps: float = 1e-15) -> float:
    """Computes binary cross-entropy (log loss)."""
    y_true = np.asarray(y_true, dtype=float).flatten()
    y_prob = np.clip(np.asarray(y_prob, dtype=float).flatten(), eps, 1.0 - eps)
    loss = -np.mean(y_true * np.log(y_prob) + (1.0 - y_true) * np.log(1.0 - y_prob))
    return float(loss)


def compute_brier_score(y_true: np.ndarray, y_prob: np.ndarray) -> float:
    """Computes mean squared Brier score."""
    y_true = np.asarray(y_true, dtype=float).flatten()
    y_prob = np.asarray(y_prob, dtype=float).flatten()
    return float(np.mean((y_prob - y_true) ** 2))
