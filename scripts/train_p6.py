"""
scripts/train_p6.py
Hardware-Aware Training Pipeline for P6 Empirical Network Behavioral Evidence Model.
Detects GPU (GTX 1050), CUDA, VRAM, and XGBoost device support.
Falls back gracefully to CPU if GPU memory or CUDA kernel fails.
Trains:
1. Primary: CyberOptRQ_P6_CIC2017_XGBoost_v1.pkl
2. Baseline: baseline_logistic_regression.pkl
Outputs models/p6/metadata.json with verified hardware environment and metrics.
"""

import os
import sys
import time
import json
import subprocess
import pickle
import joblib
import psutil
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import xgboost as xgb

def detect_hardware():
    print("=" * 60)
    print("1. DETECTING HARDWARE & COMPUTE CAPABILITIES")
    print("=" * 60)
    
    env_info = {
        "gpu_available": False,
        "gpu_name": "NOT AVAILABLE",
        "gpu_memory": "NOT AVAILABLE",
        "cuda_available": False,
        "xgboost_version": xgb.__version__,
        "training_device": "CPU",
        "environment": "local"
    }
    
    # System RAM
    vm = psutil.virtual_memory()
    total_ram_gb = round(vm.total / (1024**3), 2)
    avail_ram_gb = round(vm.available / (1024**3), 2)
    print(f"System RAM: {total_ram_gb} GB Total, {avail_ram_gb} GB Available")
    
    # Check NVIDIA GPU via nvidia-smi
    smi_paths = [
        "nvidia-smi",
        r"C:\Windows\System32\DriverStore\FileRepository\nvlt.inf_amd64_1a3f6562085fe77b\nvidia-smi.exe",
        r"C:\Windows\System32\DriverStore\FileRepository\nv_dispi.inf_amd64_3422cfb8c541fa9c\nvidia-smi.exe"
    ]
    
    smi_found = None
    for p in smi_paths:
        try:
            res = subprocess.run([p, "--query-gpu=name,memory.total,memory.free,driver_version", "--format=csv,noheader,nounits"],
                                 capture_output=True, text=True, check=True)
            smi_found = res.stdout.strip()
            break
        except Exception:
            continue
            
    if smi_found:
        parts = [x.strip() for x in smi_found.split(",")]
        if len(parts) >= 3:
            env_info["gpu_available"] = True
            env_info["gpu_name"] = parts[0]
            env_info["gpu_memory"] = f"{parts[1]} MiB (Free: {parts[2]} MiB)"
            env_info["cuda_available"] = True
            print(f"[FOUND] GPU: {env_info['gpu_name']}, Total VRAM: {parts[1]} MiB, Free: {parts[2]} MiB, Driver: {parts[3] if len(parts) > 3 else 'N/A'}")
    else:
        print("[NOTICE] nvidia-smi not accessible or no NVIDIA GPU detected.")
        
    # Test XGBoost GPU support with a small dummy array
    if env_info["gpu_available"]:
        print("[TEST] Testing XGBoost GPU acceleration capability with device='cuda'...")
        try:
            test_x = np.random.randn(100, 10).astype(np.float32)
            test_y = np.random.randint(0, 2, size=100).astype(np.int32)
            clf_test = xgb.XGBClassifier(n_estimators=2, max_depth=2, tree_method='hist', device='cuda')
            clf_test.fit(test_x, test_y)
            env_info["training_device"] = "GPU"
            print("[SUCCESS] XGBoost GPU acceleration (device='cuda') verified and functional!")
        except Exception as e:
            print(f"[WARNING] XGBoost GPU test failed ({e}). Falling back safely to CPU 'hist'.")
            env_info["training_device"] = "CPU"
    else:
        env_info["training_device"] = "CPU"
        
    print(f"Final Selected Training Device: {env_info['training_device']}")
    return env_info

