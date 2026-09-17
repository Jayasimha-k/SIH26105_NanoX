"""
scripts/preprocess_p6.py
Forensically De-Biased, Leakage-Free Preprocessing Pipeline for CIC-IDS2017.

Performs:
1. Column whitespace normalization.
2. Removes all 22 leakage, OS fingerprint, mathematical duplicate, and constant features:
   - Leakage: Destination Port
   - Collinear / Exact Duplicates: Fwd Header Length.1, Subflow Fwd Bytes, Subflow Bwd Bytes,
     Avg Fwd Segment Size, Avg Bwd Segment Size, Subflow Fwd Packets, Subflow Bwd Packets, Packet Length Variance
   - OS / TCP Stack Fingerprints: Init_Win_bytes_forward, Init_Win_bytes_backward, min_seg_size_forward
   - Invariant / Near-Zero Variance Flags: Bwd PSH Flags, Bwd URG Flags, Fwd Avg Bytes/Bulk,
     Fwd Avg Packets/Bulk, Fwd Avg Bulk Rate, Bwd Avg Bytes/Bulk, Bwd Avg Packets/Bulk, Bwd Avg Bulk Rate,
     CWE Flag Count, Fwd URG Flags
3. Cleans numeric features (replaces infs, imputes NaNs with medians, downcasts to float32).
4. Enforces CHRONOLOGICAL TIME/CAPTURE-AWARE PARTITIONING:
   Within each capture session, assigns first 70% of chronological flows to Train,
   next 15% to Validation, and final 15% to Untouched Hold-Out Test.
5. Saves clean partitions (joblib and csv.gz) and exports canonical models/p6/feature_schema.json (56 pure behavioral features).
"""

import os
import sys
import glob
import json
import time
# pyrefly: ignore [missing-import]
import joblib
import pandas as pd
import numpy as np

# Exhaustive list of 22 leakage, duplicate, fingerprint, and invariant features
COLUMNS_TO_DROP = [
    # Leakage: Testbed target port memorization
    "Destination Port",
    # 7 Exact duplicates / Collinear metrics
    "Fwd Header Length.1",
    "Subflow Fwd Bytes",
    "Subflow Bwd Bytes",
    "Avg Fwd Segment Size",
    "Avg Bwd Segment Size",
    "Subflow Fwd Packets",
    "Subflow Bwd Packets",
    "Packet Length Variance",
    # 3 OS / Stack Fingerprinting features
    "Init_Win_bytes_forward",
    "Init_Win_bytes_backward",
    "min_seg_size_forward",
    # 10 Invariant / Near-Zero Variance features
    "Bwd PSH Flags",
    "Bwd URG Flags",
    "Fwd Avg Bytes/Bulk",
    "Fwd Avg Packets/Bulk",
    "Fwd Avg Bulk Rate",
    "Bwd Avg Bytes/Bulk",
    "Bwd Avg Packets/Bulk",
    "Bwd Avg Bulk Rate",
    "CWE Flag Count",
    "Fwd URG Flags"
]

