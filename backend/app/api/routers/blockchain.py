from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.services.blockchain.network import blockchain_network
from app.services.blockchain.crypto_wallet import CryptoWallet
from app.services.blockchain.smart_contracts import SmartContractEngine

router = APIRouter(prefix="/blockchain", tags=["Decentralized Consortium Blockchain"])

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

@router.get("/network")
def get_network_overview():
    """Returns overview of the decentralized blockchain consortium network."""
    return blockchain_network.get_network_overview()

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
    # Use CISO node mempool as primary view
    node = blockchain_network.nodes.get("node_ciso")
    return {
        "pending_count": len(node.mempool) if node else 0,
        "transactions": node.mempool if node else []
    }

@router.post("/transaction")
def create_transaction(req: TransactionRequest):
    """
    Submits a new transaction, signs it with the actor's ECDSA private key,
    validates with Smart Contracts, and broadcasts to all peer node mempools.
    """
    success, msg, details = blockchain_network.broadcast_transaction(
        action=req.action,
        actor_role=req.actor_role,
        actor_id=req.actor_id,
        payload=req.payload
    )
    if not success:
        raise HTTPException(status_code=400, detail={"message": msg, "details": details})
    return {"success": True, "message": msg, "details": details}

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
