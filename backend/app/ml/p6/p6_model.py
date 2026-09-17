"""
backend/app/ml/p6/p6_model.py
Inference Engine for P6 Empirical Network Behavioral Evidence Model.
Consumes network flow telemetry and predicts empirical maliciousness probability:
    P(Malicious Flow) in [0.0, 1.0]

Completely offline, deterministic, resilient to missing features, and fully validated
against the 68 behavioral features established during the CIC-IDS2017 training pipeline.
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
from typing import Dict, List, Union, Any

DEFAULT_MODEL_PATH = os.path.abspath(os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "..", "models", "p6", "CyberOptRQ_P6_CIC2017_XGBoost_v1.pkl"
))
DEFAULT_SCHEMA_PATH = os.path.abspath(os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "..", "models", "p6", "feature_schema.json"
))

class P6NetworkEvidenceModel:
    def __init__(self, model_path: str = DEFAULT_MODEL_PATH, schema_path: str = DEFAULT_SCHEMA_PATH):
        self.model_path = model_path
        self.schema_path = schema_path
        self.model = None
        self.schema = None
        self.feature_names = []
        self.imputations = {}
        self._load()
        
    def _load(self):
        if not os.path.exists(self.schema_path):
            raise FileNotFoundError(f"P6 feature schema not found at: {self.schema_path}")
        with open(self.schema_path, "r", encoding="utf-8") as f:
            self.schema = json.load(f)
        self.feature_names = self.schema["feature_names"]
        self.imputations = self.schema.get("imputation_values", {})
        
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"P6 trained model artifact not found at: {self.model_path}")
        with open(self.model_path, "rb") as f:
            self.model = pickle.load(f)
            
    def prepare_features(self, data: Union[Dict[str, Any], List[Dict[str, Any]], pd.DataFrame]) -> np.ndarray:
        """
        Cleans, imputes, orders, and downcasts input flow features into numpy float32 matrix.
        """
        if isinstance(data, dict):
            df = pd.DataFrame([data])
        elif isinstance(data, list):
            df = pd.DataFrame(data)
        elif isinstance(data, pd.DataFrame):
            df = data.copy()
        else:
            raise ValueError(f"Unsupported data type: {type(data)}")
            
        # Strip whitespace from column names if present
        df.columns = [str(c).strip() for c in df.columns]
        
        # Ensure all required features are present
        for col in self.feature_names:
            if col not in df.columns:
                df[col] = self.imputations.get(col, 0.0)
            else:
                # Convert to numeric, replace infs/nans with imputation median
                s = pd.to_numeric(df[col], errors='coerce')
                s = s.replace([np.inf, -np.inf], np.nan)
                med = self.imputations.get(col, 0.0)
                df[col] = s.fillna(med)
                
        # Reorder columns strictly according to schema
        X = df[self.feature_names].values.astype(np.float32)
        return X
        
    def predict_proba(self, data: Union[Dict[str, Any], List[Dict[str, Any]], pd.DataFrame]) -> np.ndarray:
        """
        Returns array of probabilities P(Malicious Flow) in [0.0, 1.0].
        """
        X = self.prepare_features(data)
        probs = self.model.predict_proba(X)
        return probs[:, 1]
        
    def predict(self, data: Union[Dict[str, Any], List[Dict[str, Any]], pd.DataFrame], threshold: float = 0.5) -> Dict[str, Any]:
        """
        Single/batch inference with diagnostic telemetry and classification.
        """
        probs = self.predict_proba(data)
        results = []
        for p in probs:
            is_malicious = bool(p >= threshold)
            risk_tier = "CRITICAL" if p >= 0.85 else ("HIGH" if p >= 0.65 else ("MEDIUM" if p >= 0.40 else "LOW"))
            results.append({
                "malicious_probability": round(float(p), 4),
                "is_malicious": is_malicious,
                "confidence_score": round(float(max(p, 1 - p)), 4),
                "risk_tier": risk_tier,
                "model_version": "CyberOptRQ_P6_CIC2017_XGBoost_v1"
            })
            
        if len(results) == 1:
            return results[0]
        return {"predictions": results, "batch_size": len(results)}
