# Organization Risk Model Plugin (`models/organization-risk`)

This folder contains the packaged, offline-capable machine learning model for enterprise cybersecurity posture assessment and continuous risk quantification.

## Plugin Structure
```
models/organization-risk/
├── model.onnx               # Portable ONNX runtime inference model
├── model_pipeline.pkl       # Native Scikit-Learn pipeline (fallback)
├── metadata.json            # Model specifications, author, and version
├── feature_schema.json      # Tabular input schema
├── preprocessing.json       # Feature mappings and baseline benchmarks
├── evaluation_report.json   # MAE, RMSE, R2, and top risk factors
└── README.md                # Usage and deployment documentation
```

## How to Run Inference

### 1. With Python ONNX Runtime (Completely Offline)
```python
import onnxruntime as rt
import numpy as np

session = rt.InferenceSession("models/organization-risk/model.onnx", providers=["CPUExecutionProvider"])
# Pass input dictionary matching feature_schema.json
```

### 2. With the Local API
```bash
python api.py
```
- **POST** `http://localhost:8005/api/v1/organization-risk/predict`
- **POST** `http://localhost:8005/api/v1/organization-risk/optimize`
- **GET**  `http://localhost:8005/api/v1/organization-risk/health`
