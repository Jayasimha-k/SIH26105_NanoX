import sys
import os
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.database import SessionLocal, Base, engine
from app.models.db_models import Asset, Vulnerability, IncidentHistory, RiskAssessment
from app.seed import seed_database

class TestPredictAPIRouter(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        seed_database()
        cls.client = TestClient(app)

    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_1_normal_prediction(self):
        """Tests normal prediction endpoint execution, response format, and database persistence."""
        # Use seeded ASSET-002 (Production K8s) and CVE-2024-21626 (runc container escape)
        payload = {
            "asset_id": "ASSET-002",
            "vulnerability_id": "CVE-2024-21626"
        }

        response = self.client.post("/api/predict/run", json=payload)
        self.assertEqual(response.status_code, 200, response.text)

        data = response.json()
        self.assertEqual(data["asset_id"], "ASSET-002")
        self.assertEqual(data["vulnerability_id"], "CVE-2024-21626")

        # Verify base model outputs
        self.assertIn("p1_nvd", data)
        self.assertIn("p2_epss", data)
        self.assertIn("p3_cisa_kev", data)
        self.assertIn("p4_mitre_attack", data)

        # Verify new calibrated pipeline outputs
        self.assertIn("raw_probability", data)
        self.assertIn("calibrated_probability", data)
        self.assertIn("conflict_information", data)

        # Verify backward-compatible outputs
        self.assertIn("meta_exploitation_probability", data)
        self.assertIn("organization_adapted_probability", data)
        self.assertIn("financial_impact", data)
        self.assertIn("eal_pre_control", data)

        # Mathematical consistency: EAL = calibrated_prob * financial_impact
        expected_eal = round(data["calibrated_probability"] * data["financial_impact"], 2)
        self.assertAlmostEqual(data["eal_pre_control"], expected_eal, places=2)

        # Database persistence check
        saved_record = self.db.query(RiskAssessment).filter(
            RiskAssessment.asset_id == "ASSET-002",
            RiskAssessment.vulnerability_id == "CVE-2024-21626"
        ).order_by(RiskAssessment.id.desc()).first()

        self.assertIsNotNone(saved_record)
        self.assertAlmostEqual(saved_record.eal_pre, data["eal_pre_control"], places=2)

    def test_2_conflicting_evidence_detection(self):
        """Tests that API detects and returns conflict diagnostics when evidence strongly disagrees."""
        # Create test asset & vulnerability with high CVSS (9.8) but near-zero EPSS (0.01) on ISOLATED asset
        conflict_asset = Asset(
            id="ASSET-TEST-CONF",
            name="Air-Gapped Vault",
            asset_type="OT Asset",
            criticality_score=8.0,
            financial_value=5000000.0,
            exposure_level="ISOLATED"
        )
        conflict_vuln = Vulnerability(
            id="CVE-TEST-CONF",
            cve_id="CVE-TEST-CONF",
            title="Theoretical Parsing Flaw",
            cvss_score=9.8,
            epss_score=0.01,
            cisa_kev=False,
            mitre_attack_technique="T1059",
            financial_impact_base=1500000.0
        )

        self.db.merge(conflict_asset)
        self.db.merge(conflict_vuln)
        self.db.commit()

        response = self.client.post("/api/predict/run", json={
            "asset_id": "ASSET-TEST-CONF",
            "vulnerability_id": "CVE-TEST-CONF"
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()

        conflict_info = data.get("conflict_information", {})
        self.assertTrue(conflict_info.get("has_conflict"))
        self.assertTrue(conflict_info.get("severity_exploitation_conflict"))
        self.assertGreater(conflict_info.get("spread", 0), 0.70)
        self.assertGreater(len(conflict_info.get("conflict_reasons", [])), 0)

    def test_3_missing_optional_evidence_fallback(self):
        """Tests that missing or null fields in asset/vulnerability fallback gracefully without 500 error."""
        sparse_asset = Asset(
            id="ASSET-TEST-SPARSE",
            name="Generic Server",
            asset_type="IT Asset",
            criticality_score=5.0,
            financial_value=1000000.0,
            ip_address=None,
            owner=None,
            exposure_level="INTERNAL"
        )
        sparse_vuln = Vulnerability(
            id="CVE-TEST-SPARSE",
            cve_id="CVE-TEST-SPARSE",
            title="Unclassified Bug",
            cvss_score=6.0,
            epss_score=0.10,
            cisa_kev=False,
            mitre_attack_technique=None,
            mitre_attack_name=None,
            cwe_id=None,
            affected_products=None,
            financial_impact_base=500000.0
        )

        self.db.merge(sparse_asset)
        self.db.merge(sparse_vuln)
        self.db.commit()

        response = self.client.post("/api/predict/run", json={
            "asset_id": "ASSET-TEST-SPARSE",
            "vulnerability_id": "CVE-TEST-SPARSE"
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(0.0 <= data["raw_probability"] <= 1.0)
        self.assertTrue(0.0 <= data["calibrated_probability"] <= 1.0)
        self.assertGreaterEqual(data["eal_pre_control"], 0.0)

    def test_4_probability_bounds_and_validity(self):
        """Verifies all returned probabilities stay strictly in [0.0, 1.0]."""
        assets = self.db.query(Asset).all()
        vulns = self.db.query(Vulnerability).all()

        for a in assets[:3]:
            for v in vulns[:3]:
                resp = self.client.post("/api/predict/run", json={
                    "asset_id": a.id,
                    "vulnerability_id": v.id
                })
                self.assertEqual(resp.status_code, 200)
                d = resp.json()

                self.assertTrue(0.0 <= d["p1_nvd"] <= 1.0)
                self.assertTrue(0.0 <= d["p2_epss"] <= 1.0)
                self.assertTrue(0.0 <= d["p3_cisa_kev"] <= 1.0)
                self.assertTrue(0.0 <= d["p4_mitre_attack"] <= 1.0)
                self.assertTrue(0.0 <= d["raw_probability"] <= 1.0)
                self.assertTrue(0.0 <= d["calibrated_probability"] <= 1.0)
                self.assertTrue(0.0 <= d["organization_adapted_probability"] <= 1.0)
                self.assertGreaterEqual(d["financial_impact"], 0.0)
                self.assertGreaterEqual(d["eal_pre_control"], 0.0)

    def test_5_asset_or_vuln_not_found(self):
        """Verifies 404 response when non-existent asset or vulnerability ID is requested."""
        resp = self.client.post("/api/predict/run", json={
            "asset_id": "NON_EXISTENT_ASSET",
            "vulnerability_id": "NON_EXISTENT_VULN"
        })
        self.assertEqual(resp.status_code, 404)

if __name__ == "__main__":
    unittest.main(verbosity=2)
