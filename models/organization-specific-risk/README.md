# Organization-Specific Risk Model: Architecture & Integration Framework

This directory contains the integration framework and interface definitions for the **Organization-Specific Cyber Risk Model** for SIH 2026 Problem Statement 26105.

```
P1 + P2 + P3 + P4
        ↓
    Meta Model
        ↓
Organization-Specific Risk Model
        ↓
Expected Annual Loss (EAL)
        ↓
Investment Optimizer
```

> **IMPORTANT:**
> This model is currently in **FRAMEWORK STAGE (UNTRAINED)** awaiting upstream schema completion from the team member developing P1-P4 and the Meta Model.
> In accordance with scientific integrity guidelines:
> - No fake feature names, shapes, or mock probabilities are assumed as ground truth.
> - The model raises `IntegrationContractError` if evaluated without a fulfilled integration contract.
> - The existing baseline model at `models/organization-risk/model.onnx` remains intact as an organization posture scoring surrogate.

---

## Directory Contents

| File | Description |
| :--- | :--- |
| [`organization_specific_model.py`](file:///c:/Users/Kishanraj/SIH26105/SIH26105_NanoX/models/organization-specific-risk/organization_specific_model.py) | Typed dataclasses (`MetaModelResult`, `OrganizationProfile`, `Asset`, etc.) and the adapter class. |
| [`feature_schema.json`](file:///c:/Users/Kishanraj/SIH26105/SIH26105_NanoX/models/organization-specific-risk/feature_schema.json) | JSON Schema defining the 11 input dimensions and the expected output structures. |
| [`metadata.json`](file:///c:/Users/Kishanraj/SIH26105/SIH26105_NanoX/models/organization-specific-risk/metadata.json) | Model metadata documenting pipeline role, training state (`false`), and upstream dependencies. |
| [`MODEL_CARD.md`](file:///c:/Users/Kishanraj/SIH26105/SIH26105_NanoX/models/organization-specific-risk/MODEL_CARD.md) | Standardized Model Card outlining scope, inputs, outputs, and non-claims. |
| [`META_MODEL_INTEGRATION_CONTRACT.md`](file:///c:/Users/Kishanraj/SIH26105/SIH26105_NanoX/META_MODEL_INTEGRATION_CONTRACT.md) | Contract checklist for the upstream team member to fill in real Meta Model schemas. |

---

## Quickstart & Usage

### 1. Default Strict Mode (Contract Enforcement)
When called with an unfulfilled contract, the model fails clearly and loudly:

```python
from models.organization_specific_risk.organization_specific_model import (
    OrganizationSpecificRiskModel,
    MetaModelResult,
    OrganizationProfile,
    Asset,
    SecurityControl,
    BusinessContext,
    FinancialImpact,
    IntegrationContractError
)

model = OrganizationSpecificRiskModel(allow_mock_contract=False)

# Empty or unverified upstream Meta Model output
meta_result = MetaModelResult(is_contract_fulfilled=False)

try:
    result = model.assess_organization_specific_risk(
        meta_result=meta_result,
        profile=OrganizationProfile("ORG-001", "Apex FinCorp", "finance", "large", 1500, 2000, 120),
        assets=[],
        controls=[],
        business=BusinessContext("RBI-CSCF"),
        financial=FinancialImpact(12500000.0, 0.20, 12500000.0)
    )
except IntegrationContractError as e:
    print(f"Failed cleanly as expected: {e}")
```

### 2. Mock Test Mode (For UI / Downstream Pipeline Scaffolding)
For offline UI flow or downstream Knapsack testing before the Meta Model is connected, initialize with `allow_mock_contract=True`:

```python
model = OrganizationSpecificRiskModel(allow_mock_contract=True)
meta_result = MetaModelResult(is_contract_fulfilled=False, meta_score=0.65)

result = model.assess_organization_specific_risk(...)
print(f"EAL: INR {result.expected_annual_loss_inr:,.2f} | Risk: {result.risk_level}")
```

---

## How Upstream Team Connects the Real Meta Model
1. Complete all placeholder sections in [`META_MODEL_INTEGRATION_CONTRACT.md`](file:///c:/Users/Kishanraj/SIH26105/SIH26105_NanoX/META_MODEL_INTEGRATION_CONTRACT.md).
2. Place the trained Meta Model artifact (e.g. `meta_model.onnx`) into `models/meta-model/`.
3. In `organization_specific_model.py`, set `meta_result.is_contract_fulfilled = True` and populate `meta_score` with the verified inference tensor.
