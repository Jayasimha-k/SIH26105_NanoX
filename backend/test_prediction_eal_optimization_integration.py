import sys
import os
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.database import SessionLocal, Base, engine
from app.models.db_models import Asset, Vulnerability, SecurityControl, OptimizationRun
from app.ml.risk_models import FullAIRiskPipeline
from app.services.risk_engine import RiskEngine
from app.services.optimizer import OptimizationEngine
from app.seed import seed_database

class TestPredictionEALOptimizationIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        seed_database()
        cls.client = TestClient(app)

    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_1_unidirectional_pipeline_flow(self):
        """
        Verifies strict unidirectional dependency:
        Prediction -> Calibrated Probability -> EAL -> Optimization
        """
        # 1. Prediction Step
        pred_output = FullAIRiskPipeline.run_pipeline(
            cvss_score=9.8,
            cwe_id="CWE-787",
            epss_score=0.88,
            is_cisa_kev=True,
            mitre_technique="T1190",
            asset_criticality=9.0,
            exposure_level="INTERNET_FACING",
            incident_count=2
        )

        self.assertIn("raw_probability", pred_output)
        self.assertIn("calibrated_probability", pred_output)
        raw_prob = pred_output["raw_probability"]
        calibrated_prob = pred_output["calibrated_probability"]

        # 2. EAL Step uses strictly calibrated probability
        financial_impact = 3500000.0 * (9.0 / 5.0)  # 6,300,000.0
        eal_pre = RiskEngine.calculate_eal_pre(calibrated_prob, financial_impact)
        self.assertEqual(eal_pre, round(calibrated_prob * financial_impact, 2))

        # 3. Optimization Step consumes EAL directly
        controls = self.db.query(SecurityControl).all()
        budget = 500000.0

        opt_result = OptimizationEngine.optimize_security_budget(
            available_budget=budget,
            controls=controls,
            pre_eal=eal_pre
        )

        self.assertEqual(opt_result["pre_eal"], eal_pre)
        self.assertLessEqual(opt_result["total_cost"], budget)
        self.assertGreater(len(opt_result["selected_controls"]), 0)
        self.assertGreater(opt_result["risk_reduction"], 0.0)
        self.assertLess(opt_result["post_eal"], eal_pre)

    def test_2_api_optimize_endpoint_consumes_calibrated_eal(self):
        """
        Verifies POST /api/optimize/run calculates aggregate pre-EAL from calibrated probabilities
        and solves PuLP optimization under budget constraint.
        """
        budget = 600000.0
        response = self.client.post("/api/optimize/run", json={
            "budget": budget,
            "enforce_control_ids": [],
            "exclude_control_ids": []
        })

        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()

        self.assertEqual(data["budget"], budget)
        self.assertLessEqual(data["total_cost"], budget)
        self.assertGreater(data["pre_eal"], 0.0)
        self.assertLess(data["post_eal"], data["pre_eal"])
        self.assertGreater(data["risk_reduction"], 0.0)
        self.assertGreater(data["rosi"], 0.0)
        self.assertIn("selected_controls", data)

        # Verify DB persistence of OptimizationRun
        run_record = self.db.query(OptimizationRun).order_by(OptimizationRun.id.desc()).first()
        self.assertIsNotNone(run_record)
        self.assertAlmostEqual(run_record.budget, budget)
        self.assertAlmostEqual(run_record.pre_eal, data["pre_eal"], places=2)

    def test_3_higher_calibrated_probability_scales_optimization_value(self):
        """
        Verifies that higher threat level (higher calibrated probability -> higher pre-EAL)
        increases the total risk reduction value produced by selected controls.
        """
        controls = self.db.query(SecurityControl).all()
        budget = 500000.0

        # Scenario A: Low threat (Calibrated P = 0.15)
        eal_low = RiskEngine.calculate_eal_pre(0.15, 5000000.0)
        opt_low = OptimizationEngine.optimize_security_budget(
            available_budget=budget,
            controls=controls,
            pre_eal=eal_low
        )

        # Scenario B: High threat (Calibrated P = 0.85)
        eal_high = RiskEngine.calculate_eal_pre(0.85, 5000000.0)
        opt_high = OptimizationEngine.optimize_security_budget(
            available_budget=budget,
            controls=controls,
            pre_eal=eal_high
        )

        self.assertLess(eal_low, eal_high)
        self.assertLess(opt_low["risk_reduction"], opt_high["risk_reduction"])

    def test_4_no_circular_feedback_or_model_mutation(self):
        """
        Verifies optimization execution does not mutate model weights or feed back into prediction.
        """
        # 1. Run prediction before optimization
        pred_before = FullAIRiskPipeline.run_pipeline(
            cvss_score=8.8,
            cwe_id="CWE-787",
            epss_score=0.72,
            is_cisa_kev=True,
            mitre_technique="T1210",
            asset_criticality=8.0,
            exposure_level="INTERNAL",
            incident_count=1
        )

        # 2. Run multiple optimization cycles
        controls = self.db.query(SecurityControl).all()
        for b in [100000.0, 500000.0, 1000000.0]:
            OptimizationEngine.optimize_security_budget(
                available_budget=b,
                controls=controls,
                pre_eal=pred_before["calibrated_probability"] * 2000000.0
            )

        # 3. Run identical prediction after optimization
        pred_after = FullAIRiskPipeline.run_pipeline(
            cvss_score=8.8,
            cwe_id="CWE-787",
            epss_score=0.72,
            is_cisa_kev=True,
            mitre_technique="T1210",
            asset_criticality=8.0,
            exposure_level="INTERNAL",
            incident_count=1
        )

        self.assertEqual(pred_before["raw_probability"], pred_after["raw_probability"])
        self.assertEqual(pred_before["calibrated_probability"], pred_after["calibrated_probability"])
        self.assertEqual(pred_before["conflict_information"], pred_after["conflict_information"])

if __name__ == "__main__":
    unittest.main(verbosity=2)
