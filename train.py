"""
train.py
Multi-model training pipeline for Organization Cybersecurity Risk Assessment.

Trains and compares:
- Linear Regression (Explainable Baseline)
- Random Forest Regressor
- Gradient Boosting Regressor
- HistGradientBoosting Regressor
- XGBoost Regressor

Evaluates cross-validation performance, selects the best model,
exports model artifacts, metadata, and preprocessing configurations.
"""

import os
import sys
import time
import json
import joblib
import subprocess
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, KFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, HistGradientBoostingRegressor

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    xgb = None
    XGB_AVAILABLE = False

# Feature sets
CATEGORICAL_FEATURES = ["industry", "organization_size"]

BOOLEAN_FEATURES = [
    "privileged_account_mfa",
    "privileged_access_management",
    "least_privilege_enforced",
    "data_classification_implemented",
    "critical_asset_identification",
    "firewall_deployment",
    "network_segmentation",
    "security_awareness_training",
    "secure_configuration_baselines",
    "siem_deployed",
    "security_monitoring",
    "automated_alerting",
    "incident_response_plan",
    "incident_response_testing",
    "dedicated_ir_team",
    "offline_backup",
    "disaster_recovery_plan",
    "vendor_risk_management",
    "third_party_access_controls",
    "supply_chain_monitoring",
    "previous_data_breach",
    "ransomware_history"
]

NUMERIC_FEATURES = [
    "number_of_employees",
    "number_of_endpoints",
    "number_of_servers",
    "cloud_usage_percentage",
    "remote_worker_percentage",
    "critical_asset_count",
    "mfa_coverage",
    "password_policy_score",
    "access_review_frequency_days",
    "sso_adoption_percentage",
    "asset_inventory_coverage",
    "asset_discovery_frequency_days",
    "endpoint_protection_coverage",
    "encryption_at_rest",
    "encryption_in_transit",
    "vulnerability_scanning_frequency_days",
    "patch_frequency_days",
    "average_patch_delay",
    "critical_vulnerability_remediation_time",
    "penetration_testing_frequency_months",
    "soc_coverage_hours",
    "edr_coverage",
    "log_retention_days",
    "mean_time_to_detect",
    "mean_time_to_respond",
    "backup_frequency_hours",
    "backup_testing_frequency_months",
    "recovery_time_objective_hours",
    "recovery_point_objective_hours",
    "previous_incidents_count"
]

ALL_INPUT_FEATURES = CATEGORICAL_FEATURES + BOOLEAN_FEATURES + NUMERIC_FEATURES
TARGET_FEATURE = "risk_score"


def detect_hardware():
    """
    Detects system GPU capabilities via nvidia-smi / WMI.
    Returns dict with hardware specs and whether CUDA GPU is available.
    """
    hw_info = {
        "gpu_detected": False,
        "gpu_name": "None",
        "vram_mb": 0,
        "cuda_version": "None",
        "recommended_device": "cpu"
    }

    # Check nvidia-smi
    smi_paths = [
        "nvidia-smi",
        r"C:\Windows\System32\nvidia-smi.exe",
        r"C:\Program Files\NVIDIA Corporation\NVSMI\nvidia-smi.exe"
    ]
    for smi in smi_paths:
        try:
            res = subprocess.run([smi, "--query-gpu=name,memory.total,driver_version", "--format=csv,noheader"],
                                 capture_output=True, text=True, timeout=3)
            if res.returncode == 0 and res.stdout.strip():
                parts = [p.strip() for p in res.stdout.strip().split(",")]
                hw_info["gpu_detected"] = True
                hw_info["gpu_name"] = parts[0]
                if len(parts) > 1:
                    hw_info["vram_mb"] = parts[1]
                if len(parts) > 2:
                    hw_info["driver_version"] = parts[2]
                break
        except Exception:
            continue

    return hw_info


