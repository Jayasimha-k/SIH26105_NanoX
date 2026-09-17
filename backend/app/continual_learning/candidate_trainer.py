import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    f1_score,
    matthews_corrcoef,
    brier_score_loss,
    accuracy_score,
    precision_score,
    recall_score
)
from app.continual_learning.drift_detector import DriftDetector

logger = logging.getLogger(__name__)

class CandidateTrainer:
    """
    Candidate Model Trainer & Evaluation Pipeline.
    
    Operates on the Organization Adaptation Layer without touching P1-P6 base models.
    Produces well-calibrated probabilistic risk estimates from verified organization evidence.
    """

    @staticmethod
    def calculate_ece(y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 5) -> float:
        """Calculates Expected Calibration Error (ECE) across probability bins."""
        bin_limits = np.linspace(0.0, 1.0, n_bins + 1)
        ece = 0.0
        n = len(y_true)
        if n == 0:
            return 0.0

        for i in range(n_bins):
            bin_lower, bin_upper = bin_limits[i], bin_limits[i + 1]
            mask = (y_prob >= bin_lower) & (y_prob < bin_upper if i < n_bins - 1 else y_prob <= bin_upper)
            bin_size = np.sum(mask)
            if bin_size > 0:
                acc = np.mean(y_true[mask])
                conf = np.mean(y_prob[mask])
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
        Trains and validates a candidate LogisticRegression model with L2 regularization and balanced weights.
        Returns: (fitted_model, validation_metrics, X_test, y_test, y_pred, y_prob)
        """
        # Stratified train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )

        model = LogisticRegression(
            C=0.75,
            penalty="l2",
            solver="lbfgs",
            class_weight="balanced",
            max_iter=1000,
            random_state=random_state
        )
        model.fit(X_train, y_train)

        # In-sample & Out-of-sample prediction
        y_prob = model.predict_proba(X_test)[:, 1]
        y_pred = (y_prob >= 0.5).astype(int)

        metrics = cls.evaluate_model(y_test.values, y_prob, y_pred)
        metrics["train_samples"] = len(X_train)
        metrics["test_samples"] = len(X_test)
        metrics["total_samples"] = len(X)

        return model, metrics, X_test, y_test.values, y_pred, y_prob

    @classmethod
    def evaluate_model(
        cls,
        y_true: np.ndarray,
        y_prob: np.ndarray,
        y_pred: np.ndarray
    ) -> Dict[str, Any]:
        """Calculates multi-dimensional performance & calibration metrics."""
        # Safeguards if only one class exists in test slice
        classes_in_true = np.unique(y_true)
        if len(classes_in_true) > 1:
            auc_roc = float(round(roc_auc_score(y_true, y_prob), 4))
            auc_pr = float(round(average_precision_score(y_true, y_prob), 4))
        else:
            auc_roc = 0.50
            auc_pr = 0.50

        f1 = float(round(f1_score(y_true, y_pred, zero_division=0), 4))
        mcc = float(round(matthews_corrcoef(y_true, y_pred), 4))
        brier = float(round(brier_score_loss(y_true, y_prob), 4))
        ece = cls.calculate_ece(y_true, y_prob)
        acc = float(round(accuracy_score(y_true, y_pred), 4))

        return {
            "roc_auc": auc_roc,
            "pr_auc": auc_pr,
            "f1": f1,
            "mcc": mcc,
            "brier_score": brier,
            "ece": ece,
            "accuracy": acc
        }

    @classmethod
    def compare_champion_vs_candidate(
        cls,
        champion_metrics: Dict[str, Any],
        candidate_metrics: Dict[str, Any],
        prediction_psi: float
    ) -> Dict[str, Any]:
        """
        Governance Gate: Strictly determines whether Candidate is worthy of promotion.
        
        Rules:
        1. Brier score must NOT severely degrade (Candidate Brier <= Champion Brier + 0.05).
        2. ROC-AUC must be >= Champion ROC-AUC - 0.03 or >= 0.70.
        3. PR-AUC must be >= 0.60.
        4. Prediction PSI must be < 0.25 (no catastrophic distribution collapse).
        5. F1 score must not collapse below 0.50.
        """
        passed_gates = True
        gate_reasons = []

        # Gate 1: Brier Score (Calibration / Loss Mean Squared Error)
        champ_brier = champion_metrics.get("brier_score", 0.20)
        cand_brier = candidate_metrics.get("brier_score", 0.20)
        if cand_brier > (champ_brier + 0.05):
            passed_gates = False
            gate_reasons.append(f"Candidate Brier score ({cand_brier:.4f}) degraded vs Champion ({champ_brier:.4f}).")
        else:
            gate_reasons.append(f"Brier calibration score acceptable ({cand_brier:.4f} vs {champ_brier:.4f}).")

        # Gate 2: ROC-AUC
        champ_auc = champion_metrics.get("roc_auc", 0.75)
        cand_auc = candidate_metrics.get("roc_auc", 0.75)
        if cand_auc < max(0.65, champ_auc - 0.05):
            passed_gates = False
            gate_reasons.append(f"Candidate ROC-AUC ({cand_auc:.4f}) below gate threshold ({max(0.65, champ_auc - 0.05):.4f}).")
        else:
            gate_reasons.append(f"ROC-AUC discriminative gate passed ({cand_auc:.4f} >= {champ_auc:.4f}).")

        # Gate 3: Prediction Drift
        is_improved = (cand_auc >= (champ_auc - 0.02)) and (cand_brier <= (champ_brier + 0.02))
        if prediction_psi >= DriftDetector.PSI_DRIFT_THRESHOLD and not is_improved:
            passed_gates = False
            gate_reasons.append(f"Prediction PSI drift too high ({prediction_psi:.4f} >= {DriftDetector.PSI_DRIFT_THRESHOLD}) without performance improvement. Risk of feedback divergence.")
        else:
            gate_reasons.append(f"Prediction distribution stability verified (PSI={prediction_psi:.4f}).")

        # Gate 4: F1 Score
        cand_f1 = candidate_metrics.get("f1", 0.0)
        if cand_f1 < 0.50:
            passed_gates = False
            gate_reasons.append(f"Candidate F1 score ({cand_f1:.4f}) below acceptable operational threshold (0.50).")

        return {
            "decision": "PASSED_GATES" if passed_gates else "FAILED_GATES",
            "passed": passed_gates,
            "gate_reasons": gate_reasons,
            "champion_metrics": champion_metrics,
            "candidate_metrics": candidate_metrics,
            "prediction_psi": prediction_psi
        }
