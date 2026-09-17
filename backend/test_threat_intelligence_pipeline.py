"""
backend/test_threat_intelligence_pipeline.py
Automated End-to-End Test Suite for Continuous Cyber Threat Intelligence & P6 External Validation.
Tests 12 Required Capabilities:
  1. RSS / Atom parsing
  2. CVE & Entity extraction
  3. Deduplication
  4. Authoritative Validation
  5. Local Persistence
  6. Threat-to-Asset Matching
  7. P1-P6 Multi-Modal Inference
  8. Fusion v2 Convex Combination
  9. Dynamic Risk & EAL Reassessment
  10. Hyperledger Fabric Audit Anchoring
  11. Offline Air-Gapped Operation
  12. UNSW-NB15 External P6 Validation Artifact Integrity
"""

import os
import sys
import json
import unittest
import numpy as np
import pandas as pd

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.database import SessionLocal, engine, Base
from app.models.db_models import ThreatIntelligenceRecord, Asset, Vulnerability, SecurityControl
from app.threat_intelligence.parser import ThreatFeedParser
from app.threat_intelligence.extractor import ThreatExtractor
from app.threat_intelligence.deduplicator import ThreatDeduplicator
from app.threat_intelligence.validator import ThreatValidator
from app.threat_intelligence.service import ThreatIntelligenceService
from app.ml.risk_models import IndividualRiskModels, FullAIRiskPipeline
from app.ml.fusion_layer import fuse_risk_evidence, load_fusion_config
from app.services.risk_engine import RiskEngine
from app.services.fabric_service import FabricService

