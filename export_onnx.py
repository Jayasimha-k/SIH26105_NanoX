"""
export_onnx.py
Exports trained Scikit-learn / XGBoost model pipeline to ONNX format.
Enables 100% offline, cross-platform inference with onnxruntime.
"""

import os
import joblib
import numpy as np
import pandas as pd
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType, StringTensorType, Int64TensorType
from train import CATEGORICAL_FEATURES, BOOLEAN_FEATURES, NUMERIC_FEATURES

def export_to_onnx(model_path: str = "models/organization-risk/model_pipeline.pkl",
                   onnx_output_path: str = "models/organization-risk/model.onnx"):
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model pipeline {model_path} not found. Run train.py first.")

    pipeline = joblib.load(model_path)

    # Define initial types for all inputs
    initial_types = []
    for col in CATEGORICAL_FEATURES:
        initial_types.append((col, StringTensorType([None, 1])))
    for col in BOOLEAN_FEATURES:
        initial_types.append((col, Int64TensorType([None, 1])))
    for col in NUMERIC_FEATURES:
        initial_types.append((col, FloatTensorType([None, 1])))

    print("Converting model pipeline to ONNX...")
    try:
        onnx_model = convert_sklearn(
            pipeline,
            name="OrganizationRiskModel",
            initial_types=initial_types,
            target_opset=15
        )

        with open(onnx_output_path, "wb") as f:
            f.write(onnx_model.SerializeToString())

        print(f"Successfully exported ONNX model to: {onnx_output_path}")

        # Verify ONNX model inference using onnxruntime
        import onnxruntime as rt
        sess = rt.InferenceSession(onnx_output_path, providers=["CPUExecutionProvider"])
        print("ONNX Runtime session initialized successfully.")
        print(f"Model Inputs: {[inp.name for inp in sess.get_inputs()]}")
        print(f"Model Outputs: {[out.name for out in sess.get_outputs()]}")
        return True

    except Exception as e:
        print(f"Error during ONNX conversion: {e}")
        # Fallback: create an ONNX model from numerical features or save standard ONNX
        raise e

if __name__ == "__main__":
    export_to_onnx()
