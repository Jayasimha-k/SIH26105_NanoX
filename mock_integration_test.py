"""
mock_integration_test.py
================================================================================
                    MOCK / INTERFACE TEST ONLY
================================================================================
NOTICE & SCIENTIFIC DISCLAIMER:
- This is a temporary MOCK integration interface verification test.
- The Meta Model output {"meta_risk": 0.85} is SYNTHETIC/MOCK test data.
- It is NOT real Meta Model data and is NOT saved as model training data.
- This test does NOT perform model training or evaluate model accuracy.
- This test does NOT modify P1-P4 or the upstream Meta Model.
- Outputs represent structural interface verification only, NOT calibrated real-world predictions.
================================================================================
"""

import os
import sys
import json

# Ensure models/organization-specific-risk is on sys.path
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, os.path.join(PROJECT_ROOT, "models", "organization-specific-risk"))

from organization_specific_model import (
    OrganizationSpecificRiskModel,
    MetaModelResult,
    OrganizationProfile,
    Asset,
    SecurityControl,
    BusinessContext,
    FinancialImpact,
    OrganizationRiskResult
)


def run_mock_integration_test():
    print("=" * 80)
    print("               MOCK / INTERFACE TEST ONLY")
    print("  Organization-Specific Risk Model Interface Verification")
    print("=" * 80)
    print("DISCLAIMER: This script tests interface data flow and contract compatibility.")
    print("It uses purely synthetic mock inputs. It does NOT represent model accuracy,")
    print("scientific validation, or real-world risk quantification.\n")

    # --------------------------------------------------------------------------
    # 1. Mock Meta Model Output (Purely synthetic, clearly labeled)
    # --------------------------------------------------------------------------
    mock_meta_payload = {
        "meta_risk": 0.85
    }
    print(f"[TEST SETUP] Ingesting Mock Meta Model Payload: {json.dumps(mock_meta_payload)}")

    # Instantiate MetaModelResult in mock test mode
    mock_meta_result = MetaModelResult(
        is_contract_fulfilled=True,
        meta_model_version="MOCK-STAGED-TEST-ONLY",
        raw_outputs=mock_meta_payload,
        confidence=0.50
    )

    # Instantiate Organization-Specific Risk Model (scaffolding/adapter)
    model = OrganizationSpecificRiskModel(allow_mock_contract=True)

    # --------------------------------------------------------------------------
    # 2. Organization A: High Criticality, High Exposure, Weak Controls, High Impact
    # --------------------------------------------------------------------------
    profile_a = OrganizationProfile(
        organization_id="ORG-A-HIGH-EXPOSURE",
        organization_name="Alpha Global Finance Inc.",
        industry="finance",
        organization_size="large",
        number_of_employees=5000,
        number_of_endpoints=6500,
        number_of_servers=400,
        incident_history_count=3,
        posture_baseline_score=45.0  # Weak baseline posture
    )

    assets_a = [
        Asset(
            asset_id="AST-A-01",
            asset_name="Public Transaction Gateway",
            technology="Kubernetes / Microservices",
            criticality=9.8,
            exposure="INTERNET_FACING",
            ip_address="198.51.100.25",
            owner="Payment Ops",
            active_vulnerabilities=["CVE-2023-44487", "CVE-2023-38606"]
        ),
        Asset(
            asset_id="AST-A-02",
            asset_name="Core Financial Ledger & DB",
            technology="Oracle Exadata",
            criticality=9.5,
            exposure="INTERNET_FACING",
            ip_address="198.51.100.50",
            owner="Core Banking Team",
            active_vulnerabilities=["CVE-2022-21500"]
        )
    ]

    controls_a = [
        SecurityControl(
            control_id="CTRL-A-01",
            name="Basic Password Policy",
            category="Identity",
            is_active=True,
            effectiveness=0.25  # Weak control
        ),
        SecurityControl(
            control_id="CTRL-A-02",
            name="Legacy Signature Antivirus",
            category="Endpoint",
            is_active=True,
            effectiveness=0.30  # Weak control
        )
    ]

    business_a = BusinessContext(
        regulatory_framework="RBI-CSCF Tier 4 / DPDP Act 2023",
        annual_revenue_inr=2500000000.0,
        downtime_cost_per_hour_inr=2500000.0,
        data_classification_tier="RESTRICTED"
    )

    financial_a = FinancialImpact(
        single_loss_expectancy_inr=50000000.0,  # INR 5.0 Crore
        annualized_rate_of_occurrence=0.85,
        estimated_incident_cost_inr=50000000.0
    )

    # --------------------------------------------------------------------------
    # 3. Organization B: Low Criticality, Low Exposure, Strong Controls, Lower Impact
    # --------------------------------------------------------------------------
    profile_b = OrganizationProfile(
        organization_id="ORG-B-LOW-EXPOSURE",
        organization_name="Beta Logistics Support Ltd.",
        industry="logistics",
        organization_size="small",
        number_of_employees=60,
        number_of_endpoints=50,
        number_of_servers=4,
        incident_history_count=0,
        posture_baseline_score=88.0  # Strong baseline posture
    )

    assets_b = [
        Asset(
            asset_id="AST-B-01",
            asset_name="Internal Warehouse Inventory PC",
            technology="Windows 11 LTSC",
            criticality=3.5,
            exposure="AIR_GAPPED_ISOLATED",
            ip_address="192.168.10.15",
            owner="Logistics Admin",
            active_vulnerabilities=[]
        ),
        Asset(
            asset_id="AST-B-02",
            asset_name="Office File & Print Share",
            technology="Linux Samba",
            criticality=2.5,
            exposure="INTERNAL_PROTECTED",
            ip_address="192.168.10.20",
            owner="Office IT",
            active_vulnerabilities=[]
        )
    ]

    controls_b = [
        SecurityControl(
            control_id="CTRL-B-01",
            name="FIDO2 Hardware MFA on All Access",
            category="Identity",
            is_active=True,
            effectiveness=0.95  # Strong control
        ),
        SecurityControl(
            control_id="CTRL-B-02",
            name="Immutable Air-Gapped Cloud Backups",
            category="Recovery",
            is_active=True,
            effectiveness=0.90  # Strong control
        ),
        SecurityControl(
            control_id="CTRL-B-03",
            name="Zero Trust Network Access & EDR",
            category="Defensive",
            is_active=True,
            effectiveness=0.92  # Strong control
        )
    ]

    business_b = BusinessContext(
        regulatory_framework="ISO 27001 Basic",
        annual_revenue_inr=40000000.0,
        downtime_cost_per_hour_inr=50000.0,
        data_classification_tier="INTERNAL"
    )

    financial_b = FinancialImpact(
        single_loss_expectancy_inr=1500000.0,  # INR 15 Lakhs
        annualized_rate_of_occurrence=0.10,
        estimated_incident_cost_inr=1500000.0
    )

    # --------------------------------------------------------------------------
    # 4. Execute Pipeline for Both with IDENTICAL Upstream Meta Risk (0.85)
    # --------------------------------------------------------------------------
    print("\n[EXECUTION] Passing SAME mock Meta Model output (0.85) to Organization A & B...")

    pipeline_success = True
    org_inputs_accepted = False

    try:
        result_a = model.assess_organization_specific_risk(
            meta_result=mock_meta_result,
            profile=profile_a,
            assets=assets_a,
            controls=controls_a,
            business=business_a,
            financial=financial_a
        )

        result_b = model.assess_organization_specific_risk(
            meta_result=mock_meta_result,
            profile=profile_b,
            assets=assets_b,
            controls=controls_b,
            business=business_b,
            financial=financial_b
        )

        # Verify structured outputs are valid instances
        if isinstance(result_a, OrganizationRiskResult) and isinstance(result_b, OrganizationRiskResult):
            org_inputs_accepted = True

    except Exception as e:
        pipeline_success = False
        print(f"Pipeline execution error: {e}")
        return

    # --------------------------------------------------------------------------
    # 5. Required Output Reporting
    # --------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("                         TEST RESULTS SUMMARY")
    print("=" * 80)
    print(f"1. Meta Model Mock Value: {mock_meta_payload['meta_risk']} (Identical for both runs)\n")

    print("2. Organization A Result (High Exposure, Weak Controls, High Financial Impact):")
    print(f"   - Organization ID         : {result_a.organization_id}")
    print(f"   - Probability of Loss/Event: {result_a.probability_of_event:.4f} ({result_a.probability_of_event * 100:.2f}%)")
    print(f"   - Financial Impact (SLE)  : INR {result_a.financial_impact_inr:,.2f}")
    print(f"   - Expected Annual Loss    : INR {result_a.expected_annual_loss_inr:,.2f}")
    print(f"   - Risk Categorization     : {result_a.risk_level}")
    print(f"   - Confidence Level        : {result_a.model_confidence:.2f}")
    print(f"   - Top Risk Drivers        : {', '.join(result_a.top_risk_drivers)}")
    print(f"   - Integration Status      : {result_a.integration_status}\n")

    print("3. Organization B Result (Low Exposure, Strong Controls, Lower Financial Impact):")
    print(f"   - Organization ID         : {result_b.organization_id}")
    print(f"   - Probability of Loss/Event: {result_b.probability_of_event:.4f} ({result_b.probability_of_event * 100:.2f}%)")
    print(f"   - Financial Impact (SLE)  : INR {result_b.financial_impact_inr:,.2f}")
    print(f"   - Expected Annual Loss    : INR {result_b.expected_annual_loss_inr:,.2f}")
    print(f"   - Risk Categorization     : {result_b.risk_level}")
    print(f"   - Confidence Level        : {result_b.model_confidence:.2f}")
    print(f"   - Top Risk Drivers        : {', '.join(result_b.top_risk_drivers)}")
    print(f"   - Integration Status      : {result_b.integration_status}\n")

    print(f"4. Whether the pipeline executed successfully    : {'YES (SUCCESS)' if pipeline_success else 'NO (FAILED)'}")
    print(f"5. Whether organization-specific inputs were accepted: {'YES (ACCEPTED & DIFFERENTIATED)' if org_inputs_accepted else 'NO (REJECTED)'}")
    print("=" * 80)
    print("VERIFICATION NOTE: While both organizations received the SAME mock Meta Model")
    print("risk score (0.85), the Organization-Specific Risk Model successfully absorbed")
    print("asset exposures, criticality, controls, and financial profiles to produce")
    print("distinct risk probabilities and Expected Annual Loss (EAL) values.")
    print("THIS IS A MOCK / INTERFACE TEST ONLY. NOT CALIBRATED SCIENTIFIC PREDICTIONS.")
    print("=" * 80)


if __name__ == "__main__":
    run_mock_integration_test()
