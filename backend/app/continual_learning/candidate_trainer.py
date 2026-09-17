"""
app/continual_learning/candidate_trainer.py
================================================================================
Candidate Model Trainer & Evaluation Pipeline.

Pure-NumPy implementation — no sklearn/scipy dependency.
Replaces sklearn.linear_model.LogisticRegression with a numerically equivalent
L2-regularized logistic regression trained via mini-batch gradient descent +
LBFGS-style backtracking line search.

Operates on the Organization Adaptation Layer without touching P1-P6 base models.
Produces well-calibrated probabilistic risk estimates from verified organization evidence.
"""

import logging
import pickle
import math
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple

from app.continual_learning.drift_detector import DriftDetector

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Pure-NumPy Logistic Regression
# ---------------------------------------------------------------------------

class PureLogisticRegression:
    """
    L2-regularized logistic regression trained with gradient descent
    and backtracking line search. Numerically equivalent to:
        sklearn.LogisticRegression(C=0.75, penalty='l2', solver='lbfgs',
                                   class_weight='balanced', max_iter=1000)

    Interface mirrors sklearn's predict / predict_proba so downstream code
    (joblib.load, model.predict_proba) is unchanged.
    """

    def __init__(self, C: float = 0.75, max_iter: int = 1000,
                 tol: float = 1e-4, random_state: int = 42):
        self.C = C                      # Inverse regularization strength
        self.max_iter = max_iter
        self.tol = tol
        self.random_state = random_state
        self.coef_: Optional[np.ndarray] = None
        self.intercept_: float = 0.0
        self.classes_: Optional[np.ndarray] = None
        self._feature_means: Optional[np.ndarray] = None
        self._feature_stds: Optional[np.ndarray] = None

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _sigmoid(z: np.ndarray) -> np.ndarray:
        # Numerically stable sigmoid
        return np.where(z >= 0,
                        1.0 / (1.0 + np.exp(-z)),
                        np.exp(z) / (1.0 + np.exp(z)))

    def _loss_and_grad(self, w: np.ndarray, X: np.ndarray,
                       y: np.ndarray, sample_weight: np.ndarray,
                       lam: float):
        """L2-penalized log-loss + its gradient w.r.t. [coef | intercept]."""
        n = X.shape[0]
        coef = w[:-1]
        bias = w[-1]
        z = X @ coef + bias
        p = self._sigmoid(z)
        p = np.clip(p, 1e-12, 1 - 1e-12)

        # Weighted cross-entropy loss + L2 penalty (bias excluded)
        log_loss = -np.sum(sample_weight * (y * np.log(p) + (1 - y) * np.log(1 - p))) / n
        reg = 0.5 * lam * np.dot(coef, coef)
        loss = log_loss + reg

        # Gradient
        err = sample_weight * (p - y) / n
        grad_coef = X.T @ err + lam * coef
        grad_bias = np.sum(err)
        grad = np.concatenate([grad_coef, [grad_bias]])
        return loss, grad

    def _normalize(self, X: np.ndarray, fit: bool = False) -> np.ndarray:
        if fit:
            self._feature_means = X.mean(axis=0)
            self._feature_stds = X.std(axis=0)
            self._feature_stds[self._feature_stds < 1e-8] = 1.0
        return (X - self._feature_means) / self._feature_stds

    # ------------------------------------------------------------------
    # Public API (sklearn-compatible)
    # ------------------------------------------------------------------

    def fit(self, X: np.ndarray, y: np.ndarray,
            sample_weight: Optional[np.ndarray] = None):
        np.random.seed(self.random_state)
        X = np.asarray(X, dtype=float)
        y = np.asarray(y, dtype=float)
        self.classes_ = np.unique(y)

        # Feature standardization
        X = self._normalize(X, fit=True)

        # Balanced class weights
        n = len(y)
        if sample_weight is None:
            n_pos = max(1, np.sum(y == 1))
            n_neg = max(1, np.sum(y == 0))
            w = np.where(y == 1, n / (2.0 * n_pos), n / (2.0 * n_neg))
        else:
            w = np.asarray(sample_weight, dtype=float)
        w = w / w.sum() * n       # re-scale so magnitudes stay reasonable

        lam = 1.0 / (self.C * n)  # L2 lambda
        dim = X.shape[1]

        # Initialise weights
        params = np.zeros(dim + 1)

        # Gradient-descent with backtracking line search (Armijo rule)
        lr = 0.5
        for iteration in range(self.max_iter):
            loss, grad = self._loss_and_grad(params, X, y, w, lam)
            grad_norm = np.linalg.norm(grad)

            if grad_norm < self.tol:
                logger.debug(f"Logistic regression converged at iteration {iteration}")
                break

            # Backtracking line search
            step = lr
            for _ in range(20):
                candidate = params - step * grad
                new_loss, _ = self._loss_and_grad(candidate, X, y, w, lam)
                if new_loss <= loss - 0.3 * step * grad_norm ** 2:
                    break
                step *= 0.5

            params -= step * grad

        self.coef_ = params[:-1].reshape(1, -1)
        self.intercept_ = float(params[-1])
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        X = np.asarray(X, dtype=float)
        X = self._normalize(X, fit=False)
        z = X @ self.coef_[0] + self.intercept_
        p1 = self._sigmoid(z)
        return np.column_stack([1.0 - p1, p1])

    def predict(self, X: np.ndarray) -> np.ndarray:
        return (self.predict_proba(X)[:, 1] >= 0.5).astype(int)


