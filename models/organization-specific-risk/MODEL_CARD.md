# Model Card: Organization-Specific Risk Model (Framework & Integration Stage)

## 1. Model Details
- **Model Name:** Organization-Specific Cyber Risk Model
- **Identifier:** `organization-specific-risk`
- **Version:** `0.1.0-STAGED_INTERFACE`
- **Date:** September 2026
- **Status:** **FRAMEWORK & INTEGRATION STAGE (UNTRAINED)**
- **Architecture Role:** Layer 2 Organization Quantification & EAL Engine
- **Primary Maintainer:** SIH 2026 Problem Statement 26105 Team

---

## 2. Intended Use & Architecture Flow
The Organization-Specific Risk Model is designed to bridge multi-source threat intelligence with organization-specific attack surfaces, business criticalities, and financial loss factors:

```
P1 + P2 + P3 + P4  (Base Models)
        ↓
    Meta Model     (Threat Synthesis & Exploitation Scoring)
        ↓
Organization-Specific Risk Model (Context, Asset Exposure & Posture Synthesis)
        ↓
Expected Annual Loss (EAL = Probability of Loss Event × Financial Impact)
        ↓
Knapsack Investment Optimizer (ROI & Budget Allocation)
```

### Relationship with Existing Models:
- **`models/organization-risk/model.onnx`**: Represents the previously created methodology-derived organization posture scoring surrogate (NIST CSF 2.0 alignment, Holdout $R^2=0.9864$). It is kept intact as an optional baseline prior.
- **`models/organization-specific-risk/`**: The **new** model framework that consumes Meta Model outputs, asset-level telemetry, and business financials to calculate dollar-denominated Expected Annual Loss (EAL).

---

## 3. Input Specification (11 Dimensions)
The model consumes 11 operational dimensions:
1. **Meta Model Output:** Upstream probability/threat score synthesized from P1-P4 (awaiting schema).
2. **Organization Profile:** Size, industry sector, employee count, endpoint/server fleet.
3. **Asset Inventory:** Individual hardware, software, cloud, and operational technology assets.
4. **Asset Criticality:** Normalized business criticality ranking (1.0 to 10.0 scale).
5. **Asset Exposure:** Network tier (`INTERNET_FACING`, `INTERNAL_PROTECTED`, `AIR_GAPPED_ISOLATED`).
6. **Vulnerability State:** Real CVE IDs, CVSS v3/v4 metrics, and exploitability status.
7. **Security Controls:** Active controls, MFA coverage, backup states, EDR deployment, effectiveness.
8. **Business Context:** Applicable compliance regimes (RBI-CSCF, DPDP Act 2023, ISO 27001), downtime cost/hr.
9. **Financial Impact:** Single Loss Expectancy (SLE in INR), Annualized Rate of Occurrence (ARO).
10. **Incident History:** Historical incident count and past breach loss amounts.
11. **Optional Posture Baseline:** Inferential score from `models/organization-risk/model.onnx`.

---

## 4. Output Specification
- **`probability_of_event`**: $P(\text{Breach Event}) \in [0.01, 0.99]$.
- **`financial_impact_inr`**: Monetary exposure in Indian Rupees (INR).
- **`expected_annual_loss_inr`**: $\text{EAL} = \text{Probability} \times \text{Financial Impact}$.
- **`risk_level`**: Discrete qualitative categorization (`Low`, `Moderate`, `High`, `Critical`).
- **`model_confidence`**: Confidence calibration metric reflecting data completeness and contract status.
- **`top_risk_drivers`**: Ranked list of primary exposure sources driving the quantification.

---

## 5. Explicit Constraints & Integrity Assurances
In strict accordance with scientific integrity guidelines:
- **No Untrained Claims:** This model is explicitly documented as **untrained**.
- **No Invented Schemas:** Feature names, shapes, and weights for P1-P4 and the Meta Model are not fabricated.
- **No Fabricated EAL Datasets:** Synthetic EAL datasets have not been invented.
- **Fail-Safe Contract Enforcement:** If the upstream Meta Model output fails to fulfill the contract, execution raises `IntegrationContractError`.

---

## 6. Next Steps for Completion
1. Upstream team member defines the real Meta Model output schema in [`META_MODEL_INTEGRATION_CONTRACT.md`](file:///c:/Users/Kishanraj/SIH26105/SIH26105_NanoX/META_MODEL_INTEGRATION_CONTRACT.md).
2. Curate defensible incident loss data (e.g., Ponemon / IBM Cost of a Data Breach benchmarks for Indian enterprise sectors).
3. Train and validate the surrogate or ensemble against verified financial risk distributions.
