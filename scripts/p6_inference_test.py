"""
scripts/p6_inference_test.py
Standalone Diagnostic and Benchmark Suite for P6 Network Evidence Inference Engine.
Validates:
1. Engine initialization with model and schema
2. Prediction on synthetic Benign flow
3. Prediction on synthetic Attack flow
4. Resilience against missing/incomplete features
5. Inference latency benchmark (single-flow ms & batch throughput)
"""

import os
import sys
import time
import numpy as np
import pandas as pd

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from app.ml.p6 import P6NetworkEvidenceModel

def run_inference_tests():
    print("=" * 60)
    print("P6 NETWORK EVIDENCE INFERENCE TEST SUITE")
    print("=" * 60)
    
    # 1. Initialize engine
    print("[1/5] Initializing P6NetworkEvidenceModel...")
    engine = P6NetworkEvidenceModel()
    print(f"[OK] Model loaded. Features monitored: {len(engine.feature_names)}")
    
    # 2. Test Benign Flow
    print("\n[2/5] Testing Benign Traffic Profile...")
    benign_flow = {f: engine.imputations.get(f, 0.0) for f in engine.feature_names}
    benign_flow["Flow Duration"] = 50000.0
    benign_flow["Total Fwd Packets"] = 5.0
    benign_flow["Total Backward Packets"] = 4.0
    benign_flow["Flow Bytes/s"] = 1200.0
    benign_flow["Flow Packets/s"] = 180.0
    
    res_benign = engine.predict(benign_flow)
    print(f"Benign Prediction Result: {res_benign}")
    assert 0.0 <= res_benign["malicious_probability"] <= 1.0, "Probability out of bounds!"
    
    # 3. Test Attack Flow (High volume flood characteristics)
    print("\n[3/5] Testing Volumetric Attack Traffic Profile...")
    attack_flow = {f: engine.imputations.get(f, 0.0) for f in engine.feature_names}
    attack_flow["Flow Duration"] = 1000.0
    attack_flow["Total Fwd Packets"] = 500.0
    attack_flow["Total Backward Packets"] = 0.0
    attack_flow["Flow Packets/s"] = 500000.0
    attack_flow["SYN Flag Count"] = 1.0
    attack_flow["Fwd Packet Length Max"] = 1460.0
    
    res_attack = engine.predict(attack_flow)
    print(f"Attack Prediction Result: {res_attack}")
    assert 0.0 <= res_attack["malicious_probability"] <= 1.0, "Probability out of bounds!"
    
    # 4. Test Missing Feature Resilience
    print("\n[4/5] Testing Resilience with Incomplete Telemetry (Only 3 features provided)...")
    partial_flow = {
        "Flow Duration": 12000.0,
        "Total Fwd Packets": 2.0,
        "Flow Bytes/s": 450.0
    }
    res_partial = engine.predict(partial_flow)
    print(f"Partial Flow Result: {res_partial}")
    assert "malicious_probability" in res_partial
    
    # 5. Latency & Throughput Benchmark
    print("\n[5/5] Benchmarking Latency & Throughput...")
    # Single flow latency (100 runs)
    latencies = []
    for _ in range(100):
        t0 = time.perf_counter()
        _ = engine.predict_proba(benign_flow)
        latencies.append((time.perf_counter() - t0) * 1000.0)
    avg_latency_ms = round(np.mean(latencies), 3)
    p95_latency_ms = round(np.percentile(latencies, 95), 3)
    
    # Batch throughput (10,000 synthetic flows)
    batch_size = 10000
    batch_data = pd.DataFrame([benign_flow] * batch_size)
    t_batch_start = time.perf_counter()
    _ = engine.predict_proba(batch_data)
    batch_duration = time.perf_counter() - t_batch_start
    throughput_fps = round(batch_size / batch_duration, 1)
    
    print(f"Single-flow Latency: Avg = {avg_latency_ms} ms | P95 = {p95_latency_ms} ms")
    print(f"Batch Throughput:   {throughput_fps:,.1f} flows/second (Batch size: {batch_size:,})")
    
    print("\n" + "=" * 60)
    print("[ALL PASSED] P6 Inference Test Suite completed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    run_inference_tests()
