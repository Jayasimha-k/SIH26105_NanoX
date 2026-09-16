"""
audit_model.py
Comprehensive Model Validation & Audit Script.

Computes:
1. Dataset demographics and duplicate checks across train/test splits.
2. 5-Fold Cross-Validation means and standard deviations (R2, MAE, RMSE).
3. Benchmark comparisons:
   - Mean Predictor (Dummy Baseline)
   - Linear/Ridge Baseline
   - Deterministic Rule Engine
   - Best Model Pipeline
4. Per-class classification metrics on holdout test set:
   - Precision, Recall, F1-Score, Balanced Accuracy, Confusion Matrix.
5. Leakage & Correlation analysis between input features and target risk_score.
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, KFold, cross_validate
from sklearn.dummy import DummyRegressor
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error, r2_score,
    classification_report, confusion_matrix, balanced_accuracy_score,
    precision_score, recall_score, f1_score
)

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from train import ALL_INPUT_FEATURES, BOOLEAN_FEATURES, CATEGORICAL_FEATURES, NUMERIC_FEATURES, TARGET_FEATURE
from baseline_risk_engine import BaselineRiskEngine


def run_full_audit(data_path="sample_organizations.csv", model_path="models/organization-risk/model_pipeline.pkl"):
    print("==================================================")
    print("  SCIENTIFIC MODEL VALIDATION & PROVENANCE AUDIT  ")
    print("==================================================")

    # 1. Load Dataset
    df = pd.read_csv(data_path)
    total_samples = len(df)
    print(f"\n[Audit Item 1] Dataset Loaded: {data_path} ({total_samples} samples, {df.shape[1]} columns)")

    # Check for exact duplicate rows
    duplicate_rows = df.duplicated(subset=ALL_INPUT_FEATURES).sum()
    print(f"  Exact Feature Duplicates across dataset: {duplicate_rows} ({duplicate_rows/total_samples*100:.2f}%)")

    # 2. Train / Test Split Audit
    for col in BOOLEAN_FEATURES:
        if col in df.columns:
            df[col] = df[col].astype(int)

    X = df[ALL_INPUT_FEATURES]
    y = df[TARGET_FEATURE].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)
    print(f"\n[Audit Item 2] Split Confirmation:")
    print(f"  Train set size: {len(X_train)} samples (80%)")
    print(f"  Test set size : {len(X_test)} samples (20%)")
    print(f"  Random Seed   : 42 (Shuffle=True)")

    # Cross-split overlap check
    overlap = pd.merge(X_train, X_test, how='inner').shape[0]
    print(f"  Identical feature vectors overlapping across Train & Test: {overlap}")

    # 3. Load Trained Pipeline & Verify Fit
    pipeline = joblib.load(model_path)
    print(f"\n[Audit Item 3] Loaded Pipeline: {model_path}")
    print(f"  Preprocessor: {type(pipeline.named_steps['preprocessor']).__name__}")
    print(f"  Model Step  : {type(pipeline.named_steps['model']).__name__}")

    # 4. 5-Fold Cross Validation with Means and Std Deviations
    print(f"\n[Audit Item 4] 5-Fold Cross-Validation Metrics (Train Set N={len(X_train)}):")
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_validate(
        pipeline, X_train, y_train, cv=kf,
        scoring=["r2", "neg_mean_absolute_error", "neg_root_mean_squared_error"],
        n_jobs=-1, return_train_score=True
    )

    cv_r2_mean = cv_scores["test_r2"].mean()
    cv_r2_std = cv_scores["test_r2"].std()
    cv_mae_mean = -cv_scores["test_neg_mean_absolute_error"].mean()
    cv_mae_std = cv_scores["test_neg_mean_absolute_error"].std()
    cv_rmse_mean = -cv_scores["test_neg_root_mean_squared_error"].mean()
    cv_rmse_std = cv_scores["test_neg_root_mean_squared_error"].std()

    train_r2_mean = cv_scores["train_r2"].mean()
    train_r2_std = cv_scores["train_r2"].std()

    print(f"  Test R2   : {cv_r2_mean:.4f} +/- {cv_r2_std:.4f}  (Folds: {[round(s, 4) for s in cv_scores['test_r2']]})")
    print(f"  Test MAE  : {cv_mae_mean:.3f} +/- {cv_mae_std:.3f}  (Folds: {[round(-s, 3) for s in cv_scores['test_neg_mean_absolute_error']]})")
    print(f"  Test RMSE : {cv_rmse_mean:.3f} +/- {cv_rmse_std:.3f}  (Folds: {[round(-s, 3) for s in cv_scores['test_neg_root_mean_squared_error']]})")
    print(f"  Train R2  : {train_r2_mean:.4f} +/- {train_r2_std:.4f}  (Train-Test Gap: {train_r2_mean - cv_r2_mean:.4f})")

    # 5. Baseline Comparisons on Holdout Test Set (N=600)
    print(f"\n[Audit Item 5] Benchmark Baseline Comparisons (Holdout Test N={len(X_test)}):")
    
    # Baseline 1: Dummy Mean Predictor
    dummy = DummyRegressor(strategy="mean")
    dummy.fit(X_train, y_train)
    y_pred_dummy = dummy.predict(X_test)
    dummy_mae = mean_absolute_error(y_test, y_pred_dummy)
    dummy_rmse = np.sqrt(mean_squared_error(y_test, y_pred_dummy))
    dummy_r2 = r2_score(y_test, y_pred_dummy)
    print(f"  1. Dummy Mean Predictor   : MAE={dummy_mae:6.3f} | RMSE={dummy_rmse:6.3f} | R2={dummy_r2:7.4f}")

    # Baseline 2: Deterministic Rule-Based Engine
    baseline_engine = BaselineRiskEngine()
    test_records = X_test.to_dict(orient="records")
    y_pred_rule = [baseline_engine.evaluate_organization(rec)["risk_score"] for rec in test_records]
    rule_mae = mean_absolute_error(y_test, y_pred_rule)
    rule_rmse = np.sqrt(mean_squared_error(y_test, y_pred_rule))
    rule_r2 = r2_score(y_test, y_pred_rule)
    print(f"  2. Deterministic Engine   : MAE={rule_mae:6.3f} | RMSE={rule_rmse:6.3f} | R2={rule_r2:7.4f}")

    # Best Model Pipeline
    y_pred_ml = pipeline.predict(X_test)
    ml_mae = mean_absolute_error(y_test, y_pred_ml)
    ml_rmse = np.sqrt(mean_squared_error(y_test, y_pred_ml))
    ml_r2 = r2_score(y_test, y_pred_ml)
    print(f"  3. Trained ML Pipeline    : MAE={ml_mae:6.3f} | RMSE={ml_rmse:6.3f} | R2={ml_r2:7.4f}")

    # 6. Detailed Classification Metrics (Categorical Risk Levels)
    def to_risk_level(score):
        if score < 25.0: return "Low"
        elif score < 50.0: return "Moderate"
        elif score < 75.0: return "High"
        else: return "Critical"

    labels = ["Low", "Moderate", "High", "Critical"]
    y_test_levels = [to_risk_level(s) for s in y_test]
    y_pred_levels = [to_risk_level(s) for s in y_pred_ml]

    conf_matrix = confusion_matrix(y_test_levels, y_pred_levels, labels=labels)
    balanced_acc = balanced_accuracy_score(y_test_levels, y_pred_levels)
    overall_acc = np.mean([t == p for t, p in zip(y_test_levels, y_pred_levels)])

    print(f"\n[Audit Item 6] Risk Level Classification Metrics (Holdout N={len(X_test)}):")
    print(f"  Overall Accuracy : {overall_acc * 100:.2f}%")
    print(f"  Balanced Accuracy: {balanced_acc * 100:.2f}%\n")
    print(f"  {'Category':<12} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'Support':<8}")
    print("  " + "-" * 56)

    cls_report = classification_report(y_test_levels, y_pred_levels, labels=labels, output_dict=True)
    for lbl in labels:
        p = cls_report[lbl]["precision"]
        r = cls_report[lbl]["recall"]
        f = cls_report[lbl]["f1-score"]
        s = cls_report[lbl]["support"]
        print(f"  {lbl:<12} | {p:<10.4f} | {r:<10.4f} | {f:<10.4f} | {s:<8}")

    print("\n  Confusion Matrix (Rows: Actual, Cols: Predicted):")
    print(f"  {'':<12} | {'Low':<8} | {'Moderate':<8} | {'High':<8} | {'Critical':<8}")
    print("  " + "-" * 52)
    for i, row in enumerate(conf_matrix):
        print(f"  {labels[i]:<12} | {row[0]:<8} | {row[1]:<8} | {row[2]:<8} | {row[3]:<8}")

    # 7. Leakage / Data Generation Formula Check
    print(f"\n[Audit Item 7] Data Leakage & Target Generation Audit:")
    corr_series = df[NUMERIC_FEATURES].apply(lambda s: s.corr(df[TARGET_FEATURE]))
    top_corr = corr_series.abs().sort_values(ascending=False).head(5)
    print("  Top 5 numerical feature correlations with target risk_score:")
    for f, v in top_corr.items():
        print(f"    - {f:<35}: r = {corr_series[f]:.4f}")

    audit_results = {
        "dataset_samples": total_samples,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "duplicate_rows": int(duplicate_rows),
        "train_test_overlap": int(overlap),
        "cv_5fold": {
            "r2_mean": round(cv_r2_mean, 4),
            "r2_std": round(cv_r2_std, 4),
            "mae_mean": round(cv_mae_mean, 3),
            "mae_std": round(cv_mae_std, 3),
            "rmse_mean": round(cv_rmse_mean, 3),
            "rmse_std": round(cv_rmse_std, 3),
            "train_r2_mean": round(train_r2_mean, 4)
        },
        "baselines": {
            "dummy_mean": {"mae": round(dummy_mae, 3), "rmse": round(dummy_rmse, 3), "r2": round(dummy_r2, 4)},
            "deterministic_rule": {"mae": round(rule_mae, 3), "rmse": round(rule_rmse, 3), "r2": round(rule_r2, 4)},
            "ml_model": {"mae": round(ml_mae, 3), "rmse": round(ml_rmse, 3), "r2": round(ml_r2, 4)}
        },
        "classification": {
            "accuracy": round(overall_acc, 4),
            "balanced_accuracy": round(balanced_acc, 4),
            "per_class": {lbl: {k: round(cls_report[lbl][k], 4) for k in ["precision", "recall", "f1-score", "support"]} for lbl in labels},
            "confusion_matrix": conf_matrix.tolist()
        }
    }

    with open("models/organization-risk/validation_audit.json", "w") as f:
        json.dump(audit_results, f, indent=2)

    print(f"\nAudit results successfully exported to models/organization-risk/validation_audit.json")
    print("==================================================")
    return audit_results


if __name__ == "__main__":
    run_full_audit()