def preprocess_dataset(
    raw_dir="data/cic_ids2017/raw",
    processed_dir="data/cic_ids2017/processed",
    schema_dir="models/p6"
):
    start_time = time.time()
    os.makedirs(processed_dir, exist_ok=True)
    os.makedirs(schema_dir, exist_ok=True)
    
    csv_files = sorted(glob.glob(os.path.join(raw_dir, "*.csv")))
    if not csv_files:
        raise FileNotFoundError(f"No CSVs found in {raw_dir}")
        
    print(f"[INFO] Starting chronological preprocessing across {len(csv_files)} capture files...")
    
    train_chunks = []
    val_chunks = []
    test_chunks = []
    
    total_raw_rows = 0
    
    for idx, fpath in enumerate(csv_files, 1):
        fname = os.path.basename(fpath)
        print(f"[{idx}/{len(csv_files)}] Processing {fname} in chronological order...")
        
        file_chunks = []
        for chunk in pd.read_csv(fpath, chunksize=100000, low_memory=False):
            chunk.columns = [c.strip() for c in chunk.columns]
            total_raw_rows += len(chunk)
            
            lbl_col = "Label" if "Label" in chunk.columns else chunk.columns[-1]
            chunk["original_label"] = chunk[lbl_col].astype(str).str.strip()
            chunk["is_malicious"] = (chunk["original_label"].str.upper() != "BENIGN").astype(np.int32)
            file_chunks.append(chunk)
            
        # Combine entire file in chronological sequence
        df_file = pd.concat(file_chunks, ignore_index=True)
        
        # Subsample if extremely large to maintain memory bounds while preserving chronological order
        # For benign-heavy files, sample proportionally across time slices
        mal = df_file[df_file["is_malicious"] == 1]
        ben = df_file[df_file["is_malicious"] == 0]
        
        # Keep up to 35,000 malicious and 35,000 benign per day in chronological order
        if len(mal) > 35000:
            step_m = len(mal) / 35000.0
            idx_m = [int(i * step_m) for i in range(35000)]
            mal = mal.iloc[idx_m]
            
        if len(ben) > 35000:
            step_b = len(ben) / 35000.0
            idx_b = [int(i * step_b) for i in range(35000)]
            ben = ben.iloc[idx_b]
            
        df_sampled = pd.concat([mal, ben]).sort_index()
        n_rows = len(df_sampled)
        
        # Strict Chronological Partitioning:
        # First 70% -> Train, Next 15% -> Validation, Final 15% -> Test
        split_train = int(0.70 * n_rows)
        split_val = int(0.85 * n_rows)
        
        train_part = df_sampled.iloc[:split_train]
        val_part = df_sampled.iloc[split_train:split_val]
        test_part = df_sampled.iloc[split_val:]
        
        train_chunks.append(train_part)
        val_chunks.append(val_part)
        test_chunks.append(test_part)
        print(f"  Chronological split: Train={len(train_part):,}, Val={len(val_part):,}, Test={len(test_part):,}")
        
    train_df = pd.concat(train_chunks, ignore_index=True)
    val_df = pd.concat(val_chunks, ignore_index=True)
    test_df = pd.concat(test_chunks, ignore_index=True)
    
    print(f"\n[INFO] Time-Aware Partitions Assembled:")
    print(f"  Train: {len(train_df):,} flows (Malicious: {(train_df['is_malicious']==1).sum():,}, Benign: {(train_df['is_malicious']==0).sum():,})")
    print(f"  Val:   {len(val_df):,} flows (Malicious: {(val_df['is_malicious']==1).sum():,}, Benign: {(val_df['is_malicious']==0).sum():,})")
    print(f"  Test:  {len(test_df):,} flows (Malicious: {(test_df['is_malicious']==1).sum():,}, Benign: {(test_df['is_malicious']==0).sum():,})")
    
    # Drop all 22 leakage/duplicate/fingerprint/invariant columns
    existing_drops = [c for c in COLUMNS_TO_DROP if c in train_df.columns]
    print(f"\n[INFO] Purging {len(existing_drops)} leakage, duplicate, fingerprint, and constant columns:")
    for d in existing_drops:
        print(f"  - {d}")
        
    train_df = train_df.drop(columns=existing_drops + ["Label"], errors="ignore")
    val_df = val_df.drop(columns=existing_drops + ["Label"], errors="ignore")
    test_df = test_df.drop(columns=existing_drops + ["Label"], errors="ignore")
    
    feature_cols = [c for c in train_df.columns if c not in ["is_malicious", "original_label"]]
    print(f"\n[INFO] Final Pure Behavioral Feature Count: {len(feature_cols)}")
    
    # Numeric conditioning: compute medians strictly on TRAIN set, apply to Val and Test
    imputation_values = {}
    for col in feature_cols:
        s_tr = pd.to_numeric(train_df[col], errors='coerce').replace([np.inf, -np.inf], np.nan)
        med = float(s_tr.median()) if not np.isnan(s_tr.median()) else 0.0
        imputation_values[col] = med
        
        train_df[col] = s_tr.fillna(med).astype(np.float32)
        
        s_val = pd.to_numeric(val_df[col], errors='coerce').replace([np.inf, -np.inf], np.nan)
        val_df[col] = s_val.fillna(med).astype(np.float32)
        
        s_ts = pd.to_numeric(test_df[col], errors='coerce').replace([np.inf, -np.inf], np.nan)
        test_df[col] = s_ts.fillna(med).astype(np.float32)
        
    # Save partitions to joblib (fast binary) and csv.gz (cross-platform)
    train_joblib = os.path.join(processed_dir, "train.joblib")
    val_joblib = os.path.join(processed_dir, "val.joblib")
    test_joblib = os.path.join(processed_dir, "test.joblib")
    
    train_csv = os.path.join(processed_dir, "train.csv.gz")
    val_csv = os.path.join(processed_dir, "val.csv.gz")
    test_csv = os.path.join(processed_dir, "test.csv.gz")
    
    joblib.dump(train_df, train_joblib, compress=3)
    joblib.dump(val_df, val_joblib, compress=3)
    joblib.dump(test_df, test_joblib, compress=3)
    
    train_df.to_csv(train_csv, compression="gzip", index=False)
    val_df.to_csv(val_csv, compression="gzip", index=False)
    test_df.to_csv(test_csv, compression="gzip", index=False)
    
    print(f"\n[SAVED] Train partition: {len(train_df):,} rows -> {train_joblib} & {train_csv}")
    print(f"[SAVED] Validation partition: {len(val_df):,} rows -> {val_joblib} & {val_csv}")
    print(f"[SAVED] Test partition: {len(test_df):,} rows -> {test_joblib} & {test_csv}")
    
    # Feature schema
    schema = {
        "dataset_name": "CIC-IDS2017",
        "total_source_rows": total_raw_rows,
        "processed_rows": len(train_df) + len(val_df) + len(test_df),
        "feature_count": len(feature_cols),
        "feature_names": feature_cols,
        "target_column": "is_malicious",
        "original_label_column": "original_label",
        "dropped_columns": existing_drops,
        "split_methodology": "Chronological Time-Aware Partitioning (70% Train, 15% Val, 15% Hold-out Test)",
        "train_rows": len(train_df),
        "val_rows": len(val_df),
        "test_rows": len(test_df),
        "imputation_values": imputation_values,
        "dtypes": {c: "float32" for c in feature_cols},
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    
    schema_path = os.path.join(schema_dir, "feature_schema.json")
    with open(schema_path, "w", encoding="utf-8") as f:
        json.dump(schema, f, indent=2)
    print(f"[SAVED] Feature schema saved to {schema_path}")
    
    elapsed = round(time.time() - start_time, 2)
    print(f"[SUCCESS] Preprocessing completed in {elapsed}s.")
    return schema

if __name__ == "__main__":
    preprocess_dataset()