def benchmark_gpu_vs_cpu(X_train_proc, y_train):
    """
    Runs an empirical micro-benchmark comparing GPU vs multi-threaded CPU training speed.
    Selects whichever device executes faster for this specific dataset size.
    """
    if not XGB_AVAILABLE:
        return "cpu", {"note": "XGBoost not installed; using multi-threaded CPU"}

    print("\n--- Hardware Benchmark: GPU vs CPU Acceleration ---")
    
    # Test CPU training time (multi-threaded)
    cpu_model = xgb.XGBRegressor(n_estimators=100, max_depth=6, n_jobs=-1, random_state=42)
    t0 = time.perf_counter()
    cpu_model.fit(X_train_proc, y_train)
    cpu_time = time.perf_counter() - t0
    print(f"  [CPU Benchmark] 100 Trees (multi-threaded): {cpu_time:.3f} seconds")

    # Test GPU training time (CUDA)
    gpu_time = None
    cuda_supported = False
    try:
        gpu_model = xgb.XGBRegressor(n_estimators=100, max_depth=6, device="cuda", random_state=42)
        t0 = time.perf_counter()
        gpu_model.fit(X_train_proc, y_train)
        gpu_time = time.perf_counter() - t0
        cuda_supported = True
        print(f"  [GPU Benchmark] 100 Trees (NVIDIA CUDA):     {gpu_time:.3f} seconds")
    except Exception as e:
        print(f"  [GPU Benchmark] CUDA acceleration test failed: {e}")
        print("  -> Falling back to optimized multi-threaded CPU execution.")

    bench_results = {
        "cpu_time_sec": round(cpu_time, 4),
        "gpu_time_sec": round(gpu_time, 4) if gpu_time else None,
        "cuda_supported": cuda_supported
    }

    if cuda_supported and gpu_time and gpu_time < cpu_time:
        print(f"  >> RESULT: GPU is {cpu_time / gpu_time:.2f}x FASTER. Using GPU (device='cuda').")
        return "cuda", bench_results
    elif cuda_supported and gpu_time:
        print(f"  >> RESULT: CPU is {gpu_time / cpu_time:.2f}x FASTER for this dataset size (3,000 rows fit in L3 cache without PCIe bus transfer latency). Using multi-threaded CPU.")
        return "cpu", bench_results
    else:
        return "cpu", bench_results


def build_preprocessor():
    categorical_transformer = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    numeric_transformer = StandardScaler()
    boolean_transformer = "passthrough"

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", categorical_transformer, CATEGORICAL_FEATURES),
            ("bool", boolean_transformer, BOOLEAN_FEATURES),
            ("num", numeric_transformer, NUMERIC_FEATURES)
        ]
    )
    return preprocessor


