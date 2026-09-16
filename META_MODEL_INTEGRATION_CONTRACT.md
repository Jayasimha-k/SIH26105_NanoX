# Meta Model Integration Contract & Specification
**SIH 2026 Problem Statement 26105**
*AI-Powered Continuous Cyber Risk Quantification and Investment Optimization Platform*

> [!IMPORTANT]
> **ACTION REQUIRED BY TEAM MEMBER DEVELOPING P1–P4 AND META MODEL**
> This file establishes the integration boundary between the upstream **Meta Model** and the downstream **Organization-Specific Risk Model**.
> Until the placeholders below are filled with the verified schemas, the Organization-Specific Risk Model will strictly fail with an `IntegrationContractError` rather than fabricating invented values.

---

## Architecture Flow

```
+-------------------------------------------------------------+
|               BASE MODELS (Under Development)               |
|   [P1] Threat Intelligence & Actor Profiling                 |
|   [P2] Vulnerability & Exploitability Analysis              |
|   [P3] Attack Vector & Surface Correlation                  |
|   [P4] Defensive Telemetry & Signal Anomaly                 |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                         META MODEL                          |
|   Ensemble / Stacking Classifier synthesizing P1 - P4       |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|              ORGANIZATION-SPECIFIC RISK MODEL               |
|   Consumes:                                                 |
|   1. Meta Model Output                                      |
|   2. Organization Profile (Size, Sector, Endpoints)         |
|   3. Asset Inventory & Exposure Tiers                       |
|   4. Asset Criticality (1.0 to 10.0 scale)                  |
|   5. Vulnerability State (CVEs, CVSS)                       |
|   6. Security Controls & Effectiveness                      |
|   7. Business Context & Regimes (RBI, DPDP)                 |
|   8. Financial Impact (SLE, ARO)                            |
|   9. Incident History                                       |
|  10. Baseline Posture Prior (models/organization-risk/)     |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                EXPECTED ANNUAL LOSS (EAL)                   |
|   EAL = Probability of Loss Event × Financial Impact (INR)  |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|               KNAPSACK INVESTMENT OPTIMIZER                 |
|   Maximized Risk Reduction per INR Capital Allocation       |
+-------------------------------------------------------------+
```

---

## Integration Contract Placeholders (TODO)

### 1. Model Artifact Location & Version
- **TODO [Model Path]:** `[SPECIFY ABSOLUTE OR RELATIVE PATH, e.g., models/meta-model/meta_model.onnx]`
- **TODO [Model Format]:** `[ONNX / PyTorch / Scikit-Learn Joblib / XGBoost JSON]`
- **TODO [Model Version]:** `[e.g., v1.0.0-rc1]`
- **TODO [Input Signature]:** `[e.g., float32 tensor of shape (batch_size, num_features)]`

### 2. Upstream Base Model Specifications
| Model | Domain | Status | Output Name | Expected Output Range |
| :--- | :--- | :--- | :--- | :--- |
| **P1** | Threat Intelligence | `[TODO: IN DEVELOPMENT]` | `[TODO: e.g., p1_threat_score]` | `[TODO: 0.0 - 1.0]` |
| **P2** | Vulnerability / Exploit | `[TODO: IN DEVELOPMENT]` | `[TODO: e.g., p2_exploit_prob]` | `[TODO: 0.0 - 1.0]` |
| **P3** | Attack Vector Correlation| `[TODO: IN DEVELOPMENT]` | `[TODO: e.g., p3_vector_severity]` | `[TODO: 0.0 - 1.0]` |
| **P4** | Defensive Telemetry | `[TODO: IN DEVELOPMENT]` | `[TODO: e.g., p4_telemetry_anomaly]`| `[TODO: 0.0 - 1.0]` |

### 3. Actual Meta Model Input Features
List the exact feature names expected by the Meta Model:
```json
[
  "TODO: FEATURE_NAME_1",
  "TODO: FEATURE_NAME_2",
  "TODO: FEATURE_NAME_3",
  "TODO: FEATURE_NAME_N"
]
```

### 4. Actual Meta Model Output Schema
- **TODO [Primary Output Name]:** `[e.g., meta_risk_score or exploitation_probability]`
- **TODO [Output Data Type]:** `[float32 / float64]`
- **TODO [Output Range]:** `[e.g., [0.0, 1.0] continuous probability]`
- **TODO [Interpretation]:** `[Describe what a value of 0.85 indicates mathematically]`
- **TODO [Auxiliary Outputs]:** `[e.g., uncertainty/confidence interval, attention weights, or logits]`

### 5. Required Preprocessing Pipeline
- **TODO [Scaler/Transformer Location]:** `[e.g., models/meta-model/preprocessor.pkl]`
- **TODO [Categorical Encoders]:** `[List any one-hot or target encoders needed]`
- **TODO [Missing Value Strategy]:** `[Imputation strategy: median / constant / zero-fill]`

---

## Contract Enforcement & Verification

In [`models/organization-specific-risk/organization_specific_model.py`](file:///c:/Users/Kishanraj/SIH26105/SIH26105_NanoX/models/organization-specific-risk/organization_specific_model.py):

```python
@dataclass
class MetaModelResult:
    is_contract_fulfilled: bool = False
    meta_model_version: Optional[str] = None
    meta_score: Optional[float] = None
    raw_outputs: Dict[str, Any] = field(default_factory=dict)
    confidence: Optional[float] = None
```

If `is_contract_fulfilled == False` and `allow_mock_contract == False`, any attempt to assess organization risk will raise:
```
IntegrationContractError: MetaModelResult contract is unfulfilled!
The real P1-P4 and Meta Model schema have not been plugged in yet.
See META_MODEL_INTEGRATION_CONTRACT.md to fulfill the schema.
```

---

## Verification Checklist for Full Integration

- [ ] Real Meta Model artifact trained, converted to ONNX, and placed in repository.
- [ ] Feature names, vector dimensions, and data types documented in this contract.
- [ ] Output range and calibration verified against real threat scenarios.
- [ ] Unit tests pass demonstrating `is_contract_fulfilled = True` without synthetic fallback.
- [ ] Defensible financial breach loss targets curated for EAL calculation.
- [ ] Knapsack optimizer verified against real cost-benefit trade-offs.
