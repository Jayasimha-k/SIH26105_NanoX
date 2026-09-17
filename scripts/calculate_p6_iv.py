"""
scripts/calculate_p6_iv.py
Recalculates Information Value (IV) across the clean 56 behavioral features.
Uses the forensically cleaned, time-aware training partition.
Outputs:
- reports/p6_information_value.csv
- reports/p6_information_value.md
"""

import os
import sys
import json
import joblib
import pandas as pd
import numpy as np

def calculate_iv_for_series(feature_series, target_binary, num_bins=10):
    valid_mask = ~(feature_series.isna() | np.isinf(feature_series))
    x = feature_series[valid_mask]
    y = target_binary[valid_mask]
    
    total_good = int((y == 0).sum())
    total_bad = int((y == 1).sum())
    
    if total_good == 0 or total_bad == 0 or len(x.unique()) <= 1:
        return 0.0, 1, round(float((~valid_mask).mean()), 4)
    
    try:
        bins = pd.qcut(x, q=num_bins, duplicates='drop')
    except Exception:
        bins = pd.cut(x, bins=min(num_bins, len(x.unique())), duplicates='drop')
        
    df_temp = pd.DataFrame({'bin': bins, 'y': y})
    grouped = df_temp.groupby('bin', observed=False)['y'].agg(
        total='count',
        bad='sum'
    ).reset_index()
    grouped['good'] = grouped['total'] - grouped['bad']
    
    eps = 1e-6
    grouped['distr_good'] = (grouped['good'] + eps) / (total_good + eps)
    grouped['distr_bad'] = (grouped['bad'] + eps) / (total_bad + eps)
    grouped['woe'] = np.log(grouped['distr_good'] / grouped['distr_bad'])
    grouped['iv'] = (grouped['distr_good'] - grouped['distr_bad']) * grouped['woe']
    
    total_iv = float(grouped['iv'].sum())
    if np.isnan(total_iv) or np.isinf(total_iv):
        total_iv = 0.0
        
    missing_rate = round(float((~valid_mask).mean()), 4)
    return round(total_iv, 4), len(grouped), missing_rate

def run_iv_analysis(
    train_path="data/cic_ids2017/processed/train.joblib",
    schema_path="models/p6/feature_schema.json",
    reports_dir="reports"
):
    print("=" * 60)
    print("RECALCULATING INFORMATION VALUE (IV) ACROSS CLEAN FEATURES")
    print("=" * 60)
    
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    features = schema["feature_names"]
    target_col = schema["target_column"]
    
    train_df = joblib.load(train_path)
    print(f"Loaded {len(train_df):,} training flows across {len(features)} behavioral features.")
    
    y = train_df[target_col]
    iv_results = []
    
    for f in features:
        iv, n_bins, miss_rate = calculate_iv_for_series(train_df[f], y, num_bins=10)
        
        # Classification according to Siddiqi (2006) standards
        if iv < 0.02:
            pred_power = "Unpredictive (< 0.02)"
        elif iv < 0.1:
            pred_power = "Weak (0.02 - 0.1)"
        elif iv < 0.3:
            pred_power = "Medium (0.1 - 0.3)"
        elif iv < 0.5:
            pred_power = "Strong (0.3 - 0.5)"
        else:
            pred_power = "Very Strong (> 0.5)"
            
        iv_results.append({
            "feature": f,
            "information_value": iv,
            "predictive_power": pred_power,
            "number_of_bins": n_bins,
            "missing_rate": miss_rate,
            "classification": "SAFE_BEHAVIORAL"
        })
        
    df_iv = pd.DataFrame(iv_results).sort_values(by="information_value", ascending=False)
    
    csv_path = os.path.join(reports_dir, "p6_information_value.csv")
    df_iv.to_csv(csv_path, index=False)
    print(f"[SAVED] Information Value CSV: {csv_path}")
    
    # Markdown
    md_content = f"""# P6 Information Value (IV) Analysis (Clean 56 Features)

**Scope:** Forensically Purged Behavioral Features ({len(features)} Features)  
**Sample:** Chronological Training Partition ({len(train_df):,} flows)  

---

## Top 20 Behavioral Features by Information Value

| Rank | Feature Name | Information Value (IV) | Predictive Power | Bins | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
"""
    for idx, r in enumerate(df_iv.head(20).to_dict(orient="records"), 1):
        md_content += f"| {idx} | `{r['feature']}` | `{r['information_value']:.4f}` | {r['predictive_power']} | {r['number_of_bins']} | **{r['classification']}** |\n"

    md_path = os.path.join(reports_dir, "p6_information_value.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"[SAVED] Information Value Markdown: {md_path}")
    print("\n[DONE] IV recalculation complete!")

if __name__ == "__main__":
    run_iv_analysis()
