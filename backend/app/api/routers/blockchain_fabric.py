"""
backend/app/api/routers/blockchain.py
================================================================================
FASTAPI ROUTER: HYPERLEDGER FABRIC PERMISSIONED BLOCKCHAIN ENDPOINTS
SIH 2026 Problem Statement 26105
================================================================================
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from app.services.fabric_service import FabricService

router = APIRouter(prefix="/blockchain", tags=["Hyperledger Fabric Blockchain"])


# ------------------------------------------------------------------------------
# Request Schemas
# ------------------------------------------------------------------------------
class RiskAssessmentTxRequest(BaseModel):
    organization_id: str = Field(..., example="ORG-HOSP-A")
    threat_id: str = Field(..., example="CVE-2021-34473")
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
# Endpoints
# ------------------------------------------------------------------------------

@router.get("/status")
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
    Queries the immutable history of all blockchain events for a specific organization.
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
        raise HTTPException(status_code=404, detail=f"Audit event not found or Fabric offline: {data}")
    return data
