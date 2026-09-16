import random
import math
import numpy as np
from typing import Dict, Any, List

class TabularLogisticRegression:
    """
    Reproducible, scikit-learn compatible Tabular Logistic Regression Classifier.
    Pure implementation using Python standard library and core NumPy arrays.
    Provides standard estimator methods: fit, predict, predict_proba.
    """

    def __init__(
        self,
        learning_rate: float = 0.08,
        max_iter: int = 1200,
        l2_reg: float = 0.005,
        random_state: int = 42
    ):
        self.learning_rate = learning_rate
        self.max_iter = max_iter
        self.l2_reg = l2_reg
        self.random_state = random_state
        self.coef_ = None
        self.intercept_ = None
        self.classes_ = np.array([0, 1])

    @staticmethod
    def _sigmoid(z: np.ndarray) -> np.ndarray:
        z_clipped = np.clip(z, -30.0, 30.0)
        return 1.0 / (1.0 + np.exp(-z_clipped))

    def fit(self, X: np.ndarray, y: np.ndarray) -> "TabularLogisticRegression":
        """Fits model weights using standardized features and Adam optimization."""
        X_arr = np.asarray(X, dtype=float)
        y_arr = np.asarray(y, dtype=float)
        n_samples, n_features = X_arr.shape

        # Standardize features for stable multi-scale convergence
        mean = np.mean(X_arr, axis=0)
        scale = np.std(X_arr, axis=0)
        scale[scale == 0.0] = 1.0
        X_scaled = (X_arr - mean) / scale

        rng = random.Random(self.random_state)
        weights = np.array([rng.gauss(0, 0.01) for _ in range(n_features)], dtype=float)
        bias = 0.0

        # Adam optimizer state
        m_w = np.zeros(n_features)
        v_w = np.zeros(n_features)
        m_b = 0.0
        v_b = 0.0
        beta1, beta2, eps = 0.9, 0.999, 1e-8

        for t in range(1, self.max_iter + 1):
            linear_pred = np.dot(X_scaled, weights) + bias
            predictions = self._sigmoid(linear_pred)

            error = predictions - y_arr
            dw = (1.0 / n_samples) * np.dot(X_scaled.T, error) + (self.l2_reg * weights)
            db = (1.0 / n_samples) * np.sum(error)

            # Adam updates
            m_w = beta1 * m_w + (1.0 - beta1) * dw
            v_w = beta2 * v_w + (1.0 - beta2) * (dw ** 2)
            m_w_hat = m_w / (1.0 - beta1 ** t)
            v_w_hat = v_w / (1.0 - beta2 ** t)
            weights -= self.learning_rate * m_w_hat / (np.sqrt(v_w_hat) + eps)

            m_b = beta1 * m_b + (1.0 - beta1) * db
            v_b = beta2 * v_b + (1.0 - beta2) * (db ** 2)
            m_b_hat = m_b / (1.0 - beta1 ** t)
            v_b_hat = v_b / (1.0 - beta2 ** t)
            bias -= self.learning_rate * m_b_hat / (np.sqrt(v_b_hat) + eps)

        # Express parameters in raw feature space for standard dot(X, coef) inference
        raw_coef = weights / scale
        raw_intercept = bias - np.sum((weights * mean) / scale)

        self.coef_ = np.array([raw_coef])
        self.intercept_ = np.array([raw_intercept])
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Returns binary class probabilities [P(y=0), P(y=1)]."""
        if self.coef_ is None or self.intercept_ is None:
            raise ValueError("Model has not been fitted yet.")
        X_arr = np.asarray(X, dtype=float)
        linear_pred = np.dot(X_arr, self.coef_[0]) + self.intercept_[0]
        prob_1 = self._sigmoid(linear_pred)
        prob_0 = 1.0 - prob_1
        return np.column_stack([prob_0, prob_1])

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Returns binary predictions {0, 1}."""
        prob_1 = self.predict_proba(X)[:, 1]
        return (prob_1 >= 0.5).astype(int)


def calculate_classification_metrics(y_true: np.ndarray, y_prob: np.ndarray) -> Dict[str, float]:
    """Calculates standard classification and calibration metrics."""
    y_pred = (y_prob >= 0.5).astype(int)

    tp = int(np.sum((y_true == 1) & (y_pred == 1)))
    fp = int(np.sum((y_true == 0) & (y_pred == 1)))
    tn = int(np.sum((y_true == 0) & (y_pred == 0)))
    fn = int(np.sum((y_true == 1) & (y_pred == 0)))

    accuracy = (tp + tn) / max(1, len(y_true))
    precision = tp / max(1, (tp + fp))
    recall = tp / max(1, (tp + fn))
    f1 = 2.0 * (precision * recall) / max(1e-8, (precision + recall))
    brier_score = float(np.mean((y_prob - y_true) ** 2))

    # AUC calculation via rank statistics (Mann-Whitney U)
    n_pos = int(np.sum(y_true == 1))
    n_neg = int(np.sum(y_true == 0))
    if n_pos == 0 or n_neg == 0:
        roc_auc = 0.5
    else:
        ranks = np.argsort(np.argsort(y_prob)) + 1
        pos_rank_sum = float(np.sum(ranks[y_true == 1]))
        roc_auc = (pos_rank_sum - (n_pos * (n_pos + 1)) / 2.0) / (n_pos * n_neg)

    return {
        "accuracy": round(float(accuracy), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1), 4),
        "roc_auc": round(float(roc_auc), 4),
        "brier_score": round(float(brier_score), 4)
    }
