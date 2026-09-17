"""
scripts/evaluate_p6.py
Comprehensive Evaluation & Generalization Pipeline for P6 Empirical Evidence Model.
Evaluates:
- Primary XGBoost vs. Baseline Logistic Regression
- Train, Validation, and Hold-Out Test sets
- Comprehensive metrics: Accuracy, Balanced Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC, MCC, Brier Score
- Per-Attack Category breakdown across all 15 original labels
- Feature Importance rankings (Gain, Weight, Cover)
- Calibration / Reliability assessment
Outputs reports/p6_metrics.json, reports/p6_metrics.md, and reports/p6_feature_importance.csv.
"""

import os
import sys
import json
import time
import pickle
import joblib
import numpy as np
import pandas as pd

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, precision_score,
    recall_score, f1_score, roc_auc_score, average_precision_score,
    matthews_corrcoef, brier_score_loss, confusion_matrix
)

def compute_metrics(y_true, y_prob, threshold=0.5):
    y_pred = (y_prob >= threshold).astype(int)
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
    
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 5),
        "balanced_accuracy": round(float(balanced_accuracy_score(y_true, y_pred)), 5),
        "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 5),
        "recall": round(float(recall_score(y_true, y_pred, zero_division=0)), 5),
        "f1": round(float(f1_score(y_true, y_pred, zero_division=0)), 5),
        "roc_auc": round(float(roc_auc_score(y_true, y_prob)), 5),
        "pr_auc": round(float(average_precision_score(y_true, y_prob)), 5),
        "mcc": round(float(matthews_corrcoef(y_true, y_pred)), 5),
        "brier_score": round(float(brier_score_loss(y_true, y_prob)), 5),
        "confusion_matrix": {
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp)
        }
    }

