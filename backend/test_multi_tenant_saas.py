"""
backend/test_multi_tenant_saas.py
================================================================================
Unit & Integration Tests for Multi-Tenant SaaS, Datasets, and Security Testing
================================================================================
"""

import sys
import os
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.database import SessionLocal, Base, engine
from app.seed import seed_database


class TestMultiTenantSaaS(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        seed_database()
        cls.client = TestClient(app)

    def test_1_get_my_organization(self):
        """Verifies organization context retrieval."""
        res = self.client.get("/api/v1/tenants/organizations/me")
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertIn("name", data)
        self.assertIn("technology_stack", data)
        self.assertIn("financial_exposure", data)
        self.assertIn("why_data_needed", data)

    def test_2_update_organization(self):
        """Verifies organization data updates persist."""
        payload = {
            "industry": "FinTech Cloud Banking",
            "financial_exposure": 4200000.0,
            "technology_stack": ["Kubernetes", "Linux", "PostgreSQL", "AWS ECS", "Kafka"]
        }
        res = self.client.put("/api/v1/tenants/organizations/me", json=payload)
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["organization"]["industry"], "FinTech Cloud Banking")
        self.assertEqual(data["organization"]["financial_exposure"], 4200000.0)

    def test_3_subscription_tiers(self):
        """Verifies subscription module entitlements."""
        res = self.client.get("/api/v1/tenants/subscriptions/current")
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertEqual(data["tier"], "ENTERPRISE")
        self.assertIn("network_intelligence", data["enabled_modules"])
        self.assertIn("optimization", data["enabled_modules"])

    def test_4_datasets_catalog(self):
        """Verifies dataset catalog and quality metrics."""
        res = self.client.get("/api/v1/data/datasets")
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertGreater(data["total_datasets"], 0)
        first = data["datasets"][0]
        self.assertEqual(first["schema_status"], "VALIDATED")

    def test_5_model_layers_governance(self):
        """Verifies model layers champion/candidate governance architecture."""
        res = self.client.get("/api/v1/data/model-layers")
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertIn("global_baseline", data["architecture"])
        self.assertIn("governance_status", data)

    def test_6_strix_scope_enforcement(self):
        """Verifies security testing rejects unauthorized arbitrary public targets."""
        unauthorized_payload = {
            "test_name": "Illegal Public Attack",
            "target_asset_id": "UNKNOWN-001",
            "target_url_or_ip": "https://arbitrary-unauthorized-target.com",
            "scope_authorization_token": "valid_token_12345",
            "authorized_by": "CISO"
        }
        res = self.client.post("/api/v1/security-testing/runs/launch", json=unauthorized_payload)
        self.assertEqual(res.status_code, 403)
        self.assertIn("SECURITY VIOLATION", res.json()["detail"])

    def test_7_strix_authorized_run(self):
        """Verifies authorized test executes, validates finding, and triggers pipeline EAL recalculation."""
        authorized_payload = {
            "test_name": "Authorized Container Security Test",
            "target_asset_id": "ASSET-001",
            "target_url_or_ip": "10.0.1.50",
            "scope_authorization_token": "AUTH-TOKEN-DEMO-2026-CRYPTOGRAPHIC",
            "authorized_by": "CISO_DIRECTOR",
            "test_mode": "VALIDATED_POC"
        }
        res = self.client.post("/api/v1/security-testing/runs/launch", json=authorized_payload)
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertEqual(data["status"], "COMPLETED")
        self.assertEqual(data["finding"]["severity"], "CRITICAL")
        self.assertIn("pipeline_translation", data)
        self.assertGreater(data["pipeline_translation"]["validated_threat_eal"], 0)
        self.assertIn("recommended_remediation", data)


if __name__ == "__main__":
    unittest.main()
