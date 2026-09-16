"""
test_organization_specific_interface.py
Unit tests verifying the Organization-Specific Risk Model architecture and integration contract.
"""

import os
import sys
import unittest

# Ensure repo root and models/organization-specific-risk are on sys.path
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
    OrganizationRiskResult,
    IntegrationContractError
)


class TestOrganizationSpecificRiskModelInterface(unittest.TestCase):

    def setUp(self):
        self.profile = OrganizationProfile(
            organization_id="ORG-TEST-01",
            organization_name="Bharat FinTech Solutions",
            industry="finance",
            organization_size="large",
            number_of_employees=1200,
            number_of_endpoints=1500,
            number_of_servers=95,
            incident_history_count=1,
            posture_baseline_score=68.5  # From existing organization-risk surrogate
        )

        self.assets = [
            Asset(
                asset_id="AST-001",
                asset_name="Core Banking API Gateway",
                technology="Kubernetes/Nginx",
                criticality=9.5,
                exposure="INTERNET_FACING",
                ip_address="203.0.113.10",
                owner="DevSecOps",
                active_vulnerabilities=["CVE-2023-44487"]
            ),
            Asset(
                asset_id="AST-002",
                asset_name="Customer KYC Data Warehouse",
                technology="PostgreSQL/RHEL9",
                criticality=8.5,
                exposure="INTERNAL_PROTECTED",
                ip_address="10.0.4.50",
                owner="Database Admin"
            )
        ]

        self.controls = [
            SecurityControl(
                control_id="CTRL-MFA",
                name="Hardware Token MFA",
                category="Identity & Access",
                is_active=True,
                effectiveness=0.90
            ),
            SecurityControl(
                control_id="CTRL-BACKUP",
                name="Immutable Air-Gapped Backups",
                category="Recovery",
                is_active=True,
                effectiveness=0.85
            )
        ]

        self.business = BusinessContext(
            regulatory_framework="RBI-CSCF / DPDP Act 2023",
            annual_revenue_inr=500000000.0,
            downtime_cost_per_hour_inr=750000.0,
            data_classification_tier="RESTRICTED"
        )

        self.financial = FinancialImpact(
            single_loss_expectancy_inr=15000000.0,  # 1.5 Crore INR
            annualized_rate_of_occurrence=0.25,
            estimated_incident_cost_inr=15000000.0
        )

    def test_strict_mode_fails_when_contract_unfulfilled(self):
        """Strict mode MUST raise IntegrationContractError if Meta Model contract is unfulfilled."""
        model = OrganizationSpecificRiskModel(allow_mock_contract=False)
        unfulfilled_meta = MetaModelResult(is_contract_fulfilled=False)

        with self.assertRaises(IntegrationContractError) as context:
            model.assess_organization_specific_risk(
                meta_result=unfulfilled_meta,
                profile=self.profile,
                assets=self.assets,
                controls=self.controls,
                business=self.business,
                financial=self.financial
            )

        self.assertIn("contract is unfulfilled", str(context.exception).lower())

    def test_strict_mode_fails_when_meta_score_missing(self):
        """Strict mode MUST raise IntegrationContractError if meta_score is missing despite contract flag."""
        model = OrganizationSpecificRiskModel(allow_mock_contract=False)
        incomplete_meta = MetaModelResult(is_contract_fulfilled=True, meta_score=None)

        with self.assertRaises(IntegrationContractError):
            model.assess_organization_specific_risk(
                meta_result=incomplete_meta,
                profile=self.profile,
                assets=self.assets,
                controls=self.controls,
                business=self.business,
                financial=self.financial
            )

    def test_fulfilled_contract_flow(self):
        """When the upstream Meta Model fulfills the contract, the model computes EAL and drivers cleanly."""
        model = OrganizationSpecificRiskModel(allow_mock_contract=False)
        fulfilled_meta = MetaModelResult(
            is_contract_fulfilled=True,
            meta_model_version="v1.0.0-PROD",
            meta_score=0.72,
            confidence=0.88
        )

        result = model.assess_organization_specific_risk(
            meta_result=fulfilled_meta,
            profile=self.profile,
            assets=self.assets,
            controls=self.controls,
            business=self.business,
            financial=self.financial
        )

        self.assertIsInstance(result, OrganizationRiskResult)
        self.assertEqual(result.organization_id, "ORG-TEST-01")
        self.assertGreater(result.probability_of_event, 0.0)
        self.assertLess(result.probability_of_event, 1.0)
        self.assertEqual(result.financial_impact_inr, 15000000.0)
        self.assertGreater(result.expected_annual_loss_inr, 0.0)
        self.assertIn(result.risk_level, ["Low", "Moderate", "High", "Critical"])
        self.assertGreater(len(result.top_risk_drivers), 0)
        self.assertEqual(result.integration_status, "PRODUCTION_INTEGRATED")

    def test_mock_scaffolding_mode(self):
        """When allow_mock_contract=True, scaffolding mode proceeds without throwing an exception."""
        model = OrganizationSpecificRiskModel(allow_mock_contract=True)
        mock_meta = MetaModelResult(is_contract_fulfilled=False, meta_score=0.50)

        result = model.assess_organization_specific_risk(
            meta_result=mock_meta,
            profile=self.profile,
            assets=self.assets,
            controls=self.controls,
            business=self.business,
            financial=self.financial
        )

        self.assertIsInstance(result, OrganizationRiskResult)
        self.assertEqual(result.integration_status, "MOCK_CONTRACT_MODE")

    def test_existing_baseline_surrogate_model_intact(self):
        """Verify that models/organization-risk/model.onnx has NOT been modified or deleted."""
        baseline_model_path = os.path.join("models", "organization-risk", "model.onnx")
        self.assertTrue(os.path.exists(baseline_model_path), "Baseline model.onnx must remain intact!")
        self.assertGreater(os.path.getsize(baseline_model_path), 1000, "model.onnx should not be empty.")


if __name__ == "__main__":
    unittest.main()