def train_and_compare(data_path: str = "sample_organizations.csv", force_device: str = "auto"):
    hw = detect_hardware()
    print("==================================================")
    print("  CYBER RISK MODEL TRAINING PIPELINE")
    print("==================================================")
    if hw["gpu_detected"]:
        print(f"Detected GPU: {hw['gpu_name']} (VRAM: {hw['vram_mb']})")
    else:
        print("No NVIDIA GPU detected; using CPU.")
    if not os.path.exists(data_path):
        from data_generation import generate_dataset
        print(f"Dataset {data_path} not found. Generating reproducible synthetic dataset...")
        df = generate_dataset(3000)
        df.to_csv(data_path, index=False)
    else:
        df = pd.read_csv(data_path)

    print(f"Loaded dataset: {data_path} (Shape: {df.shape})")
    
    # Convert booleans to int for ML consistency
    for col in BOOLEAN_FEATURES:
        if col in df.columns:
            df[col] = df[col].astype(int)

    X = df[ALL_INPUT_FEATURES]
    y = df[TARGET_FEATURE].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)
    print(f"Train samples: {len(X_train)}, Test samples: {len(X_test)}")

    preprocessor = build_preprocessor()

    models = {
        "Ridge_Linear_Baseline": Ridge(alpha=1.0),
        "Random_Forest": RandomForestRegressor(n_estimators=150, max_depth=12, random_state=42, n_jobs=-1),
        "Gradient_Boosting": GradientBoostingRegressor(n_estimators=150, learning_rate=0.08, max_depth=5, random_state=42),
        "HistGradientBoosting": HistGradientBoostingRegressor(max_iter=150, learning_rate=0.08, max_depth=8, random_state=42),
    }

    device_selected = "cpu"
    bench_meta = {}
    if XGB_AVAILABLE:
        try:
            X_train_proc = preprocessor.fit_transform(X_train)
            if force_device == "cuda":
                device_selected = "cuda"
                print("Hardware: Force GPU (device='cuda') enabled.")
            elif force_device == "cpu":
                device_selected = "cpu"
                print("Hardware: Force CPU (multi-threaded) enabled.")
            else:
                device_selected, bench_meta = benchmark_gpu_vs_cpu(X_train_proc, y_train)

            if device_selected == "cuda":
                models["XGBoost_GPU"] = xgb.XGBRegressor(
                    n_estimators=150, learning_rate=0.08, max_depth=5, random_state=42, device="cuda"
                )
            else:
                models["XGBoost_CPU"] = xgb.XGBRegressor(
                    n_estimators=150, learning_rate=0.08, max_depth=5, random_state=42, n_jobs=-1
                )
        except Exception as e:
            print(f"XGBoost setup encountered issue: {e}. Falling back to standard CPU models.")
    else:
        print("XGBoost not installed; benchmarking scikit-learn tree ensembles (HistGradientBoosting, RandomForest).")

    results = {}
    best_name = None
    best_score = float("inf")
    best_pipeline = None

    kf = KFold(n_splits=5, shuffle=True, random_state=42)

    print("\n--- Model Benchmark & 5-Fold Cross-Validation ---")
    for name, model in models.items():
        pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("model", model)
        ])
        
        cv_scores = cross_validate(
            pipeline, X_train, y_train, cv=kf,
            scoring=["neg_mean_absolute_error", "neg_root_mean_squared_error", "r2"],
            n_jobs=-1
        )
        
        mae = -cv_scores["test_neg_mean_absolute_error"].mean()
        rmse = -cv_scores["test_neg_root_mean_squared_error"].mean()
        r2 = cv_scores["test_r2"].mean()

        results[name] = {"MAE": round(mae, 3), "RMSE": round(rmse, 3), "R2": round(r2, 4)}
        print(f"[{name}] MAE: {mae:.3f} | RMSE: {rmse:.3f} | R²: {r2:.4f}")

        if rmse < best_score:
            best_score = rmse
            best_name = name
            best_pipeline = pipeline

    print(f"\nBest Model: {best_name} (RMSE: {best_score:.3f})")

    # Fit best model on entire training set and evaluate on test set
    best_pipeline.fit(X_train, y_train)
    y_pred = best_pipeline.predict(X_test)
    test_mae = float(np.mean(np.abs(y_test - y_pred)))
    test_rmse = float(np.sqrt(np.mean((y_test - y_pred) ** 2)))
    ss_tot = np.sum((y_test - np.mean(y_test)) ** 2)
    ss_res = np.sum((y_test - y_pred) ** 2)
    test_r2 = float(1 - (ss_res / ss_tot))

    print(f"\nHoldout Test Evaluation ({best_name}):")
    print(f"  Test MAE:  {test_mae:.3f}")
    print(f"  Test RMSE: {test_rmse:.3f}")
    print(f"  Test R²:   {test_r2:.4f}")

    # Create model export directories
    model_dir = os.path.join("models", "organization-risk")
    os.makedirs(model_dir, exist_ok=True)

    # Save trained sklearn pipeline
    pipeline_path = os.path.join(model_dir, "model_pipeline.pkl")
    joblib.dump(best_pipeline, pipeline_path)
    print(f"Saved pipeline to {pipeline_path}")

    # Save preprocessing metadata and feature definitions
    preprocessing_meta = {
        "hardware_environment": hw,
        "hardware_benchmark": bench_meta,
        "device_selected": device_selected,
        "categorical_features": CATEGORICAL_FEATURES,
        "boolean_features": BOOLEAN_FEATURES,
        "numeric_features": NUMERIC_FEATURES,
        "all_input_features": ALL_INPUT_FEATURES,
        "target_feature": TARGET_FEATURE,
        "test_metrics": {
            "best_model": best_name,
            "test_mae": round(test_mae, 3),
            "test_rmse": round(test_rmse, 3),
            "test_r2": round(test_r2, 4)
        },
        "all_model_benchmarks": results
    }

    meta_path = os.path.join(model_dir, "preprocessing.json")
    with open(meta_path, "w") as f:
        json.dump(preprocessing_meta, f, indent=2)

    return best_pipeline, preprocessing_meta

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Train and benchmark Organization Risk models.")
    parser.add_argument("--data", default="sample_organizations.csv", help="Path to CSV dataset")
    parser.add_argument("--device", default="auto", choices=["auto", "cuda", "cpu"], help="Hardware acceleration mode (auto benchmarks GPU vs CPU)")
    args = parser.parse_args()

    train_and_compare(data_path=args.data, force_device=args.device)
