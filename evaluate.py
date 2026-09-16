"""
evaluate.py
Evaluates model performance, residuals, and feature importances.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from train import ALL_INPUT_FEATURES, BOOLEAN_FEATURES, TARGET_FEATURE

def evaluate_model(model_path: str = "models/organization-risk/model_pipeline.pkl",
                   data_path: str = "sample_organizations.csv"):
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model {model_path} not found. Run train.py first.")
    
    pipeline = joblib.load(model_path)
    df = pd.read_csv(data_path)

    for col in BOOLEAN_FEATURES:
        if col in df.columns:
            df[col] = df[col].astype(int)

    X = df[ALL_INPUT_FEATURES]
    y_true = df[TARGET_FEATURE].values

    y_pred = pipeline.predict(X)

    mae = float(np.mean(np.abs(y_true - y_pred)))
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    ss_res = np.sum((y_true - y_pred) ** 2)
    r2 = float(1 - (ss_res / ss_tot))

    # Calculate Risk Level Accuracy (Low, Moderate, High, Critical)
    def to_level(score):
        if score < 25: return "Low"
        elif score < 50: return "Moderate"
        elif score < 75: return "High"
        else: return "Critical"

    true_levels = [to_level(s) for s in y_true]
    pred_levels = [to_level(s) for s in y_pred]
    level_accuracy = float(np.mean([t == p for t, p in zip(true_levels, pred_levels)]))

    print("========================================")
    print("      MODEL EVALUATION REPORT           ")
    print("========================================")
    print(f"Total Evaluated Samples: {len(X)}")
    print(f"Mean Absolute Error (MAE):     {mae:.3f}")
    print(f"Root Mean Squared Error (RMSE): {rmse:.3f}")
    print(f"Coefficient of Determination (R²): {r2:.4f}")
    print(f"Risk Level Classification Accuracy: {level_accuracy * 100:.2f}%")
    print("========================================")

    # Feature Importance analysis from the model stage
    model_step = pipeline.named_steps["model"]
    preprocessor = pipeline.named_steps["preprocessor"]

    feature_names = []
    # Extract names from transformers
    for name, trans, cols in preprocessor.transformers_:
        if hasattr(trans, "get_feature_names_out"):
            feature_names.extend(trans.get_feature_names_out(cols))
        else:
            feature_names.extend(cols)

    top_features = []
    importances = None
    if hasattr(model_step, "feature_importances_"):
        importances = model_step.feature_importances_
    elif hasattr(model_step, "coef_"):
        importances = np.abs(model_step.coef_)

    if importances is not None:
        sorted_indices = np.argsort(importances)[::-1]
        print("\nTop 10 Most Influential Risk Factors:")
        for rank, idx in enumerate(sorted_indices[:10], 1):
            fname = feature_names[idx] if idx < len(feature_names) else f"feature_{idx}"
            top_features.append({"rank": rank, "feature": fname, "importance": round(float(importances[idx]), 4)})
            print(f"  {rank:2d}. {fname:<35} | {importances[idx]:.4f}")

    metrics_out = {
        "mae": round(mae, 3),
        "rmse": round(rmse, 3),
        "r2": round(r2, 4),
        "risk_level_accuracy": round(level_accuracy, 4),
        "top_features": top_features
    }

    eval_file = "models/organization-risk/evaluation_report.json"
    with open(eval_file, "w") as f:
        json.dump(metrics_out, f, indent=2)
    print(f"\nEvaluation summary written to {eval_file}")

    return metrics_out

if __name__ == "__main__":
    evaluate_model()
