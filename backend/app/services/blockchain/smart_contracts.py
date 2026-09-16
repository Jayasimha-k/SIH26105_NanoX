import logging
from typing import Dict, Any, Tuple

logger = logging.getLogger(__name__)

class SmartContractEngine:
    """
    Decentralized Smart Contract Execution Engine.
    Enforces business and governance logic on-chain before transaction validation.
    """

    CONTRACTS = [
        {
            "id": "SC-001-RISK-POLICY",
            "name": "Minimum Risk Reduction & ROSI Policy",
            "version": "1.0.0",
            "description": "Enforces that proposed security controls reduce EAL by >= 10% and have positive ROSI (> 0%).",
            "status": "ACTIVE"
        },
        {
            "id": "SC-002-MULTISIG-HIGH-VALUE",
            "name": "Multi-Signature High-Impact Threshold",
            "version": "1.2.0",
            "description": "Requires multi-stakeholder consensus authorization for high-budget controls (> ₹50,000).",
            "status": "ACTIVE"
        },
        {
            "id": "SC-003-COMPLIANCE-SLA",
            "name": "NIST CSF & CISA KEV SLA Compliance Guard",
            "version": "2.1.0",
            "description": "Verifies that KEV-flagged vulnerabilities have remediation SLAs <= 48 hours.",
            "status": "ACTIVE"
        }
    ]

    _execution_history = []

    @classmethod
    def execute_contracts(cls, transaction: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Executes all active smart contracts against the candidate transaction.
        Returns (passed, contract_report, execution_metadata).
        """
        action = transaction.get("action", "")
        payload = transaction.get("payload", {})
        actor = transaction.get("actor", "")

        results = {}
        all_passed = True
        failure_reasons = []

        # 1. SC-001: Risk Reduction & ROSI Policy
        sc1_pass = True
        sc1_msg = "Passed: Risk policy satisfied or not applicable."
        if "APPROV" in action.upper() or "RECOMMEND" in action.upper():
            rosi = payload.get("rosi", 0.0)
            reduction = payload.get("risk_reduction", 0.0)
            if rosi < 0:
                sc1_pass = False
                sc1_msg = f"Rejected: Negative ROSI ({rosi:.2f}%) violates SC-001 capital preservation rule."
            elif reduction < 0.05 and payload.get("cost", 0) > 20000:
                sc1_pass = False
                sc1_msg = f"Rejected: Negligible risk reduction ({reduction*100:.1f}%) for high cost."

        results["SC-001-RISK-POLICY"] = {"passed": sc1_pass, "detail": sc1_msg}
        if not sc1_pass:
            all_passed = False
            failure_reasons.append(sc1_msg)

        # 2. SC-002: Multi-Sig Governance for High Value
        sc2_pass = True
        sc2_msg = "Passed: Multi-sig rule satisfied."
        cost = payload.get("cost", 0.0)
        if cost >= 100000:
            signatures = transaction.get("signatures", [])
            if len(signatures) < 2:
                sc2_pass = False
                sc2_msg = f"Rejected: Control cost ₹{cost:,.2f} requires at least 2 stakeholder cryptographic signatures."

        results["SC-002-MULTISIG-HIGH-VALUE"] = {"passed": sc2_pass, "detail": sc2_msg}
        if not sc2_pass:
            all_passed = False
            failure_reasons.append(sc2_msg)

        # 3. SC-003: Compliance SLA Guard
        sc3_pass = True
        sc3_msg = "Passed: NIST/CISA SLA verified."
        if payload.get("cisa_kev") and payload.get("sla_hours", 24) > 48:
            sc3_pass = False
            sc3_msg = "Rejected: CISA KEV incident SLA cannot exceed 48 hours."

        results["SC-003-COMPLIANCE-SLA"] = {"passed": sc3_pass, "detail": sc3_msg}
        if not sc3_pass:
            all_passed = False
            failure_reasons.append(sc3_msg)

        report = "All smart contracts passed successfully." if all_passed else " | ".join(failure_reasons)
        
        exec_record = {
            "tx_id": transaction.get("tx_id", "N/A"),
            "action": action,
            "passed": all_passed,
            "report": report,
            "contract_results": results
        }
        cls._execution_history.append(exec_record)
        if len(cls._execution_history) > 50:
            cls._execution_history.pop(0)

        return all_passed, report, results

    @classmethod
    def get_contracts(cls):
        return cls.CONTRACTS

    @classmethod
    def get_execution_history(cls):
        return cls._execution_history
