import hashlib
import json
import time
import datetime
import logging
from typing import List, Dict, Any, Optional, Tuple
from app.services.blockchain.crypto_wallet import CryptoWallet
from app.services.blockchain.smart_contracts import SmartContractEngine

logger = logging.getLogger(__name__)

def calculate_merkle_root(transactions: List[Dict[str, Any]]) -> str:
    """Computes SHA-256 Merkle root for a batch of transactions."""
    if not transactions:
        return hashlib.sha256(b"empty_mempool").hexdigest()
    
    current_level = [
        hashlib.sha256(json.dumps(tx, sort_keys=True).encode()).hexdigest()
        for tx in transactions
    ]
    
    while len(current_level) > 1:
        next_level = []
        for i in range(0, len(current_level), 2):
            left = current_level[i]
            right = current_level[i + 1] if i + 1 < len(current_level) else left
            combined = hashlib.sha256((left + right).encode()).hexdigest()
            next_level.append(combined)
        current_level = next_level

    return current_level[0]

class Block:
    def __init__(
        self,
        index: int,
        timestamp: str,
        transactions: List[Dict[str, Any]],
        previous_hash: str,
        nonce: int = 0,
        difficulty: int = 2,
        block_hash: Optional[str] = None,
        miner_node: str = "GENESIS",
        merkle_root: Optional[str] = None,
        validator_signatures: Optional[Dict[str, str]] = None
    ):
        self.index = index
        self.timestamp = timestamp
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.difficulty = difficulty
        self.miner_node = miner_node
        self.merkle_root = merkle_root or calculate_merkle_root(transactions)
        self.validator_signatures = validator_signatures or {}
        self.hash = block_hash or self.compute_hash()

    def compute_hash(self) -> str:
        """Calculates header hash including index, timestamp, merkle_root, prev_hash, nonce, and difficulty."""
        merkle = calculate_merkle_root(self.transactions)
        block_string = (
            f"{self.index}{self.timestamp}{merkle}"
            f"{self.previous_hash}{self.nonce}{self.difficulty}{self.miner_node}"
        )
        return hashlib.sha256(block_string.encode("utf-8")).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "transactions": self.transactions,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce,
            "difficulty": self.difficulty,
            "hash": self.hash,
            "miner_node": self.miner_node,
            "merkle_root": self.merkle_root,
            "validator_signatures": self.validator_signatures
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Block":
        return cls(
            index=data["index"],
            timestamp=data["timestamp"],
            transactions=data.get("transactions", []),
            previous_hash=data["previous_hash"],
            nonce=data.get("nonce", 0),
            difficulty=data.get("difficulty", 2),
            block_hash=data.get("hash"),
            miner_node=data.get("miner_node", "GENESIS"),
            merkle_root=data.get("merkle_root"),
            validator_signatures=data.get("validator_signatures", {})
        )

