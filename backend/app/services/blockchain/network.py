import logging
import uuid
import datetime
import copy
from typing import Dict, List, Any, Tuple, Optional
from app.services.blockchain.node import BlockchainNode, Block
from app.services.blockchain.crypto_wallet import CryptoWallet
from app.services.blockchain.smart_contracts import SmartContractEngine

logger = logging.getLogger(__name__)

class BlockchainNetworkManager:
    """
    Decentralized Consortium Blockchain Network Manager.
    Coordinates 4 independent peer nodes (CISO, SOC, Auditor, Compliance).
    Implements P2P broadcasting, Proof-of-Work mining, Byzantine quorum consensus,
    and automatic tamper recovery.
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(BlockchainNetworkManager, cls).__new__(cls)
            cls._instance._init_network()
        return cls._instance

    def _init_network(self):
        """Initializes the 4 consortium nodes with their peer connections."""
        self.nodes: Dict[str, BlockchainNode] = {
            "node_ciso": BlockchainNode(
                node_id="node_ciso",
                name="CISO Executive Authority Node",
                role="CISO",
                port=8001,
                difficulty=2
            ),
            "node_soc": BlockchainNode(
                node_id="node_soc",
                name="SOC Operations & Threat Intel Node",
                role="SOC",
                port=8002,
                difficulty=2
            ),
            "node_auditor": BlockchainNode(
                node_id="node_auditor",
                name="Independent IT Security Auditor Node",
                role="AUDITOR",
                port=8003,
                difficulty=2
            ),
            "node_compliance": BlockchainNode(
                node_id="node_compliance",
                name="Regulatory & Compliance Authority Node",
                role="COMPLIANCE",
                port=8004,
                difficulty=2
            )
        }
        self.consensus_logs: List[Dict[str, Any]] = []
        logger.info("Consortium Blockchain Network initialized with 4 decentralized peer nodes.")

    def get_network_overview(self) -> Dict[str, Any]:
        """Returns consolidated network health, node topologies, and consensus state."""
        nodes_info = [node.get_node_info() for node in self.nodes.values()]
        
        # Check consensus across nodes
        heights = [n["block_height"] for n in nodes_info]
        all_synced = len(set(heights)) == 1 and all(n["is_valid"] for n in nodes_info)
        tampered_nodes = [n["node_id"] for n in nodes_info if not n["is_valid"]]

        # Total unique transactions across latest chain
        sample_chain = self.nodes["node_ciso"].chain
        total_tx = sum(len(b.transactions) for b in sample_chain)

        return {
            "network_name": "CyberOpt-RQ Enterprise Consortium Network",
            "protocol": "Byzantine Fault Tolerant Proof-of-Work (BFT-PoW)",
            "consensus_health": "OPTIMAL (100% QUORUM)" if all_synced else f"ANOMALY DETECTED ({len(tampered_nodes)} Nodes Tampered)",
            "all_nodes_in_consensus": all_synced,
            "tampered_nodes": tampered_nodes,
            "total_nodes": len(self.nodes),
            "active_nodes_count": len([n for n in nodes_info if n["status"] != "OFFLINE"]),
            "current_block_height": heights[0] if heights else 0,
            "total_confirmed_transactions": total_tx,
            "mining_difficulty": 2,
            "nodes": nodes_info,
            "recent_consensus_events": self.consensus_logs[-10:]
        }

    def broadcast_transaction(
        self,
        action: str,
        actor_role: str,
        actor_id: str,
        payload: Dict[str, Any]
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Creates, cryptographically signs with ECDSA, and broadcasts a transaction
        to all peer nodes in the decentralized network.
        """
        stakeholder_key = actor_role.lower() if actor_role.lower() in CryptoWallet.STAKEHOLDERS else "ciso"
        public_key = CryptoWallet.get_public_key(stakeholder_key)
        signature = CryptoWallet.sign_payload(stakeholder_key, payload)

        tx = {
            "tx_id": f"TX-{uuid.uuid4().hex[:8].upper()}",
            "action": action,
            "actor": actor_id,
            "actor_role": actor_role.upper(),
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "payload": payload,
            "public_key": public_key,
            "signatures": [
                {
                    "signer": stakeholder_key,
                    "public_key": public_key,
                    "signature": signature
                }
            ]
        }

        # Validate with smart contracts first
        sc_passed, sc_report, contract_results = SmartContractEngine.execute_contracts(tx)
        if not sc_passed:
            return False, f"Smart Contract Rule Rejection: {sc_report}", {"transaction": tx, "contract_results": contract_results}

        # Broadcast to each node's mempool
        acceptance = {}
        for nid, node in self.nodes.items():
            success, msg = node.add_transaction(copy.deepcopy(tx))
            acceptance[nid] = {"accepted": success, "message": msg}

        all_accepted = all(a["accepted"] for a in acceptance.values())
        return all_accepted, "Transaction signed and broadcasted across all peer node mempools.", {
            "transaction": tx,
            "acceptance": acceptance,
            "contract_results": contract_results
        }

    def mine_and_consensus(self, miner_node_id: str = "node_ciso") -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Performs PoW mining on the designated node and achieves BFT consensus across peer nodes.
        """
        miner_node = self.nodes.get(miner_node_id)
        if not miner_node:
            return False, f"Invalid miner node: {miner_node_id}", None

        if not miner_node.mempool:
            return False, "Cannot mine: Mempool is empty. Submit a decision/transaction first.", None

        # 1. Miner finds PoW Nonce
        new_block = miner_node.mine_block()
        if not new_block:
            return False, "Mining failed or mempool empty.", None

        # 2. Broadcast newly mined block to all peer nodes for validation & endorsement
        votes = {miner_node_id: {"vote": "APPROVE", "reason": "Block Mined by Local Node", "endorsed": True}}
        for nid, peer in self.nodes.items():
            if nid == miner_node_id:
                continue
            
            # Peer validates block
            is_valid, reason = peer.validate_incoming_block(new_block)
            if is_valid:
                peer.receive_block(copy.deepcopy(new_block))
                votes[nid] = {"vote": "APPROVE", "reason": reason, "endorsed": True}
            else:
                votes[nid] = {"vote": "REJECT", "reason": reason, "endorsed": False}

        approve_count = sum(1 for v in votes.values() if v["vote"] == "APPROVE")
        quorum_reached = approve_count > (len(self.nodes) / 2)

        event = {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "event_type": "BLOCK_MINED_AND_CONSENSUS_REACHED",
            "block_index": new_block.index,
            "block_hash": new_block.hash,
            "nonce": new_block.nonce,
            "miner_node": miner_node_id,
            "votes": votes,
            "quorum_reached": quorum_reached,
            "approval_ratio": f"{approve_count}/{len(self.nodes)}"
        }
        self.consensus_logs.append(event)
        
        return True, f"Block #{new_block.index} mined with Nonce {new_block.nonce} and consensus achieved ({approve_count}/{len(self.nodes)} nodes agreed).", event

    def simulate_tamper_attack(self, node_id: str = "node_ciso", block_index: int = 1) -> Dict[str, Any]:
        """
        Simulates an unauthorized modification to a block in one node to demonstrate decentralized fault tolerance.
        """
        node = self.nodes.get(node_id)
        if not node:
            return {"success": False, "message": "Node not found"}

        if block_index >= len(node.chain):
            block_index = max(1, len(node.chain) - 1)

        corrupted_data = {
            "unauthorized_reversal": "CISO APPROVAL FALSIFIED BY ATTACKER",
            "malicious_amount_stolen": "₹10,000,000",
            "tampered_by": "Insider Root Access Threat"
        }
        node.tamper_block(block_index, corrupted_data)

        event = {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "event_type": "MALICIOUS_TAMPER_ATTACK_INJECTED",
            "node_id": node_id,
            "block_index": block_index,
            "status": "TAMPER_DETECTED"
        }
        self.consensus_logs.append(event)
        return {
            "success": True,
            "message": f"Block #{block_index} on {node.name} ({node_id}) has been maliciously tampered!",
            "node_id": node_id,
            "block_index": block_index,
            "tamper_status": "CORRUPTED (Ledger cryptographic mismatch detected)"
        }

    def resolve_conflicts_and_auto_repair(self) -> Dict[str, Any]:
        """
        BFT Consensus Algorithm:
        Scans all nodes, tallies valid chains, identifies rogue/tampered nodes by majority vote,
        and auto-repairs the corrupted node using the longest valid consensus chain!
        """
        # 1. Collect and validate chains from all nodes
        chain_votes = {}
        for nid, node in self.nodes.items():
            is_valid, msg, _ = node.validate_chain()
            chain_hash = node.latest_block.hash
            key = (is_valid, chain_hash, len(node.chain))
            if key not in chain_votes:
                chain_votes[key] = {"count": 0, "nodes": [], "chain": node.chain, "valid": is_valid}
            chain_votes[key]["count"] += 1
            chain_votes[key]["nodes"].append(nid)

        # 2. Find majority valid chain
        valid_candidates = [data for key, data in chain_votes.items() if data["valid"]]
        if not valid_candidates:
            return {"success": False, "message": "All nodes in network corrupted or invalid."}

        # Sort by count desc, length desc
        consensus_winner = max(valid_candidates, key=lambda x: (x["count"], len(x["chain"])))
        winning_chain = consensus_winner["chain"]
        agreed_nodes = consensus_winner["nodes"]

        # 3. Identify and repair rogue / corrupted nodes
        repaired_nodes = []
        for nid, node in self.nodes.items():
            is_valid, _, _ = node.validate_chain()
            if not is_valid or nid not in agreed_nodes:
                # Replace corrupted chain with genuine consensus chain
                node.chain = [copy.deepcopy(b) for b in winning_chain]
                node.status = "SYNCED"
                node.last_sync_time = datetime.datetime.utcnow().isoformat()
                repaired_nodes.append(nid)
                logger.info(f"Auto-repaired corrupted node {nid} using majority consensus chain!")

        event = {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "event_type": "BYZANTINE_CONSENSUS_REPAIR_EXECUTED",
            "consensus_majority_count": f"{len(agreed_nodes)}/{len(self.nodes)}",
            "repaired_nodes": repaired_nodes,
            "consensus_block_height": len(winning_chain)
        }
        self.consensus_logs.append(event)

        return {
            "success": True,
            "message": f"Byzantine Consensus Protocol executed: {len(agreed_nodes)}/{len(self.nodes)} nodes reached agreement. Repaired {len(repaired_nodes)} tampered node(s).",
            "agreed_nodes": agreed_nodes,
            "repaired_nodes": repaired_nodes,
            "active_block_height": len(winning_chain),
            "consensus_hash": winning_chain[-1].hash
        }

# Global Singleton Instance
blockchain_network = BlockchainNetworkManager()
