"""
scripts/audit_p6_dataset.py
Forensic Dataset Audit for CIC-IDS2017 (MachineLearningCSV)
Performs strict, memory-conscious verification of all 8 flow CSVs.
Outputs:
- reports/p6_dataset_audit.json
- reports/p6_dataset_audit.md
"""

import os
import sys
import glob
import json
import time
from collections import Counter
import pandas as pd
import numpy as np

def run_audit(raw_dir="data/cic_ids2017/raw", reports_dir="reports"):
    start_time = time.time()
    os.makedirs(reports_dir, exist_ok=True)
    
    csv_files = sorted(glob.glob(os.path.join(raw_dir, "*.csv")))
    if not csv_files:
        print(f"[ERROR] No CSV files found in {raw_dir}!")
        sys.exit(1)
        
    print(f"[INFO] Found {len(csv_files)} CSV files. Beginning forensic audit...")

    file_audits = []
    total_rows = 0
    overall_labels = Counter()
    all_columns_set = None
    column_null_counts = Counter()
    column_inf_counts = Counter()
    total_duplicates = 0
    column_dtypes_sample = {}
    constant_columns = set()

    for idx, fpath in enumerate(csv_files, 1):
        fname = os.path.basename(fpath)
        fsize = os.path.getsize(fpath)
        print(f"[{idx}/{len(csv_files)}] Auditing {fname} ({fsize:,} bytes)...")
        
        # Read header only to check columns
        header_df = pd.read_csv(fpath, nrows=2)
        cols = [c.strip() for c in header_df.columns]
        
        if all_columns_set is None:
            all_columns_set = cols
            constant_candidate_cols = set(cols)
        else:
            if cols != all_columns_set:
                print(f"[WARNING] Column mismatch in {fname}!")
        
        # Stream file in chunks to conserve RAM
        file_rows = 0
        file_labels = Counter()
        file_nulls = Counter()
        file_infs = Counter()
        
        chunksize = 100000
        for chunk in pd.read_csv(fpath, chunksize=chunksize, low_memory=False):
            # Clean column names
            chunk.columns = [c.strip() for c in chunk.columns]
            nrows = len(chunk)
            file_rows += nrows
            total_rows += nrows
            
            # Label column audit
            label_col = "Label" if "Label" in chunk.columns else cols[-1]
            labels_in_chunk = chunk[label_col].astype(str).str.strip()
            chunk_label_counts = Counter(labels_in_chunk)
            file_labels.update(chunk_label_counts)
            overall_labels.update(chunk_label_counts)
            
            # Check nulls and infs
            for c in chunk.columns:
                n_null = int(chunk[c].isna().sum())
                if n_null > 0:
                    file_nulls[c] += n_null
                    column_null_counts[c] += n_null
                
                # Check infinite values for numeric columns
                if pd.api.types.is_numeric_dtype(chunk[c]):
                    n_inf = int(np.isinf(chunk[c]).sum())
                    if n_inf > 0:
                        file_infs[c] += n_inf
                        column_inf_counts[c] += n_inf
            
            # Sample types
            if not column_dtypes_sample:
                for c in chunk.columns:
                    column_dtypes_sample[c] = str(chunk[c].dtype)

        file_audits.append({
            "file_name": fname,
            "file_size_bytes": fsize,
            "rows": file_rows,
            "columns_count": len(cols),
            "label_distribution": dict(file_labels),
            "null_counts": dict(file_nulls),
            "inf_counts": dict(file_infs)
        })
        print(f"       -> Rows: {file_rows:,} | Unique labels: {len(file_labels)}")

    # Check for suspicious identifier columns & leakage candidates
    suspicious_cols = []
    suspicious_patterns = ["port", "ip", "time", "id", "flow_id", "timestamp", "mac", "address"]
    for c in all_columns_set:
        c_lower = c.lower()
        for p in suspicious_patterns:
            if p in c_lower:
                suspicious_cols.append(c)
                break
    suspicious_cols = sorted(list(set(suspicious_cols)))

    # Compute overall label percentages
    label_summary = {}
    for lbl, count in overall_labels.most_common():
        pct = round((count / total_rows) * 100.0, 4)
        label_summary[lbl] = {
            "count": count,
            "percentage": pct
        }

    elapsed = round(time.time() - start_time, 2)
    print(f"\n[INFO] Audit finished in {elapsed}s. Total rows: {total_rows:,}")

    audit_result = {
        "dataset_name": "CIC-IDS2017",
        "dataset_source": "MachineLearningCSV.zip",
        "audit_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "execution_time_seconds": elapsed,
        "number_of_files": len(csv_files),
        "total_rows": total_rows,
        "columns_count": len(all_columns_set),
        "exact_column_names": all_columns_set,
        "target_column": "Label",
        "unique_labels_count": len(overall_labels),
        "class_distribution": label_summary,
        "columns_with_nulls": dict(column_null_counts),
        "columns_with_infs": dict(column_inf_counts),
        "suspicious_identifier_columns": suspicious_cols,
        "file_details": file_audits
    }

    # Save JSON report
    json_path = os.path.join(reports_dir, "p6_dataset_audit.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(audit_result, f, indent=2)
    print(f"[SAVED] Audit JSON saved to {json_path}")

    # Generate Markdown report
    md_path = os.path.join(reports_dir, "p6_dataset_audit.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# Forensic Dataset Audit: CIC-IDS2017 (MachineLearningCSV)\n\n")
        f.write(f"**Audit Execution Time:** {audit_result['audit_timestamp']}  \n")
        f.write(f"**Total Flow Files:** {len(csv_files)}  \n")
        f.write(f"**Total Network Flows (Rows):** {total_rows:,}  \n")
        f.write(f"**Total Features (Columns):** {len(all_columns_set)} (including Label)  \n")
        f.write(f"**Target Column:** `Label`  \n\n")

        f.write("## 1. File Inventory & Breakdown\n\n")
        f.write("| # | File Name | Size (Bytes) | Flow Rows | Unique Classes |\n")
        f.write("|---|---|---|---|---|\n")
        for i, fa in enumerate(file_audits, 1):
            f.write(f"| {i} | `{fa['file_name']}` | {fa['file_size_bytes']:,} | {fa['rows']:,} | {len(fa['label_distribution'])} |\n")
        f.write(f"| **TOTAL** | **8 files** | **{sum(fa['file_size_bytes'] for fa in file_audits):,}** | **{total_rows:,}** | **{len(overall_labels)}** |\n\n")

        f.write("## 2. Verified Class Distribution\n\n")
        f.write("| Original Label | Flow Count | Percentage (%) | Proposed Binary Class |\n")
        f.write("|---|---|---|---|\n")
        for lbl, data in label_summary.items():
            is_benign = lbl.upper() == "BENIGN"
            binary_map = "0 (BENIGN)" if is_benign else "1 (MALICIOUS/ATTACK)"
            f.write(f"| **`{lbl}`** | {data['count']:,} | {data['percentage']:.4f}% | {binary_map} |\n")
        f.write("\n")

        f.write("## 3. Data Hygiene & Anomaly Diagnostics\n\n")
        f.write(f"- **Columns containing NaN values:** {len(column_null_counts)}\n")
        for col, count in column_null_counts.items():
            f.write(f"  - `{col}`: {count:,} missing values ({count / total_rows * 100:.4f}%)\n")
        f.write(f"- **Columns containing Infinite values (`inf` / `-inf`):** {len(column_inf_counts)}\n")
        for col, count in column_inf_counts.items():
            f.write(f"  - `{col}`: {count:,} infinite values ({count / total_rows * 100:.4f}%)\n")
        f.write("\n")

        f.write("## 4. Potential Leakage & Suspicious Identifier Features\n\n")
        f.write("Features flagged for strict leakage review:\n")
        for sc in suspicious_cols:
            f.write(f"- `{sc}`\n")
        f.write("\n")

        f.write("## 5. Complete Feature List\n\n")
        f.write("<details>\n<summary>Click to expand all 79 feature names</summary>\n\n")
        for i, col in enumerate(all_columns_set, 1):
            f.write(f"{i}. `{col}`\n")
        f.write("\n</details>\n")

    print(f"[SAVED] Audit Markdown saved to {md_path}")
    return audit_result

if __name__ == "__main__":
    run_audit()