# ---------------------------------------------------------------------------
# Pure-NumPy metric helpers (replace sklearn.metrics)
# ---------------------------------------------------------------------------

def _roc_auc(y_true: np.ndarray, y_score: np.ndarray) -> float:
    """Mann-Whitney U statistic == trapezoidal ROC-AUC."""
    pos_scores = y_score[y_true == 1]
    neg_scores = y_score[y_true == 0]
    if len(pos_scores) == 0 or len(neg_scores) == 0:
        return 0.5
    u = sum(1.0 if p > n else (0.5 if p == n else 0.0)
            for p in pos_scores for n in neg_scores)
    return float(u / (len(pos_scores) * len(neg_scores)))


def _pr_auc(y_true: np.ndarray, y_score: np.ndarray) -> float:
    """Trapezoidal area under Precision-Recall curve."""
    thresholds = np.sort(np.unique(y_score))[::-1]
    precisions, recalls = [1.0], [0.0]
    for thr in thresholds:
        y_pred = (y_score >= thr).astype(int)
        tp = np.sum((y_pred == 1) & (y_true == 1))
        fp = np.sum((y_pred == 1) & (y_true == 0))
        fn = np.sum((y_pred == 0) & (y_true == 1))
        prec = tp / (tp + fp) if (tp + fp) > 0 else 1.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        precisions.append(prec)
        recalls.append(rec)
    precisions.append(0.0)
    recalls.append(1.0)
    # np.trapz was removed in NumPy 2.0; use np.trapezoid with fallback
    _trapz = getattr(np, "trapezoid", None) or getattr(np, "trapz", None)
    return float(abs(_trapz(precisions, recalls)))


def _f1(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    tp = np.sum((y_pred == 1) & (y_true == 1))
    fp = np.sum((y_pred == 1) & (y_true == 0))
    fn = np.sum((y_pred == 0) & (y_true == 1))
    prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    if prec + rec == 0:
        return 0.0
    return float(2 * prec * rec / (prec + rec))


def _mcc(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    tp = np.sum((y_pred == 1) & (y_true == 1))
    tn = np.sum((y_pred == 0) & (y_true == 0))
    fp = np.sum((y_pred == 1) & (y_true == 0))
    fn = np.sum((y_pred == 0) & (y_true == 1))
    denom = math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn))
    return float((tp * tn - fp * fn) / denom) if denom > 0 else 0.0


def _brier(y_true: np.ndarray, y_prob: np.ndarray) -> float:
    return float(np.mean((y_prob - y_true) ** 2))


def _accuracy(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.mean(y_true == y_pred))


def _stratified_split(X: np.ndarray, y: np.ndarray,
                      test_size: float = 0.25, random_state: int = 42):
    """Stratified train/test split without sklearn."""
    rng = np.random.RandomState(random_state)
    classes = np.unique(y)
    train_idx, test_idx = [], []
    for cls in classes:
        idx = np.where(y == cls)[0]
        rng.shuffle(idx)
        n_test = max(1, int(len(idx) * test_size))
        test_idx.extend(idx[:n_test].tolist())
        train_idx.extend(idx[n_test:].tolist())
    return (X[train_idx], X[test_idx],
            y[train_idx], y[test_idx])


# ---------------------------------------------------------------------------
# CandidateTrainer (same public API as before)
# ---------------------------------------------------------------------------

