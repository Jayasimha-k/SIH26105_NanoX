# P6: Empirical Network Behavioral Evidence Model

Part of the **AI-Powered Continuous Cyber Risk Quantification and Investment Optimization Platform**  
*SIH 2026 Problem Statement 26105 | Team Nano X*

---

## 1. Directory Structure

```
models/p6/
├── CyberOptRQ_P6_CIC2017_XGBoost_v1.pkl  # Primary trained XGBoost model artifact
├── baseline_logistic_regression.pkl     # Linear baseline model artifact
├── feature_schema.json                  # Canonical schema (68 features, imputations, dtypes)
├── metadata.json                        # Training environment, hyperparameters, and timing
├── MODEL_CARD.md                        # Formal AI Model Card & forensic documentation
└── README.md                            # Directory overview and quickstart guide
```

---

## 2. Quickstart Inference Example

```python
from backend.app.ml.p6 import P6NetworkEvidenceModel

# Initialize inference engine (automatically loads schema and weights)
p6 = P6NetworkEvidenceModel()

# Sample flow telemetry
flow = {
    "Flow Duration": 12000.0,
    "Total Fwd Packets": 10.0,
    "Total Backward Packets": 8.0,
    "Flow Packets/s": 1500.0,
    "SYN Flag Count": 1.0,
    "Fwd Packet Length Mean": 450.0
}

# Run inference
result = p6.predict(flow)
print(result)
# Output:
# {
#   "malicious_probability": 0.0142,
#   "is_malicious": False,
#   "confidence_score": 0.9858,
#   "risk_tier": "LOW",
#   "model_version": "CyberOptRQ_P6_CIC2017_XGBoost_v1"
# }
```

---

## 3. Evidence Fusion with P5

```python
from backend.app.ml.fusion_layer import fuse_risk_evidence

# Given P5 prior risk from vulnerability/threat ensemble
p5_prior = 0.82
p6_empirical = result["malicious_probability"]

# Convex combination with w_p6 = 0.25
fused = fuse_risk_evidence(p5_risk_score=p5_prior, p6_network_evidence=p6_empirical, p6_weight=0.25)
print(f"Fused Risk: {fused['fused_probability']} (Prior: {p5_prior})")
```

---

## 4. Reproducibility

- **Local Execution:**
  ```bash
  python scripts/preprocess_p6.py
  python scripts/train_p6.py
  python scripts/evaluate_p6.py
  ```

- **Google Colab (NVIDIA T4 GPU):**
  Open and run `notebooks/P6_CIC2017_Training_Colab.ipynb`.
