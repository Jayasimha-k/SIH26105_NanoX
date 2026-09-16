import sys
import os
import unittest
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.ml.conflict_detector import EvidenceConflictDetector

class TestEvidenceConflictDetector(unittest.TestCase):

    def test_case_a_strong_agreement(self):
        """Case A: Strong Agreement across all signals and exposure context."""
        # High severity (0.90), high EPSS (0.88), confirmed KEV (0.95), high ATT&CK (0.90) on internet-facing asset
        result = EvidenceConflictDetector.evaluate(
            p1=0.90,
            p2=0.88,
            p3=0.95,
            p4=0.90,
            exposure_level="INTERNET_FACING"
        )

        self.assertFalse(result["severity_exploitation_conflict"])
        self.assertFalse(result["kev_epss_conflict"])
        self.assertFalse(result["threat_asset_exposure_conflict"])
        self.assertFalse(result["has_conflict"])
        self.assertEqual(len(result["conflict_reasons"]), 0)
        self.assertAlmostEqual(result["spread"], 0.95 - 0.88, places=3)
        self.assertLess(result["std"], 0.05)

    def test_case_b_severity_exploitation_conflict(self):
        """Case B: Technical Severity is high but exploitation likelihood is low (or vice versa)."""
        # Scenario 1: High CVSS (P1=0.95) but low in-the-wild EPSS (P2=0.05)
        res1 = EvidenceConflictDetector.evaluate(
            p1=0.95,
            p2=0.05,
            p3=0.20,
            p4=0.60,
            exposure_level="INTERNAL"
        )
        self.assertTrue(res1["severity_exploitation_conflict"])
        self.assertFalse(res1["kev_epss_conflict"])
        self.assertTrue(res1["has_conflict"])
        self.assertGreaterEqual(res1["spread"], 0.75)

        # Scenario 2: Low CVSS (P1=0.30) but weaponized in wild with high EPSS (P2=0.75)
        res2 = EvidenceConflictDetector.evaluate(
            p1=0.30,
            p2=0.75,
            p3=0.20,
            p4=0.60,
            exposure_level="INTERNAL"
        )
        self.assertTrue(res2["severity_exploitation_conflict"])
        self.assertTrue(res2["has_conflict"])

    def test_case_c_kev_epss_conflict(self):
        """Case C: Confirmed exploitation evidence (CISA KEV) and EPSS strongly disagree."""
        # Scenario 1: Active KEV (P3=0.95) but EPSS is very low (P2=0.10)
        res1 = EvidenceConflictDetector.evaluate(
            p1=0.80,
            p2=0.10,
            p3=0.95,
            p4=0.70,
            exposure_level="INTERNAL"
        )
        self.assertTrue(res1["kev_epss_conflict"])
        self.assertTrue(res1["has_conflict"])
        self.assertTrue(any("Confirmed active KEV weaponization" in r for r in res1["conflict_reasons"]))

        # Scenario 2: High EPSS (P2=0.90) but unconfirmed KEV (P3=0.20)
        res2 = EvidenceConflictDetector.evaluate(
            p1=0.80,
            p2=0.90,
            p3=0.20,
            p4=0.70,
            exposure_level="INTERNAL"
        )
        self.assertTrue(res2["kev_epss_conflict"])
        self.assertTrue(res2["has_conflict"])
        self.assertTrue(any("without verified CISA KEV" in r for r in res2["conflict_reasons"]))

    def test_case_d_threat_asset_exposure_conflict(self):
        """Case D: Threat evidence is high but asset is air-gapped/isolated."""
        result = EvidenceConflictDetector.evaluate(
            p1=0.90,
            p2=0.85,
            p3=0.95,
            p4=0.80,
            exposure_level="ISOLATED"
        )
        self.assertTrue(result["threat_asset_exposure_conflict"])
        self.assertFalse(result["severity_exploitation_conflict"])
        self.assertFalse(result["kev_epss_conflict"])
        self.assertTrue(result["has_conflict"])
        self.assertTrue(any("isolated/air-gapped" in r for r in result["conflict_reasons"]))

    def test_case_e_multiple_simultaneous_conflicts(self):
        """Case E: Multiple conflicts trigger at the same time."""
        # P1=0.95 (High Severity), P2=0.05 (Low EPSS) -> Severity vs EPSS conflict
        # P3=0.95 (Confirmed KEV), P2=0.05 (Low EPSS) -> KEV vs EPSS conflict
        # Threat is high (P3=0.95) on ISOLATED asset -> Threat vs Exposure conflict
        result = EvidenceConflictDetector.evaluate(
            p1=0.95,
            p2=0.05,
            p3=0.95,
            p4=0.60,
            exposure_level="ISOLATED"
        )
        self.assertTrue(result["severity_exploitation_conflict"])
        self.assertTrue(result["kev_epss_conflict"])
        self.assertTrue(result["threat_asset_exposure_conflict"])
        self.assertTrue(result["has_conflict"])
        self.assertEqual(len(result["conflict_reasons"]), 3)
        self.assertEqual(result["spread"], 0.90)

    def test_evidence_freshness_evaluation(self):
        """Test evidence freshness classifications: CURRENT, STALE, MIXED, UNKNOWN."""
        ref_date = datetime(2026, 9, 16, tzinfo=timezone.utc)

        # 1. No timestamps -> UNKNOWN
        res_unknown = EvidenceConflictDetector.evaluate(
            p1=0.5, p2=0.5, p3=0.5, p4=0.5,
            evidence_timestamps=None
        )
        self.assertEqual(res_unknown["evidence_freshness"], "UNKNOWN")

        # 2. All recent (<= 90 days) -> CURRENT
        res_current = EvidenceConflictDetector.evaluate(
            p1=0.5, p2=0.5, p3=0.5, p4=0.5,
            evidence_timestamps=["2026-08-01", "2026-09-01"],
            reference_date=ref_date
        )
        self.assertEqual(res_current["evidence_freshness"], "CURRENT")

        # 3. All old (> 365 days) -> STALE
        res_stale = EvidenceConflictDetector.evaluate(
            p1=0.5, p2=0.5, p3=0.5, p4=0.5,
            evidence_timestamps=["2024-01-01", "2024-05-10"],
            reference_date=ref_date
        )
        self.assertEqual(res_stale["evidence_freshness"], "STALE")

        # 4. Mix of old and recent -> MIXED
        res_mixed = EvidenceConflictDetector.evaluate(
            p1=0.5, p2=0.5, p3=0.5, p4=0.5,
            evidence_timestamps=["2024-01-01", "2026-09-10"],
            reference_date=ref_date
        )
        self.assertEqual(res_mixed["evidence_freshness"], "MIXED")

    def test_probability_invariance(self):
        """Ensures conflict analysis produces purely explanatory metrics without altering inputs."""
        p1, p2, p3, p4 = 0.95, 0.05, 0.95, 0.60
        result = EvidenceConflictDetector.evaluate(p1=p1, p2=p2, p3=p3, p4=p4)
        
        # Verify result contains only explanatory metrics and no probability modification
        self.assertIn("spread", result)
        self.assertIn("std", result)
        self.assertIn("severity_exploitation_conflict", result)
        self.assertIn("kev_epss_conflict", result)
        self.assertIn("threat_asset_exposure_conflict", result)
        self.assertIn("evidence_freshness", result)
        self.assertIn("has_conflict", result)
        self.assertIn("conflict_reasons", result)

if __name__ == "__main__":
    unittest.main(verbosity=2)