class BlockchainNode:
    """
    Decentralized Peer-to-Peer Node in the Consortium Blockchain.
    Maintains an independent ledger, local mempool, consensus validator, and network peer links.
    """

    def __init__(self, node_id: str, name: str, role: str, port: int, difficulty: int = 2):
        self.node_id = node_id
        self.name = name
        self.role = role
        self.port = port
        self.difficulty = difficulty
        self.public_key = CryptoWallet.get_public_key(self.role.lower())
        self.chain: List[Block] = []
        self.mempool: List[Dict[str, Any]] = []
        self.status = "ONLINE"  # ONLINE, SYNCED, MINING, TAMPERED
        self.last_sync_time = datetime.datetime.utcnow().isoformat()
        
        # Initialize Genesis Block
        self.create_genesis_block()

    def create_genesis_block(self):
        """Creates cryptographically secure Genesis Block #0."""
        genesis_tx = [{
            "tx_id": "CONSORTIUM-GENESIS-TX-000",
            "action": "CONSORTIUM_GENESIS_INITIALIZED",
            "actor": "System Consensus Protocol",
            "actor_role": "CONSORTIUM_ROOT",
            "timestamp": "2024-01-01T00:00:00Z",
            "payload": {
                "message": "CyberOpt-RQ Decentralized Consortium Ledger Initialized",
                "charter": "Immutable Enterprise Cyber-Risk Quantification & Control Governance",
                "consensus": "Byzantine Fault Tolerant Proof-of-Work (BFT-PoW)",
                "cryptography": "ECDSA-secp256k1 & SHA-256"
            },
            "signatures": [{"signer": "ROOT", "signature": "0"*128}]
        }]

        genesis_block = Block(
            index=0,
            timestamp="2024-01-01T00:00:00Z",
            transactions=genesis_tx,
            previous_hash="0" * 64,
            nonce=10101,
            difficulty=self.difficulty,
            miner_node="CONSORTIUM_ROOT"
        )
        self.chain = [genesis_block]

    @property
    def latest_block(self) -> Block:
        return self.chain[-1]

    def add_transaction(self, tx: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validates transaction cryptographic signature and smart contracts, then adds to mempool.
        """
        # 1. Verify Smart Contracts
        sc_passed, sc_report, _ = SmartContractEngine.execute_contracts(tx)
        if not sc_passed:
            logger.warning(f"[{self.node_id}] Transaction rejected by smart contract: {sc_report}")
            return False, f"Smart Contract Violation: {sc_report}"

        # 2. Check if transaction has signature & verify ECDSA
        signatures = tx.get("signatures", [])
        if signatures:
            for sig_info in signatures:
                signer_role = sig_info.get("signer", "").lower()
                pub_hex = CryptoWallet.get_public_key(signer_role)
                sig_hex = sig_info.get("signature", "")
                if not CryptoWallet.verify_signature(pub_hex, tx.get("payload", {}), sig_hex):
                    logger.warning(f"[{self.node_id}] Cryptographic ECDSA signature verification failed for {signer_role}!")
                    return False, f"ECDSA Signature Verification Failed for stakeholder: {signer_role}"

        # 3. Add to mempool
        tx["added_to_mempool_at"] = datetime.datetime.utcnow().isoformat()
        self.mempool.append(tx)
        logger.info(f"[{self.node_id}] Transaction {tx.get('tx_id')} accepted into local mempool.")
        return True, "Transaction validated and added to mempool."

    def mine_block(self, max_tx_count: int = 10) -> Optional[Block]:
        """
        Performs Proof-of-Work mining on mempool transactions:
        Finds nonce such that hash starts with '0' * difficulty.
        """
        if not self.mempool:
            logger.info(f"[{self.node_id}] Mempool is empty, nothing to mine.")
            return None

        self.status = "MINING"
        tx_to_mine = self.mempool[:max_tx_count]
        prev_block = self.latest_block
        timestamp = datetime.datetime.utcnow().isoformat()
        merkle_root = calculate_merkle_root(tx_to_mine)
        
        target_prefix = "0" * self.difficulty
        nonce = 0
        computed_hash = ""

        # Proof of Work Loop
        while True:
            block_string = f"{prev_block.index + 1}{timestamp}{merkle_root}{prev_block.hash}{nonce}{self.difficulty}{self.node_id}"
            computed_hash = hashlib.sha256(block_string.encode("utf-8")).hexdigest()
            if computed_hash.startswith(target_prefix):
                break
            nonce += 1

        # Sign the block as the miner
        miner_sig = CryptoWallet.sign_payload(
            self.role.lower(),
            {"block_index": prev_block.index + 1, "hash": computed_hash, "nonce": nonce}
        )

        new_block = Block(
            index=prev_block.index + 1,
            timestamp=timestamp,
            transactions=tx_to_mine,
            previous_hash=prev_block.hash,
            nonce=nonce,
            difficulty=self.difficulty,
            block_hash=computed_hash,
            miner_node=self.node_id,
            merkle_root=merkle_root,
            validator_signatures={self.node_id: miner_sig}
        )

        self.chain.append(new_block)
        self.mempool = self.mempool[max_tx_count:]
        self.status = "SYNCED"
        self.last_sync_time = datetime.datetime.utcnow().isoformat()
        
        logger.info(f"[{self.node_id}] Mined Block #{new_block.index} [Nonce: {nonce}, Hash: {computed_hash[:12]}...]")
        return new_block

    def validate_incoming_block(self, block: Block) -> Tuple[bool, str]:
        """Validates an incoming block from a peer before accepting."""
        prev = self.latest_block
        if block.index != prev.index + 1:
            return False, f"Invalid block index: expected {prev.index + 1}, got {block.index}"
        
        if block.previous_hash != prev.hash:
            return False, f"Broken hash linkage: expected prev_hash {prev.hash[:10]}..., got {block.previous_hash[:10]}..."

        # Verify Proof of Work
        target_prefix = "0" * block.difficulty
        if not block.hash.startswith(target_prefix):
            return False, f"Proof of Work failed: hash does not start with {target_prefix}"

        # Verify computed hash matches header
        expected_hash = block.compute_hash()
        if block.hash != expected_hash:
            return False, f"Hash mismatch: computed {expected_hash[:10]}... != declared {block.hash[:10]}..."

        # Verify Merkle Root
        expected_merkle = calculate_merkle_root(block.transactions)
        if block.merkle_root != expected_merkle:
            return False, "Merkle Root transaction integrity violation"

        return True, "Block cryptographically valid."

    def receive_block(self, block: Block) -> bool:
        """Receives and commits a block mined by a peer if valid."""
        is_valid, reason = self.validate_incoming_block(block)
        if not is_valid:
            logger.warning(f"[{self.node_id}] Rejected block #{block.index} from peer: {reason}")
            return False

        # Sign consensus endorsement
        endorsement = CryptoWallet.sign_payload(
            self.role.lower(),
            {"endorsed_block": block.index, "hash": block.hash}
        )
        block.validator_signatures[self.node_id] = endorsement

        self.chain.append(block)
        # Remove committed transactions from local mempool
        committed_ids = {tx.get("tx_id") for tx in block.transactions if "tx_id" in tx}
        self.mempool = [tx for tx in self.mempool if tx.get("tx_id") not in committed_ids]
        self.last_sync_time = datetime.datetime.utcnow().isoformat()
        return True

    def validate_chain(self) -> Tuple[bool, str, int]:
        """Verifies the integrity of this node's entire blockchain."""
        for i, block in enumerate(self.chain):
            if i == 0:
                continue  # Genesis
            prev = self.chain[i - 1]
            if block.previous_hash != prev.hash:
                return False, f"Hash linkage broken at block #{block.index}. Expected {prev.hash[:12]}..., found {block.previous_hash[:12]}...", i
            
            calc_hash = block.compute_hash()
            if block.hash != calc_hash:
                return False, f"Tamper detected at block #{block.index}! Stored {block.hash[:12]}... != Calculated {calc_hash[:12]}...", i
            
            if not block.hash.startswith("0" * block.difficulty):
                return False, f"PoW difficulty requirement violated at block #{block.index}", i

        return True, f"All {len(self.chain)} blocks cryptographically verified on {self.node_id}.", len(self.chain)

    def tamper_block(self, block_index: int, corrupted_payload: Dict[str, Any]):
        """
        Simulates an unauthorized malicious modification to a block in this node's local database.
        Demonstrates how decentralized consensus detects and rejects tampered nodes!
        """
        if block_index < 0 or block_index >= len(self.chain):
            return False
        
        target_block = self.chain[block_index]
        target_block.transactions = [{"tampered_by": "MALICIOUS_INSIDER_ATTACK", "payload": corrupted_payload}]
        # Note: hash is NOT updated, causing immediate cryptographic mismatch!
        self.status = "TAMPERED"
        logger.warning(f"[{self.node_id}] MALICIOUS TAMPER SIMULATION APPLIED TO BLOCK #{block_index}!")
        return True

    def get_node_info(self) -> Dict[str, Any]:
        is_valid, msg, _ = self.validate_chain()
        return {
            "node_id": self.node_id,
            "name": self.name,
            "role": self.role,
            "port": self.port,
            "status": "TAMPERED" if not is_valid else self.status,
            "block_height": len(self.chain),
            "latest_hash": self.latest_block.hash,
            "difficulty": self.difficulty,
            "mempool_size": len(self.mempool),
            "public_key": self.public_key,
            "is_valid": is_valid,
            "validation_report": msg,
            "last_sync_time": self.last_sync_time
        }