def evaluate_p6(
    processed_dir="data/cic_ids2017/processed",
    schema_path="models/p6/feature_schema.json",
    models_dir="models/p6",
    reports_dir="reports"
):
    print("=" * 60)
    print("1. LOADING ARTIFACTS AND DATASETS FOR EVALUATION")
    print("=" * 60)
    os.makedirs(reports_dir, exist_ok=True)
    
    # 1. Load schema
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    feature_names = schema["feature_names"]
    target_col = schema["target_column"]
    orig_label_col = schema.get("original_label_column", "original_label")
    
    # 2. Load models
    primary_path = os.path.join(models_dir, "CyberOptRQ_P6_CIC2017_XGBoost_v1.pkl")
    baseline_path = os.path.join(models_dir, "baseline_logistic_regression.pkl")
    
    with open(primary_path, "rb") as f:
        primary_model = pickle.load(f)
    with open(baseline_path, "rb") as f:
        baseline_model = pickle.load(f)
        
    print(f"[LOADED] Primary Model: {primary_path}")
    print(f"[LOADED] Baseline Model: {baseline_path}")
    
    # 3. Load partitions
    def load_part(name):
        jb = os.path.join(processed_dir, f"{name}.joblib")
        cz = os.path.join(processed_dir, f"{name}.csv.gz")
        if os.path.exists(jb):
            return joblib.load(jb)
        elif os.path.exists(cz):
            return pd.read_csv(cz)
        raise FileNotFoundError(f"Partition {name} not found.")
        
    print("[LOAD] Loading Train, Validation, and Hold-Out Test sets...")
    train_df = load_part("train")
    val_df = load_part("val")
    test_df = load_part("test")
    
    print(f"Train: {len(train_df):,} | Val: {len(val_df):,} | Test: {len(test_df):,}")
    
    # 4. Predict on Partitions
    print("\n" + "=" * 60)
    print("2. COMPUTING METRICS ACROSS PARTITIONS")
    print("=" * 60)
    
    X_train = train_df[feature_names].values.astype(np.float32)
    y_train = train_df[target_col].values.astype(np.int32)
    
    X_val = val_df[feature_names].values.astype(np.float32)
    y_val = val_df[target_col].values.astype(np.int32)
    
    X_test = test_df[feature_names].values.astype(np.float32)
    y_test = test_df[target_col].values.astype(np.int32)
    
    # Primary model predictions
    p_train = primary_model.predict_proba(X_train)[:, 1]
    p_val = primary_model.predict_proba(X_val)[:, 1]
    p_test = primary_model.predict_proba(X_test)[:, 1]
    
    # Baseline test predictions
    p_base_test = baseline_model.predict_proba(X_test)[:, 1]
    
    train_metrics = compute_metrics(y_train, p_train)
    val_metrics = compute_metrics(y_val, p_val)
    test_metrics = compute_metrics(y_test, p_test)
    base_test_metrics = compute_metrics(y_test, p_base_test)
    
    print(f"Test Primary (XGBoost):  ROC-AUC={test_metrics['roc_auc']:.4f}, F1={test_metrics['f1']:.4f}, MCC={test_metrics['mcc']:.4f}, Brier={test_metrics['brier_score']:.4f}")
    print(f"Test Baseline (LogReg):  ROC-AUC={base_test_metrics['roc_auc']:.4f}, F1={base_test_metrics['f1']:.4f}, MCC={base_test_metrics['mcc']:.4f}, Brier={base_test_metrics['brier_score']:.4f}")
    
    # 5. Attack Category Breakdown on Test Set
    print("\n" + "=" * 60)
    print("3. BREAKDOWN PER ORIGINAL ATTACK CATEGORY")
    print("=" * 60)
    test_df["pred_prob"] = p_test
    test_df["pred_label"] = (p_test >= 0.5).astype(int)
    
    category_summary = []
    for cat, grp in test_df.groupby(orig_label_col):
        clean_cat = str(cat).replace('\ufffd', '-').encode('ascii', 'replace').decode('ascii').replace('?', '-')
        count = len(grp)
        is_attack = int(grp[target_col].iloc[0] == 1)
        if is_attack:
            # For attacks: recall is TP / Total attack flows
            tp = (grp["pred_label"] == 1).sum()
            recall = round(float(tp / count), 4)
            mean_score = round(float(grp["pred_prob"].mean()), 4)
            category_summary.append({
                "category": clean_cat,
                "type": "ATTACK",
                "sample_count": count,
                "detected_count": int(tp),
                "recall_rate": recall,
                "mean_malicious_probability": mean_score
            })
        else:
            # For benign: specificity is TN / Total benign flows
            tn = (grp["pred_label"] == 0).sum()
            spec = round(float(tn / count), 4)
            mean_score = round(float(grp["pred_prob"].mean()), 4)
            category_summary.append({
                "category": clean_cat,
                "type": "BENIGN",
                "sample_count": count,
                "correct_benign_count": int(tn),
                "benign_accuracy": spec,
                "mean_malicious_probability": mean_score
            })
            
    cat_df = pd.DataFrame(category_summary).sort_values(by="sample_count", ascending=False)
    print(cat_df.to_string(index=False))
    
    # 6. Feature Importance
    print("\n" + "=" * 60)
    print("4. FEATURE IMPORTANCE RANKING")
    print("=" * 60)
    booster = primary_model.get_booster()
    # Map f0, f1... back to actual feature names if needed
    score_gain = booster.get_score(importance_type='gain')
    score_weight = booster.get_score(importance_type='weight')
    score_cover = booster.get_score(importance_type='cover')
    
    feat_records = []
    for idx, fname in enumerate(feature_names):
        key = f"f{idx}" if f"f{idx}" in score_gain else fname
        gain = score_gain.get(key, score_gain.get(fname, 0.0))
        weight = score_weight.get(key, score_weight.get(fname, 0.0))
        cover = score_cover.get(key, score_cover.get(fname, 0.0))
        feat_records.append({
            "feature": fname,
            "gain": round(float(gain), 4),
            "weight": int(weight),
            "cover": round(float(cover), 4)
        })
        
    feat_df = pd.DataFrame(feat_records).sort_values(by="gain", ascending=False)
    feat_csv_path = os.path.join(reports_dir, "p6_feature_importance.csv")
    feat_df.to_csv(feat_csv_path, index=False)
    print(f"[SAVED] Top 10 features by Gain saved to {feat_csv_path}:")
    print(feat_df.head(10).to_string(index=False))
    
    # 7. Calibration Curve
    from sklearn.calibration import calibration_curve
    prob_true, prob_pred = calibration_curve(y_test, p_test, n_bins=10)
    calibration_data = [{"predicted": round(float(p), 4), "fraction_positive": round(float(f), 4)}
                        for p, f in zip(prob_pred, prob_true)]
                        
    # 8. Compile Comprehensive Reports
    metrics_report = {
        "model_name": "CyberOptRQ_P6_CIC2017_XGBoost_v1",
        "evaluation_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "dataset_split": {
            "train_samples": len(train_df),
            "val_samples": len(val_df),
            "test_samples": len(test_df)
        },
        "primary_model_metrics": {
            "train": train_metrics,
            "val": val_metrics,
            "test": test_metrics
        },
        "baseline_model_metrics": {
            "test": base_test_metrics
        },
        "top_features_by_gain": feat_records[:15],
        "category_breakdown": category_summary,
        "calibration": {
            "brier_score": test_metrics["brier_score"],
            "reliability_bins": calibration_data
        }
    }
    
    json_path = os.path.join(reports_dir, "p6_metrics.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(metrics_report, f, indent=2)
    print(f"\n[SAVED] Metrics JSON report: {json_path}")
    
    # Generate Markdown Report
    md_content = f"""# P6 Empirical Evidence Model: Comprehensive Evaluation Report

**Model:** `CyberOptRQ_P6_CIC2017_XGBoost_v1`  
**Evaluation Date:** {metrics_report['evaluation_timestamp']}  
**Dataset:** CIC-IDS2017 (MachineLearningCSV)  
**Evaluated Partitions:** Train ({len(train_df):,}), Val ({len(val_df):,}), Test ({len(test_df):,})  

---

## 1. Executive Performance Summary

| Metric | Train Set | Validation Set | Test Set (Hold-Out) | Baseline (LogReg Test) |
| :--- | :--- | :--- | :--- | :--- |
| **ROC-AUC** | `{train_metrics['roc_auc']:.4f}` | `{val_metrics['roc_auc']:.4f}` | **`{test_metrics['roc_auc']:.4f}`** | `{base_test_metrics['roc_auc']:.4f}` |
| **PR-AUC (Avg Precision)** | `{train_metrics['pr_auc']:.4f}` | `{val_metrics['pr_auc']:.4f}` | **`{test_metrics['pr_auc']:.4f}`** | `{base_test_metrics['pr_auc']:.4f}` |
| **Accuracy** | `{train_metrics['accuracy']:.4%}` | `{val_metrics['accuracy']:.4%}` | **`{test_metrics['accuracy']:.4%}`** | `{base_test_metrics['accuracy']:.4%}` |
| **Balanced Accuracy** | `{train_metrics['balanced_accuracy']:.4%}` | `{val_metrics['balanced_accuracy']:.4%}` | **`{test_metrics['balanced_accuracy']:.4%}`** | `{base_test_metrics['balanced_accuracy']:.4%}` |
| **Precision** | `{train_metrics['precision']:.4f}` | `{val_metrics['precision']:.4f}` | **`{test_metrics['precision']:.4f}`** | `{base_test_metrics['precision']:.4f}` |
| **Recall** | `{train_metrics['recall']:.4f}` | `{val_metrics['recall']:.4f}` | **`{test_metrics['recall']:.4f}`** | `{base_test_metrics['recall']:.4f}` |
| **F1-Score** | `{train_metrics['f1']:.4f}` | `{val_metrics['f1']:.4f}` | **`{test_metrics['f1']:.4f}`** | `{base_test_metrics['f1']:.4f}` |
| **Matthews Corr (MCC)** | `{train_metrics['mcc']:.4f}` | `{val_metrics['mcc']:.4f}` | **`{test_metrics['mcc']:.4f}`** | `{base_test_metrics['mcc']:.4f}` |
| **Brier Score** | `{train_metrics['brier_score']:.5f}` | `{val_metrics['brier_score']:.5f}` | **`{test_metrics['brier_score']:.5f}`** | `{base_test_metrics['brier_score']:.5f}` |

### Hold-Out Test Confusion Matrix
- **True Negatives (TN):** {test_metrics['confusion_matrix']['true_negatives']:,}
- **False Positives (FP):** {test_metrics['confusion_matrix']['false_positives']:,}
- **False Negatives (FN):** {test_metrics['confusion_matrix']['false_negatives']:,}
- **True Positives (TP):** {test_metrics['confusion_matrix']['true_positives']:,}

---

## 2. Attack-Category Breakdown (Hold-Out Test Set)

| Attack / Traffic Category | Type | Test Count | Detected / Correct | Detection Rate / Recall | Mean Malicious Prob |
| :--- | :--- | :--- | :--- | :--- | :--- |
"""
    for r in category_summary:
        if r["type"] == "ATTACK":
            md_content += f"| **{r['category']}** | Attack | {r['sample_count']:,} | {r['detected_count']:,} | `{r['recall_rate']:.2%}` | `{r['mean_malicious_probability']:.4f}` |\n"
        else:
            md_content += f"| **{r['category']}** | Benign | {r['sample_count']:,} | {r['correct_benign_count']:,} | `{r['benign_accuracy']:.2%}` | `{r['mean_malicious_probability']:.4f}` |\n"

    md_content += f"""
---

## 3. Top 15 Feature Importances (XGBoost Gain)

| Rank | Feature Name | Information Gain | Weight (Splits) | Cover |
| :--- | :--- | :--- | :--- | :--- |
"""
    for idx, frow in enumerate(feat_records[:15], 1):
        md_content += f"| {idx} | `{frow['feature']}` | `{frow['gain']:.2f}` | {frow['weight']} | `{frow['cover']:.2f}` |\n"

    md_path = os.path.join(reports_dir, "p6_metrics.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"[SAVED] Markdown report: {md_path}")
    print("\n[DONE] Evaluation complete!")

if __name__ == "__main__":
    evaluate_p6()
