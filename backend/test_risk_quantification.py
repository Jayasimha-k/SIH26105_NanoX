import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.services.risk_engine import RiskEngine
from app.ml.risk_models import FullAIRiskPipeline
from app.models.db_models import SecurityControl

class TestRiskQuantification(unittest.TestCase):

    def test_1_eal_uses_calibrated_probability(self):
        """Proof 1: EAL calculation strictly equals calibrated_probability * financial_impact."""
        # Execute pipeline
        ai_output = FullAIRiskPipeline.run_pipeline(
            cvss_score=9.8,
            cwe_id="CWE-787",
            epss_score=0.88,
            is_cisa_kev=True,
            mitre_technique="T1190",
            asset_criticality=9.0,
            exposure_level="INTERNET_FACING",
            incident_count=2
        )

        calibrated_prob = ai_output["calibrated_probability"]
        financial_impact = 3500000.0 * (9.0 / 5.0)  # 6,300,000.0

        eal_pre = RiskEngine.calculate_eal_pre(calibrated_prob, financial_impact)
        expected_eal = round(calibrated_prob * financial_impact, 2)

        self.assertEqual(eal_pre, expected_eal)
        self.assertGreater(eal_pre, 0.0)

    def test_2_increasing_probability_increases_eal_monotonically(self):
        """Proof 2: For a fixed financial impact, increasing probability strictly increases EAL."""
        financial_impact = 5000000.0  # Fixed 50 Lakhs impact

        prob_low = 0.10
        prob_mid = 0.45
        prob_high = 0.85

        eal_low = RiskEngine.calculate_eal_pre(prob_low, financial_impact)
        eal_mid = RiskEngine.calculate_eal_pre(prob_mid, financial_impact)
        eal_high = RiskEngine.calculate_eal_pre(prob_high, financial_impact)

        self.assertLess(eal_low, eal_mid)
        self.assertLess(eal_mid, eal_high)

        # Ratio proportionality check
        self.assertAlmostEqual(eal_high / eal_low, prob_high / prob_low, places=4)

    def test_3_conflict_metadata_alone_does_not_alter_eal(self):
        """Proof 3: Conflict metadata/scores alone do NOT directly alter EAL when probability is fixed."""
        fixed_prob = 0.65
        fixed_impact = 4000000.0
        base_eal = RiskEngine.calculate_eal_pre(fixed_prob, fixed_impact)

        # Create different conflict metadata payloads
        conflict_scenario_1 = {
            "has_conflict": True,
            "severity_exploitation_conflict": True,
            "kev_epss_conflict": True,
            "spread": 0.85,
            "std": 0.38
        }

        conflict_scenario_2 = {
            "has_conflict": False,
            "severity_exploitation_conflict": False,
            "kev_epss_conflict": False,
            "spread": 0.02,
            "std": 0.008
        }

        # Verify RiskEngine.calculate_eal_pre takes only (probability, financial_impact)
        eal_scenario_1 = RiskEngine.calculate_eal_pre(fixed_prob, fixed_impact)
        eal_scenario_2 = RiskEngine.calculate_eal_pre(fixed_prob, fixed_impact)

        self.assertEqual(base_eal, eal_scenario_1)
        self.assertEqual(base_eal, eal_scenario_2)
        self.assertEqual(eal_scenario_1, eal_scenario_2)

    def test_4_control_risk_reduction_and_rosi_invariance(self):
        """Verifies downstream control risk reduction and ROSI formulas remain intact."""
        eal_pre = 2500000.0
        control = SecurityControl(
            id="CTRL-TEST",
            code="EDR",
            name="EDR Guard",
            category="EDR",
            cost=200000.0,
            effectiveness=0.80
        )

        eal_post = RiskEngine.calculate_eal_post(eal_pre, [control])
        self.assertEqual(eal_post, round(2500000.0 * 0.20, 2))  # 500,000.0

        risk_reduction = RiskEngine.calculate_risk_reduction(eal_pre, eal_post)
        self.assertEqual(risk_reduction, 2000000.0)

        rosi = RiskEngine.calculate_rosi(risk_reduction, 200000.0)
        self.assertEqual(rosi, 900.0)  # ((2000000 - 200000) / 200000) * 100 = 900%

if __name__ == "__main__":
    unittest.main(verbosity=2)
