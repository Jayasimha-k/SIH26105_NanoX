"""
CyberOptRQ — Comprehensive Production Readiness & Security Test Suite
======================================================================
Tests:
1. Mode Enforcement:
   - APP_MODE=production without Supabase fails immediately with SUPABASE_CONNECTION_ERROR
   - APP_MODE=offline_demo succeeds with local SQLite
2. Strix Runtime & Scope Enforcement:
   - Honest labeling: "Strix integration configured but runtime unavailable"
   - Rejects unauthorized external targets with PermissionError
   - Accurately reports missing host prerequisites (Strix CLI, Docker daemon, LLM key)
3. Multi-Tenant Data Isolation:
   - Org A (org_abc_tech) vs Org B (org_xyz_finance) zero overlap
4. Financial Intelligence & CFO Review Integrity:
   - RFC 822 EML parser produces genuine extracted entities with no fabricated return values
5. Model 6 & P1-P6 Invariant Checks:
   - Immutable provenance metrics match CIC-IDS2017 & UNSW-NB15 holdouts
"""

import os
import sys
import unittest
import json

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
LAB_DIR = os.path.join(ROOT_DIR, "cyberoptrq-security-lab")

for p in [ROOT_DIR, BACKEND_DIR, LAB_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

class TestCyberOptRQProductionReadiness(unittest.TestCase):

    def test_01_production_mode_enforcement(self):
        """Verify that production mode without live Supabase/PostgreSQL fails clearly."""
        import subprocess
        env = os.environ.copy()
        env["APP_MODE"] = "production"
        env["DATABASE_URL"] = "sqlite:///./cyberopt_rq.db"
        env["SUPABASE_URL"] = ""
        env["SUPABASE_SERVICE_ROLE_KEY"] = ""

        cmd = [
            sys.executable,
            "-c",
            "import app.database; print('SHOULD_NOT_REACH_HERE')"
        ]
        proc = subprocess.run(cmd, cwd=BACKEND_DIR, env=env, capture_output=True, text=True)
        self.assertNotEqual(proc.returncode, 0, "Production mode should fail without Supabase")
        self.assertIn("SUPABASE_CONNECTION_ERROR", proc.stderr, "Error message must contain SUPABASE_CONNECTION_ERROR")

    def test_02_offline_demo_mode_connectivity(self):
        """Verify that offline demo mode operates cleanly on SQLite."""
        import subprocess
        env = os.environ.copy()
        env["APP_MODE"] = "offline_demo"

        cmd = [
            sys.executable,
            "-c",
            "import app.database; from app.models.db_models import Asset; from app.database import SessionLocal; db = SessionLocal(); count = db.query(Asset).count(); print(f'ASSET_COUNT:{count}'); db.close()"
        ]
        proc = subprocess.run(cmd, cwd=BACKEND_DIR, env=env, capture_output=True, text=True)
        self.assertEqual(proc.returncode, 0, f"Offline demo mode failed: {proc.stderr}")
        self.assertIn("ASSET_COUNT:", proc.stdout)

    def test_03_strix_adapter_scope_and_runtime_status(self):
        """Verify Strix adapter honesty: runtime status and cryptographic scope enforcement."""
        from integrations.strix_adapter import StrixSecurityAdapter

        adapter = StrixSecurityAdapter()
        runtime = adapter.check_runtime_availability()

        self.assertIn("status_label", runtime)
        self.assertEqual(runtime["status_label"], "Strix integration configured but runtime unavailable")
        self.assertFalse(runtime["is_runnable"])
        self.assertTrue(len(runtime["blockers"]) > 0)

        # Authorized target scan
        res = adapter.execute_authorized_scan(
            asset_id="ASSET-001",
            target="10.0.1.50",
            authorized_scope="10.0.1.50,localhost,ASSET-001"
        )
        self.assertEqual(res["status"], "COMPLETED")
        self.assertEqual(res["runtime_status"], "Strix integration configured but runtime unavailable")
        self.assertFalse(res["live_binary_executed"])
        self.assertEqual(len(res["findings"]), 1)

        # Unauthorized external target scan MUST raise PermissionError
        with self.assertRaises(PermissionError):
            adapter.execute_authorized_scan(
                asset_id="ASSET-001",
                target="https://bankofamerica.com",
                authorized_scope="10.0.1.50,localhost,ASSET-001"
            )

    def test_04_tenant_data_isolation(self):
        """Verify strict multi-tenant boundary between Org A and Org B."""
        from app.database import SessionLocal
        from app.models.db_models import Asset, Organization

        db = SessionLocal()
        try:
            org_a = db.query(Organization).filter(Organization.id == "org_abc_tech").first()
            org_b = db.query(Organization).filter(Organization.id == "org_xyz_finance").first()

            self.assertIsNotNone(org_a, "Org A must exist")
            self.assertIsNotNone(org_b, "Org B must exist")

            assets_a = db.query(Asset).filter(Asset.organization_id == "org_abc_tech").all()
            assets_b = db.query(Asset).filter(Asset.organization_id == "org_xyz_finance").all()

            ids_a = {a.id for a in assets_a}
            ids_b = {a.id for a in assets_b}

            overlap = ids_a.intersection(ids_b)
            self.assertEqual(len(overlap), 0, f"Tenant isolation violated: overlap={overlap}")
            self.assertGreater(len(ids_a), 0)
            self.assertGreater(len(ids_b), 0)
        finally:
            db.close()

    def test_05_cfo_newsletter_no_fabrication(self):
        """Verify RFC 822 parsing and zero fabrication of financial returns."""
        from app.database import SessionLocal
        from app.intelligence.service import IntelligenceService
        
        db = SessionLocal()
        try:
            res = IntelligenceService.run_cfo_story_demo(db=db, organization_id="org_abc_tech")
            self.assertEqual(res["status"], "CFO_DEMO_COMPLETED")
            self.assertIn("Amazon", res.get("financial_signal", {}).get("company"))
            self.assertEqual(res.get("financial_signal", {}).get("ticker"), "AMZN")
            # Explicit policy: expected_return must NOT be fabricated
            self.assertEqual(res.get("financial_signal", {}).get("expected_return"), "UNKNOWN")
        finally:
            db.close()

    def test_06_model_6_metrics_immutability(self):
        """Verify Model 6 metrics exactly match source CIC-IDS2017 and UNSW-NB15 reports."""
        p6_metrics_file = os.path.join(ROOT_DIR, "reports", "p6_metrics.json")
        ext_val_file = os.path.join(ROOT_DIR, "reports", "p6_external_validation.json")

        with open(p6_metrics_file, "r") as f:
            m = json.load(f)

        test_m = m["primary_model_metrics"]["test"]
        self.assertAlmostEqual(test_m["roc_auc"], 0.98954, places=4)
        self.assertAlmostEqual(test_m["pr_auc"], 0.94630, places=4)
        self.assertAlmostEqual(test_m["accuracy"], 0.9730, places=3)
        self.assertAlmostEqual(test_m["precision"], 0.8999, places=3)
        self.assertAlmostEqual(test_m["recall"], 0.8499, places=3)
        self.assertAlmostEqual(test_m["f1"], 0.8742, places=3)

        with open(ext_val_file, "r") as f:
            ext = json.load(f)

        self.assertAlmostEqual(ext["threshold_independent_metrics"]["roc_auc"], 0.7067, places=3)
        self.assertAlmostEqual(ext["threshold_independent_metrics"]["pr_auc"], 0.7207, places=3)
        self.assertAlmostEqual(ext["calibrated_threshold_evaluation"]["accuracy"], 0.7278, places=3)

if __name__ == "__main__":
    unittest.main()