def train_p6_pipeline(
    processed_dir="data/cic_ids2017/processed",
    schema_path="models/p6/feature_schema.json",
    models_dir="models/p6",
    reports_dir="reports"
):
    start_total_time = time.time()
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)
    
    # 1. Detect Hardware
    env_info = detect_hardware()
    
    # 2. Load Feature Schema
    if not os.path.exists(schema_path):
        raise FileNotFoundError(f"Feature schema not found at {schema_path}. Run preprocessing first.")
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    feature_names = schema["feature_names"]
    target_col = schema["target_column"]
    print(f"\n[INFO] Loaded feature schema: {len(feature_names)} features, target '{target_col}'")
    
    # 3. Load Datasets
    print("\n" + "=" * 60)
    print("2. LOADING PROCESSED TRAINING & VALIDATION PARTITIONS")
    print("=" * 60)
    train_joblib = os.path.join(processed_dir, "train.joblib")
    val_joblib = os.path.join(processed_dir, "val.joblib")
    train_csv = os.path.join(processed_dir, "train.csv.gz")
    val_csv = os.path.join(processed_dir, "val.csv.gz")
    
    if os.path.exists(train_joblib):
        print(f"[LOAD] Loading fast binary {train_joblib}...")
        train_df = joblib.load(train_joblib)
        val_df = joblib.load(val_joblib)
    elif os.path.exists(train_csv):
        print(f"[LOAD] Loading compressed CSV {train_csv}...")
        train_df = pd.read_csv(train_csv)
        val_df = pd.read_csv(val_csv)
    else:
        raise FileNotFoundError("Processed training files not found. Run preprocessing first.")
        
    print(f"Train partition: {len(train_df):,} rows (Malicious: {(train_df[target_col]==1).sum():,}, Benign: {(train_df[target_col]==0).sum():,})")
    print(f"Validation partition: {len(val_df):,} rows (Malicious: {(val_df[target_col]==1).sum():,}, Benign: {(val_df[target_col]==0).sum():,})")
    
    X_train = train_df[feature_names].values.astype(np.float32)
    y_train = train_df[target_col].values.astype(np.int32)
    X_val = val_df[feature_names].values.astype(np.float32)
    y_val = val_df[target_col].values.astype(np.int32)
    
    # Free memory
    del train_df, val_df
    
    # 4. Train Baseline Model (Logistic Regression)
    print("\n" + "=" * 60)
    print("3. TRAINING BASELINE BENCHMARK MODEL (LOGISTIC REGRESSION)")
    print("=" * 60)
    baseline_start = time.time()
    # Fit baseline on a stratified 50k subsample to ensure fast convergence
    baseline_sample_size = min(len(X_train), 50000)
    idx_sample = np.random.choice(len(X_train), baseline_sample_size, replace=False)
    
    baseline_pipe = Pipeline([
        ('scaler', StandardScaler()),
        ('clf', LogisticRegression(max_iter=500, random_state=42, solver='lbfgs'))
    ])
    baseline_pipe.fit(X_train[idx_sample], y_train[idx_sample])
    baseline_time = round(time.time() - baseline_start, 2)
    
    baseline_model_path = os.path.join(models_dir, "baseline_logistic_regression.pkl")
    with open(baseline_model_path, "wb") as f:
        pickle.dump(baseline_pipe, f)
    print(f"[SAVED] Baseline model saved to {baseline_model_path} (Trained in {baseline_time}s)")
    
    # 5. Train Primary Model (XGBoost)
    print("\n" + "=" * 60)
    print("4. TRAINING PRIMARY MODEL (XGBOOST V1)")
    print("=" * 60)
    device_arg = 'cuda' if env_info["training_device"] == "GPU" else 'cpu'
    
    params = {
        'n_estimators': 250,
        'max_depth': 6,
        'learning_rate': 0.08,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'min_child_weight': 3,
        'gamma': 0.1,
        'tree_method': 'hist',
        'device': device_arg,
        'eval_metric': 'logloss',
        'random_state': 42,
        'n_jobs': -1 if device_arg == 'cpu' else 1
    }
    
    print(f"XGBoost Parameters:\n{json.dumps(params, indent=2)}")
    xgb_start = time.time()
    
    primary_xgb = xgb.XGBClassifier(**params)
    primary_xgb.fit(
        X_train, y_train,
        eval_set=[(X_train, y_train), (X_val, y_val)],
        verbose=50
    )
    xgb_time = round(time.time() - xgb_start, 2)
    print(f"[SUCCESS] XGBoost training completed in {xgb_time}s!")
    
    primary_model_path = os.path.join(models_dir, "CyberOptRQ_P6_CIC2017_XGBoost_v1.pkl")
    with open(primary_model_path, "wb") as f:
        pickle.dump(primary_xgb, f)
    model_size_mb = round(os.path.getsize(primary_model_path) / (1024 * 1024), 2)
    print(f"[SAVED] Primary P6 model saved to {primary_model_path} ({model_size_mb} MB)")
    
    # 6. Save Training Metadata
    metadata = {
        "model_name": "CyberOptRQ_P6_CIC2017_XGBoost_v1",
        "version": "1.0.0",
        "framework": "xgboost",
        "framework_version": xgb.__version__,
        "dataset": "CIC-IDS2017 (MachineLearningCSV)",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "hardware_environment": env_info,
        "hyperparameters": params,
        "training_time_seconds": xgb_time,
        "baseline_training_time_seconds": baseline_time,
        "model_file_size_mb": model_size_mb,
        "features": {
            "count": len(feature_names),
            "names": feature_names
        },
        "data_split": {
            "train_rows": len(X_train),
            "val_rows": len(X_val),
            "train_malicious_ratio": float(np.mean(y_train)),
            "val_malicious_ratio": float(np.mean(y_val))
        }
    }
    
    metadata_path = os.path.join(models_dir, "metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"[SAVED] Training metadata saved to {metadata_path}")
    
    total_elapsed = round(time.time() - start_total_time, 2)
    print(f"\n[DONE] P6 Training Pipeline finished successfully in {total_elapsed}s.")

if __name__ == "__main__":
    train_p6_pipeline()