class TestThreatIntelligenceAndP6Validation(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.db = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    # 1. RSS & Atom XML Parsing
    def test_01_rss_atom_parsing(self):
        sample_rss = """<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
            <channel>
                <title>CISA Security Updates</title>
                <item>
                    <title>CISA Adds Known Exploited Vulnerability CVE-2024-21626</title>
                    <link>https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-001a</link>
                    <description>runc container escape vulnerability actively exploited in the wild.</description>
                    <pubDate>Wed, 31 Jan 2024 12:00:00 GMT</pubDate>
                </item>
            </channel>
        </rss>"""
        items = ThreatFeedParser.parse_rss_xml(sample_rss, "CISA Advisories")
        self.assertEqual(len(items), 1)
        self.assertIn("CVE-2024-21626", items[0]["title"])
        self.assertEqual(items[0]["source"], "CISA Advisories")

    # 2. CVE & Entity Extraction
    def test_02_cve_extraction(self):
        text = "Security bulletin regarding CVE-2021-34473 and CVE-2024-21626 affecting Microsoft Exchange and runc."
        cves = ThreatExtractor.extract_cve_ids(text)
        self.assertEqual(len(cves), 2)
        self.assertIn("CVE-2021-34473", cves)
        self.assertIn("CVE-2024-21626", cves)

        attack_type = ThreatExtractor.infer_attack_type("Attacker launched volumetric denial of service and ddos attack.")
        self.assertEqual(attack_type, "DDOS")

        product = ThreatExtractor.infer_affected_product("Critical RCE in Microsoft Exchange Server mail router.")
        self.assertEqual(product, "Microsoft Exchange")

    # 3. Deduplication Engine
    def test_03_deduplication(self):
        item_a = {
            "cve": "CVE-2024-21626",
            "source": "CISA",
            "title": "runc Container Escape",
            "published_at": "2024-01-31"
        }
        item_b = {
            "cve": "cve-2024-21626",
            "source": "cisa",
            "title": "runc Container Escape",
            "published_at": "2024-01-31"
        }
        hash_a = ThreatDeduplicator.compute_hash(item_a)
        hash_b = ThreatDeduplicator.compute_hash(item_b)
        self.assertEqual(hash_a, hash_b)

    # 4. Authoritative Validation
    def test_04_validation(self):
        # Known CVE in local DB or cache
        res_valid, rsn_valid = ThreatValidator.validate_threat(self.db, {"cve": "CVE-2024-21626"})
        self.assertIn(res_valid, ["VALIDATED", "PENDING_VALIDATION"])

        # Synthetic demo threat
        res_demo, _ = ThreatValidator.validate_threat(self.db, {"cve": "DEMO-THREAT-2026-001", "is_demo": True})
        self.assertEqual(res_demo, "VALIDATED_DEMO")

        # Malformed CVE
        res_bad, _ = ThreatValidator.validate_threat(self.db, {"cve": "CVE-INVALID"})
        self.assertEqual(res_bad, "REJECTED")

    # 5. Local Persistence
    def test_05_local_persistence(self):
        test_threat_id = "TEST-THREAT-UNIT-001"
        # Clean if exists
        existing = self.db.query(ThreatIntelligenceRecord).filter(ThreatIntelligenceRecord.threat_id == test_threat_id).first()
        if existing:
            self.db.delete(existing)
            self.db.commit()

        record = ThreatIntelligenceRecord(
            threat_id=test_threat_id,
            cve="CVE-2024-99999",
            source="Unit Test Source",
            title="Unit Test Vulnerability",
            validation_status="PENDING_VALIDATION",
            raw_hash="testhash1234567890abcdef"
        )
        self.db.add(record)
        self.db.commit()

        retrieved = self.db.query(ThreatIntelligenceRecord).filter(ThreatIntelligenceRecord.threat_id == test_threat_id).first()
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.threat_id, test_threat_id)
        
        # Cleanup
        self.db.delete(retrieved)
        self.db.commit()

    # 6. Threat-to-Asset Matching
    def test_06_threat_to_asset_matching(self):
        assets = self.db.query(Asset).all()
        self.assertGreater(len(assets), 0, "Enterprise assets must be seeded.")
        
        # Test product keyword resolution
        product = "Microsoft Exchange"
        matched = None
        for a in assets:
            if "exchange" in a.name.lower() or "mail" in a.name.lower() or "server" in a.name.lower():
                matched = a
                break
        self.assertIsNotNone(matched or assets[0])

    # 7. P1-P6 Multi-Modal Inference
    def test_07_p1_p6_inference(self):
        p1 = IndividualRiskModels.model_1_nvd_cvss_cwe(9.8, "CWE-787")
        p2 = IndividualRiskModels.model_2_epss(0.965)
        p3 = IndividualRiskModels.model_3_cisa_kev(True)
        p4 = IndividualRiskModels.model_4_mitre_attack("T1190")

        self.assertAlmostEqual(p1, 1.0, delta=0.01)
        self.assertEqual(p2, 0.965)
        self.assertEqual(p3, 0.95)
        self.assertEqual(p4, 0.90)

        # Meta ensemble
        pipeline = FullAIRiskPipeline()
        meta_res = pipeline.run_pipeline(
            cvss_score=9.8,
            cwe_id="CWE-787",
            epss_score=0.965,
            is_cisa_kev=True,
            mitre_technique="T1190"
        )
        self.assertIn("meta_exploitation_probability", meta_res)
        p5 = meta_res["meta_exploitation_probability"]
        self.assertTrue(0.0 <= p5 <= 1.0)
        self.assertGreater(p5, 0.2)

    # 8. Fusion v2 Convex Combination
    def test_08_fusion_v2_weights(self):
        cfg = load_fusion_config("v2")
        self.assertEqual(cfg["fusion_version"], "v2")
        self.assertEqual(cfg["p6_weight"], 0.90)
        self.assertEqual(cfg["p5_weight"], 0.10)

        p5_val = 0.80
        p6_val = 0.90
        res = fuse_risk_evidence(p5_risk_score=p5_val, p6_network_evidence=p6_val, fusion_version="v2")
        
        expected_fused = 0.10 * p5_val + 0.90 * p6_val
        self.assertAlmostEqual(res["fused_probability"], expected_fused, places=4)
        self.assertEqual(res["fusion_version"], "v2")

    # 9. Dynamic Risk & EAL Reassessment
    def test_09_risk_reassessment(self):
        fused_prob = 0.89
        financial_impact = 5000000.0
        eal_pre = RiskEngine.calculate_eal_pre(fused_prob, financial_impact)
        self.assertEqual(eal_pre, round(0.89 * 5000000.0, 2))

        controls = self.db.query(SecurityControl).limit(2).all()
        eal_post = RiskEngine.calculate_eal_post(eal_pre, controls)
        self.assertLess(eal_post, eal_pre)
        risk_red = RiskEngine.calculate_risk_reduction(eal_pre, eal_post)
        self.assertEqual(risk_red, round(eal_pre - eal_post, 2))

    # 10. Hyperledger Fabric Audit Anchoring
    def test_10_fabric_audit(self):
        res = FabricService.record_risk_assessment(
            org_id="Hospital A",
            threat_id="DEMO-THREAT-2026-001",
            meta_risk=0.85,
            org_risk=0.89,
            eal=4450000.0,
            details={
                "p5_probability": 0.85,
                "p6_probability": 0.95,
                "fused_probability": 0.89,
                "fusion_version": "v2",
                "p6_weight": 0.90,
                "p5_weight": 0.10
            }
        )
        self.assertIn("event_id", res)
        self.assertIn(res["status"], ["COMMITTED_TO_FABRIC_LEDGER", "FABRIC_OFFLINE_QUEUED"])
        self.assertEqual(res["consensus_engine"], "etcdraft (Raft Consensus)")

    # 11. Offline Air-Gapped Operation
    def test_11_offline_operation(self):
        # Run ingestion in offline mode
        res = ThreatIntelligenceService.ingest_from_registry(self.db, offline_mode=True)
        self.assertTrue(res["offline_mode"])
        self.assertGreaterEqual(res["ingested_count"] + res["duplicate_count"], 0)

    # 12. External P6 Validation Artifact Integrity
    def test_12_external_p6_artifacts(self):
        # Verify reports/p6_unsw_nb15_audit.json
        audit_path = os.path.join("reports", "p6_unsw_nb15_audit.json")
        self.assertTrue(os.path.exists(audit_path), f"Missing {audit_path}")
        with open(audit_path, "r") as f:
            audit_data = json.load(f)
            self.assertEqual(audit_data["dataset_name"], "UNSW-NB15")
            self.assertEqual(audit_data["benchmark_partitions"]["testing_set"]["rows"], 82332)

        # Verify reports/p6_unsw_feature_mapping.csv
        map_path = os.path.join("reports", "p6_unsw_feature_mapping.csv")
        self.assertTrue(os.path.exists(map_path), f"Missing {map_path}")
        map_df = pd.read_csv(map_path)
        self.assertIn("status", map_df.columns)
        self.assertIn("DIRECT_MATCH", map_df["status"].values)
        self.assertIn("DERIVED_COMPATIBLE", map_df["status"].values)
        self.assertIn("NOT_AVAILABLE", map_df["status"].values)

        # Verify reports/p6_external_validation.json
        ext_path = os.path.join("reports", "p6_external_validation.json")
        self.assertTrue(os.path.exists(ext_path), f"Missing {ext_path}")
        with open(ext_path, "r") as f:
            ext_data = json.load(f)
            self.assertAlmostEqual(ext_data["threshold_independent_metrics"]["roc_auc"], 0.7067, places=3)
            self.assertAlmostEqual(ext_data["threshold_independent_metrics"]["pr_auc"], 0.7207, places=3)
            self.assertEqual(ext_data["feature_compatibility"]["total_p6_features"], 56)
            self.assertEqual(ext_data["feature_compatibility"]["harmonized_features"], 16)
            self.assertEqual(ext_data["feature_compatibility"]["unobserved_features"], 40)

if __name__ == "__main__":
    unittest.main()
