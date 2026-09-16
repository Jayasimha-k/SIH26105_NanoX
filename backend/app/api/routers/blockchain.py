"""
backend/app/api/routers/blockchain.py
================================================================================
SIH 2026 Problem Statement 26105:
HYPERLEDGER FABRIC PERMISSIONED BLOCKCHAIN & CONSORTIUM AUDIT ROUTER
================================================================================
Architecture:
- Real Multi-Node Hyperledger Fabric Network (etcdraft / Raft consensus, 3 Orderers, 2 Peers)
- Smart Contract: cyber_risk_audit on channel cyber-risk-channel
- Interactive Consortium Audit Dashboard for Review 2 Demonstrations
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

from app.services.fabric_service import FabricService
from app.services.blockchain.network import blockchain_network
from app.services.blockchain.crypto_wallet import CryptoWallet
from app.services.blockchain.smart_contracts import SmartContractEngine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/blockchain", tags=["Hyperledger Fabric & Consortium Blockchain"])


# ------------------------------------------------------------------------------
# Request Schemas for Hyperledger Fabric Transactions
# ------------------------------------------------------------------------------
class RiskAssessmentTxRequest(BaseModel):
    organization_id: str = Field(..., example="ORG-HOSP-A")
    threat_id: str = Field(..., example="CVE-2023-44487")
    meta_risk: float = Field(..., example=0.85)
    organization_risk: float = Field(..., example=77.5)
    expected_annual_loss_inr: float = Field(..., example=34600000.0)
    details: Optional[Dict[str, Any]] = None
    event_id: Optional[str] = None


class InvestmentTxRequest(BaseModel):
    organization_id: str = Field(..., example="ORG-HOSP-A")
    control_id: str = Field(..., example="INV-PATCH")
    investment_cost_inr: float = Field(..., example=1800000.0)
    expected_risk_reduction_pts: float = Field(..., example=11.3)
    expected_rosi_pct: float = Field(..., example=311.69)
    details: Optional[Dict[str, Any]] = None
    event_id: Optional[str] = None


class RemediationTxRequest(BaseModel):
    organization_id: str = Field(..., example="ORG-HOSP-A")
    asset_id: str = Field(..., example="SERVER-001")
    action_taken: str = Field(..., example="Emergency Patch Applied & Isolated")
    verified_by: str = Field(..., example="SecOps-Lead-User")
    details: Optional[Dict[str, Any]] = None
    event_id: Optional[str] = None


class ReassessmentTxRequest(BaseModel):
    organization_id: str = Field(..., example="ORG-HOSP-A")
    previous_risk: float = Field(..., example=77.5)
    new_risk: float = Field(..., example=52.4)
    residual_eal_inr: float = Field(..., example=18000000.0)
    details: Optional[Dict[str, Any]] = None
    event_id: Optional[str] = None


# ------------------------------------------------------------------------------
# Request Schemas for Consortium Prototype Views
# ------------------------------------------------------------------------------
class TransactionRequest(BaseModel):
    action: str
    actor_role: str = "CISO"
    actor_id: str = "ciso@enterprise.com"
    payload: Dict[str, Any]


class MiningRequest(BaseModel):
    miner_node_id: str = "node_ciso"


class TamperRequest(BaseModel):
    node_id: str = "node_ciso"
    block_index: int = 1


# ------------------------------------------------------------------------------
# 1. REAL HYPERLEDGER FABRIC ENDPOINTS
# ------------------------------------------------------------------------------

@router.get("/status")
@router.get("/fabric/status")
def get_blockchain_network_status():
    """
    Returns live Hyperledger Fabric network topology and Raft consensus health.
    """
    status = FabricService.check_docker_and_network_status()
    return {
        "network_type": "Permissioned Enterprise Distributed Ledger (Hyperledger Fabric v2.5)",
        "ordering_consensus": "etcdraft (Raft CFT Protocol)",
        "hash_algorithm": "SHA-256 (Block Header & Merkle State Integrity)",
        "channel": status["channel"],
        "smart_contract": status["chaincode"],
        "docker_installed": status["docker_installed"],
        "fabric_network_running": status["fabric_running"],
        "active_ordering_nodes": f"{status['ordering_nodes_active']} / {status['ordering_nodes_target']}",
        "active_peer_nodes": f"{status['peer_nodes_active']} / {status['peer_nodes_target']}",
        "active_containers": status["active_containers"],
        "message": status["message"]
    }


@router.post("/risk-assessment")
def submit_risk_assessment_transaction(req: RiskAssessmentTxRequest):
    """
    Records an AI-quantified risk assessment on the permissioned Fabric ledger.
    """
    res = FabricService.record_risk_assessment(
        org_id=req.organization_id,
        threat_id=req.threat_id,
        meta_risk=req.meta_risk,
        org_risk=req.organization_risk,
        eal=req.expected_annual_loss_inr,
        details=req.details,
        event_id=req.event_id
    )
    return res


@router.post("/investment")
def submit_investment_decision_transaction(req: InvestmentTxRequest):
    """
    Records a budget allocation / Knapsack optimizer recommendation on Fabric.
    """
    res = FabricService.record_investment_decision(
        org_id=req.organization_id,
        control_id=req.control_id,
        investment_cost=req.investment_cost_inr,
        expected_reduction=req.expected_risk_reduction_pts,
        rosi=req.expected_rosi_pct,
        details=req.details,
        event_id=req.event_id
    )
    return res


@router.post("/remediation")
def submit_remediation_transaction(req: RemediationTxRequest):
    """
    Records an operational security remediation action on Fabric.
    """
    res = FabricService.record_remediation(
        org_id=req.organization_id,
        asset_id=req.asset_id,
        action_taken=req.action_taken,
        verified_by=req.verified_by,
        details=req.details,
        event_id=req.event_id
    )
    return res


@router.post("/reassessment")
def submit_reassessment_transaction(req: ReassessmentTxRequest):
    """
    Records a post-remediation risk recalculation and residual EAL on Fabric.
    """
    res = FabricService.record_reassessment(
        org_id=req.organization_id,
        previous_risk=req.previous_risk,
        new_risk=req.new_risk,
        residual_eal=req.residual_eal_inr,
        details=req.details,
        event_id=req.event_id
    )
    return res


@router.get("/history/{organization_id}")
def query_organization_history(organization_id: str):
    """
    Queries the immutable history of all blockchain events for a specific organization from Fabric.
    """
    success, data = FabricService.query_chaincode("getOrganizationHistory", [organization_id])
    if not success:
        return {
            "organization_id": organization_id,
            "status": "FABRIC_OFFLINE",
            "message": data,
            "events": []
        }
    return {
        "organization_id": organization_id,
        "status": "SUCCESS",
        "events": data
    }


@router.get("/event/{event_id}")
def query_audit_event(event_id: str):
    """
    Queries a specific audit event from the Fabric ledger by event ID.
    """
    success, data = FabricService.query_chaincode("getAuditEvent", [event_id])
    if not success:
        raise HTTPException(status_code=404, detail=f"Audit event not found on Fabric ledger: {data}")
    return data


@router.get("/latest/{organization_id}")
def query_latest_risk(organization_id: str):
    """
    Queries the latest risk assessment and EAL pointer from Fabric ledger.
    """
    success, data = FabricService.query_chaincode("getLatestRisk", [organization_id])
    if not success:
        raise HTTPException(status_code=404, detail=f"Latest risk not found for {organization_id}: {data}")
    return data


# ------------------------------------------------------------------------------
# 2. CONSORTIUM PROTOTYPE & UI DEMO ENDPOINTS
# ------------------------------------------------------------------------------

@router.get("/network")
def get_network_overview():
    """Returns overview of the decentralized blockchain consortium network."""
    overview = blockchain_network.get_network_overview()
    fabric_status = FabricService.check_docker_and_network_status()
    overview["fabric_production_network"] = {
        "enabled": fabric_status["fabric_running"],
        "orderers": fabric_status["ordering_nodes_active"],
        "peers": fabric_status["peer_nodes_active"],
        "channel": fabric_status["channel"],
        "chaincode": fabric_status["chaincode"],
        "consensus": fabric_status["consensus_type"]
    }
    return overview


@router.get("/nodes")
def get_nodes():
    """Returns list and live status of all 4 decentralized peer nodes."""
    return [node.get_node_info() for node in blockchain_network.nodes.values()]


@router.get("/nodes/{node_id}/chain")
def get_node_chain(node_id: str):
    """Returns the independent blockchain stored locally on a specific peer node."""
    node = blockchain_network.nodes.get(node_id)
    if not node:
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found.")
    return {
        "node_id": node_id,
        "name": node.name,
        "block_height": len(node.chain),
        "status": node.status,
        "chain": [block.to_dict() for block in node.chain]
    }


@router.get("/mempool")
def get_mempool():
    """Returns current unconfirmed transactions waiting in node mempools."""
    node = blockchain_network.nodes.get("node_ciso")
    return {
        "pending_count": len(node.mempool) if node else 0,
        "transactions": node.mempool if node else []
    }


@router.post("/transaction")
def create_transaction(req: TransactionRequest):
    """
    Submits a transaction to consortium mempools AND anchors critical events
    to the live Hyperledger Fabric production network.
    """
    # 1. Broadcast to consortium network
    success, msg, details = blockchain_network.broadcast_transaction(
        action=req.action,
        actor_role=req.actor_role,
        actor_id=req.actor_id,
        payload=req.payload
    )
    if not success:
        raise HTTPException(status_code=400, detail={"message": msg, "details": details})

    # 2. Automatically anchor to Hyperledger Fabric if network is online
    fabric_result = None
    try:
        if req.action == "RISK_ASSESSMENT":
            fabric_result = FabricService.record_risk_assessment(
                org_id=req.payload.get("organization_id", "ORG-HOSP-A"),
                threat_id=req.payload.get("vulnerability_id", "CVE-UNKNOWN"),
                meta_risk=float(req.payload.get("meta_prob", 0.0)),
                org_risk=float(req.payload.get("org_adapted_prob", 0.0)) * 100.0,
                eal=float(req.payload.get("eal_pre", 0.0)),
                details=req.payload
            )
        elif req.action in ["INVESTMENT_DECISION", "BUDGET_OPTIMIZATION"]:
            fabric_result = FabricService.record_investment_decision(
                org_id=req.payload.get("organization_id", "ORG-HOSP-A"),
                control_id=str(req.payload.get("control_id", "PORTFOLIO")),
                investment_cost=float(req.payload.get("total_cost", 0.0)),
                expected_reduction=float(req.payload.get("risk_reduction", 0.0)),
                rosi=float(req.payload.get("rosi", 0.0)),
                details=req.payload
            )
        elif req.action in ["REMEDIATION_EXECUTION", "REMEDIATION"]:
            fabric_result = FabricService.record_remediation(
                org_id=req.payload.get("organization_id", "ORG-HOSP-A"),
                asset_id=str(req.payload.get("asset_id", "SERVER-001")),
                action_taken=str(req.payload.get("action", "SECURITY_CONTROL_APPLIED")),
                verified_by=req.actor_id,
                details=req.payload
            )
    except Exception as e:
        logger.warning(f"Fabric anchor skipped: {e}")

    return {
        "success": True,
        "message": msg,
        "details": details,
        "fabric_anchor": fabric_result
    }


@router.post("/mine")
def mine_block(req: Optional[MiningRequest] = None):
    """
    Triggers Proof-of-Work mining on the specified node and runs BFT consensus voting across peers.
    """
    miner_id = req.miner_node_id if req else "node_ciso"
    success, msg, event = blockchain_network.mine_and_consensus(miner_node_id=miner_id)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg, "consensus_event": event}


@router.post("/tamper")
def tamper_block(req: TamperRequest):
    """
    Simulates a malicious attack modifying a block in one node's local database.
    Demonstrates decentralized detection of rogue nodes.
    """
    res = blockchain_network.simulate_tamper_attack(
        node_id=req.node_id,
        block_index=req.block_index
    )
    return res


@router.post("/resolve-conflicts")
def resolve_conflicts():
    """
    Executes Byzantine Multi-Node Consensus voting:
    Validates all peer chains, identifies corrupted nodes, and auto-repairs using the genuine consensus chain.
    """
    res = blockchain_network.resolve_conflicts_and_auto_repair()
    return res


@router.get("/smart-contracts")
def get_smart_contracts():
    """Returns active smart contracts and execution audit history."""
    return {
        "contracts": SmartContractEngine.get_contracts(),
        "execution_history": SmartContractEngine.get_execution_history()
    }


@router.get("/directory")
def get_consortium_directory():
    """Returns registered consortium stakeholder public keys and cryptography specifications."""
    return {
        "network": "CyberOpt-RQ Permissioned Consortium",
        "elliptic_curve": "SECP256K1",
        "hash_algorithm": "SHA-256",
        "stakeholders": CryptoWallet.get_consortium_directory()
    }