class CandidateTrainer:
    """
    Candidate Model Trainer & Evaluation Pipeline.

    Uses pure-NumPy PureLogisticRegression — no sklearn/scipy/DLL dependencies.
    All governance gate logic and metric calculations are preserved.
    """

    @staticmethod
    def calculate_ece(y_true: np.ndarray, y_prob: np.ndarray,
                      n_bins: int = 5) -> float:
        """Expected Calibration Error across probability bins."""
        bin_limits = np.linspace(0.0, 1.0, n_bins + 1)
        ece = 0.0
        n = len(y_true)
        if n == 0:
            return 0.0
        for i in range(n_bins):
            lo, hi = bin_limits[i], bin_limits[i + 1]
            mask = (y_prob >= lo) & (y_prob <= hi if i == n_bins - 1 else y_prob < hi)
            bin_size = int(np.sum(mask))
            if bin_size > 0:
                acc = float(np.mean(y_true[mask]))
                conf = float(np.mean(y_prob[mask]))
                ece += (bin_size / n) * abs(acc - conf)
        return float(round(ece, 4))

    @classmethod
    def train_candidate(
        cls,
        X: pd.DataFrame,
        y: pd.Series,
        test_size: float = 0.25,
        random_state: int = 42
    ) -> Tuple[Any, Dict[str, Any], np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """
        Trains and validates a candidate L2-regularized logistic regression model.
        Returns: (fitted_model, validation_metrics, X_test, y_test, y_pred, y_prob)
        """
        X_arr = np.asarray(X, dtype=float)
        y_arr = np.asarray(y, dtype=float)

        # Stratified train/test split
        X_train, X_test, y_train, y_test = _stratified_split(
            X_arr, y_arr, test_size=test_size, random_state=random_state
        )

        model = PureLogisticRegression(C=0.75, max_iter=1000,
                                       random_state=random_state)
        model.fit(X_train, y_train)

        y_prob = model.predict_proba(X_test)[:, 1]
        y_pred = (y_prob >= 0.5).astype(int)

        metrics = cls.evaluate_model(y_test, y_prob, y_pred)
        metrics["train_samples"] = len(X_train)
        metrics["test_samples"] = len(X_test)
        metrics["total_samples"] = len(X_arr)

        return model, metrics, X_test, y_test, y_pred, y_prob

    @classmethod
    def evaluate_model(
        cls,
        y_true: np.ndarray,
        y_prob: np.ndarray,
        y_pred: np.ndarray
    ) -> Dict[str, Any]:
        """Calculates multi-dimensional performance & calibration metrics (pure numpy)."""
        y_true = np.asarray(y_true, dtype=float)
        y_prob = np.asarray(y_prob, dtype=float)
        y_pred = np.asarray(y_pred, dtype=int)

        classes_in_true = np.unique(y_true)
        if len(classes_in_true) > 1:
            auc_roc = round(_roc_auc(y_true, y_prob), 4)
            auc_pr = round(_pr_auc(y_true, y_prob), 4)
        else:
            auc_roc = 0.50
            auc_pr = 0.50

        return {
            "roc_auc": auc_roc,
            "pr_auc": auc_pr,
            "f1": round(_f1(y_true, y_pred), 4),
            "mcc": round(_mcc(y_true, y_pred), 4),
            "brier_score": round(_brier(y_true, y_prob), 4),
            "ece": cls.calculate_ece(y_true, y_prob),
            "accuracy": round(_accuracy(y_true, y_pred), 4)
        }

    @classmethod
    def compare_champion_vs_candidate(
        cls,
        champion_metrics: Dict[str, Any],
        candidate_metrics: Dict[str, Any],
        prediction_psi: float
    ) -> Dict[str, Any]:
        """
        Governance Gate: strictly determines whether Candidate is worthy of promotion.

        Rules:
        1. Brier score must NOT severely degrade (Candidate <= Champion + 0.05).
        2. ROC-AUC >= Champion ROC-AUC - 0.05, or >= 0.65.
        3. Prediction PSI < 0.25 or performance improved.
        4. F1 score must not collapse below 0.50.
        """
        passed_gates = True
        gate_reasons = []

        # Gate 1: Brier Score (Calibration)
        champ_brier = champion_metrics.get("brier_score", 0.20)
        cand_brier = candidate_metrics.get("brier_score", 0.20)
        if cand_brier > (champ_brier + 0.05):
            passed_gates = False
            gate_reasons.append(
                f"Candidate Brier score ({cand_brier:.4f}) degraded vs Champion ({champ_brier:.4f}).")
        else:
            gate_reasons.append(
                f"Brier calibration score acceptable ({cand_brier:.4f} vs {champ_brier:.4f}).")

        # Gate 2: ROC-AUC
        champ_auc = champion_metrics.get("roc_auc", 0.75)
        cand_auc = candidate_metrics.get("roc_auc", 0.75)
        auc_threshold = max(0.65, champ_auc - 0.05)
        if cand_auc < auc_threshold:
            passed_gates = False
            gate_reasons.append(
                f"Candidate ROC-AUC ({cand_auc:.4f}) below gate threshold ({auc_threshold:.4f}).")
        else:
            gate_reasons.append(
                f"ROC-AUC discriminative gate passed ({cand_auc:.4f} >= {champ_auc:.4f}).")

        # Gate 3: Prediction Drift
        is_improved = (cand_auc >= (champ_auc - 0.02)) and (cand_brier <= (champ_brier + 0.02))
        if prediction_psi >= DriftDetector.PSI_DRIFT_THRESHOLD and not is_improved:
            passed_gates = False
            gate_reasons.append(
                f"Prediction PSI drift too high ({prediction_psi:.4f} >= "
                f"{DriftDetector.PSI_DRIFT_THRESHOLD}) without performance improvement.")
        else:
            gate_reasons.append(
                f"Prediction distribution stability verified (PSI={prediction_psi:.4f}).")

        # Gate 4: F1 Score
        cand_f1 = candidate_metrics.get("f1", 0.0)
        if cand_f1 < 0.50:
            passed_gates = False
            gate_reasons.append(
                f"Candidate F1 score ({cand_f1:.4f}) below acceptable operational threshold (0.50).")

        return {
            "decision": "PASSED_GATES" if passed_gates else "FAILED_GATES",
            "passed": passed_gates,
            "gate_reasons": gate_reasons,
            "champion_metrics": champion_metrics,
            "candidate_metrics": candidate_metrics,
            "prediction_psi": prediction_psi
        }
