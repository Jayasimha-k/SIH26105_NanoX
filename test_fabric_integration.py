"""
test_fabric_integration.py
================================================================================
SIH 2026 Problem Statement 26105:
HYPERLEDGER FABRIC INTEGRATION AUTOMATED TEST SUITE
================================================================================
"""

import unittest
import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from backend.app.services.fabric_service import FabricService
from backend.app.api.routers.blockchain import router, get_blockchain_network_status


class TestHyperledgerFabricIntegration(unittest.TestCase):

    def test_01_docker_and_network_status_structure(self):
        """Verify network status inspection schema and consensus engine declaration."""
        status = FabricService.check_docker_and_network_status()
        self.assertIn("docker_installed", status)
        self.assertIn("fabric_running", status)
        self.assertIn("consensus_type", status)
        self.assertEqual(status["ordering_nodes_target"], 3)
        self.assertEqual(status["peer_nodes_target"], 2)
        self.assertEqual(status["channel"], "cyber-risk-channel")
        self.assertEqual(status["chaincode"], "cyber_risk_audit")
        self.assertIn("Raft", status["consensus_type"])

    def test_02_transaction_builder_risk_assessment(self):
        """Verify Risk Assessment transaction payload builder."""
        res = FabricService.record_risk_assessment(
            org_id="ORG-TEST-001",
            threat_id="CVE-2023-44487",
            meta_risk=0.85,
            org_risk=77.5,
            eal=34600000.0,
            event_id="RA-TEST-001"
        )
        self.assertEqual(res["event_id"], "RA-TEST-001")
        self.assertEqual(res["event_type"], "RISK_ASSESSMENT")
        self.assertEqual(res["organization_id"], "ORG-TEST-001")
        self.assertIn("etcdraft", res["consensus_engine"])

    def test_03_transaction_builder_investment_decision(self):
        """Verify Investment Decision transaction payload builder."""
        res = FabricService.record_investment_decision(
            org_id="ORG-TEST-001",
            control_id="CTRL-1,CTRL-2",
            investment_cost=850000.0,
            expected_reduction=27.0,
            rosi=311.69,
            event_id="INV-TEST-001"
        )
        self.assertEqual(res["event_id"], "INV-TEST-001")
        self.assertEqual(res["event_type"], "INVESTMENT_DECISION")
        self.assertEqual(res["recommended_control_id"], "CTRL-1,CTRL-2")

    def test_04_transaction_builder_remediation(self):
        """Verify Remediation transaction payload builder."""
        res = FabricService.record_remediation(
            org_id="ORG-TEST-001",
            asset_id="AST-001",
            action_taken="Applied Security Patch v2.4.1",
            verified_by="SecOps-Lead",
            event_id="REM-TEST-001"
        )
        self.assertEqual(res["event_id"], "REM-TEST-001")
        self.assertEqual(res["event_type"], "REMEDIATION")
        self.assertEqual(res["asset_id"], "AST-001")

    def test_05_transaction_builder_reassessment(self):
        """Verify Reassessment transaction payload builder."""
        res = FabricService.record_reassessment(
            org_id="ORG-TEST-001",
            previous_risk=77.5,
            new_risk=50.5,
            residual_eal=18000000.0,
            event_id="REASSESS-TEST-001"
        )
        self.assertEqual(res["event_id"], "REASSESS-TEST-001")
        self.assertEqual(res["event_type"], "REASSESSMENT")
        self.assertEqual(res["risk_reduction_achieved"], 27.0)

    def test_06_fastapi_status_endpoint(self):
        """Verify FastAPI router status endpoint payload."""
        data = get_blockchain_network_status()
        self.assertIn("Permissioned Enterprise Distributed Ledger", data["network_type"])
        self.assertIn("etcdraft", data["ordering_consensus"])
        self.assertIn("SHA-256", data["hash_algorithm"])
        self.assertEqual(data["channel"], "cyber-risk-channel")


if __name__ == "__main__":
    unittest.main()
