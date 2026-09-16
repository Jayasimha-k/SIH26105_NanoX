import hashlib
import json
import datetime
import logging
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.db_models import AuditBlock
from app.services.blockchain.network import blockchain_network

logger = logging.getLogger(__name__)

class LedgerService:
    @staticmethod
    def calculate_hash(
        block_index: int,
        timestamp: str,
        action: str,
        user_id: str,
        details_json: str,
        previous_hash: str
    ) -> str:
        """Computes cryptographic SHA-256 hash for block headers and payload."""
        block_string = f"{block_index}{timestamp}{action}{user_id}{details_json}{previous_hash}"
        return hashlib.sha256(block_string.encode("utf-8")).hexdigest()

    @classmethod
    def record_decision(
        cls,
        db: Session,
        action: str,
        user_id: str,
        details: Dict[str, Any]
    ) -> AuditBlock:
        """
        Appends a new decision block to the cryptographic audit trail ledger.
        Ensures strict hash chaining with the previous block, and broadcasts
        the transaction to the decentralized multi-node consortium blockchain.
        """
        # Get last block in local DB
        last_block = db.query(AuditBlock).order_by(AuditBlock.block_index.desc()).first()
        
        if last_block is None:
            # Genesis Block
            block_index = 0
            previous_hash = "0" * 64
        else:
            block_index = last_block.block_index + 1
            previous_hash = last_block.block_hash

        timestamp = datetime.datetime.utcnow().isoformat()
        details_json = json.dumps(details, sort_keys=True)
        
        block_hash = cls.calculate_hash(
            block_index=block_index,
            timestamp=timestamp,
            action=action,
            user_id=user_id,
            details_json=details_json,
            previous_hash=previous_hash
        )

        new_block = AuditBlock(
            block_index=block_index,
            timestamp=timestamp,
            action=action,
            user_id=user_id,
            details_json=details_json,
            previous_hash=previous_hash,
            block_hash=block_hash
        )

        db.add(new_block)
        db.commit()
        db.refresh(new_block)

        # Broadcast to Decentralized Multi-Node Blockchain Network
        try:
            actor_role = "ciso"
            u_lower = user_id.lower()
            if "soc" in u_lower:
                actor_role = "soc"
            elif "audit" in u_lower:
                actor_role = "auditor"
            elif "compliance" in u_lower:
                actor_role = "compliance"

            # 1. Broadcast cryptographically signed transaction to all peer mempools
            blockchain_network.broadcast_transaction(
                action=action,
                actor_role=actor_role,
                actor_id=user_id,
                payload=details
            )

            # 2. Mine PoW block & achieve consensus across the 4 nodes
            miner_id = f"node_{actor_role}" if f"node_{actor_role}" in blockchain_network.nodes else "node_ciso"
            blockchain_network.mine_and_consensus(miner_node_id=miner_id)
            logger.info(f"Broadcasted & consensus-mined on decentralized blockchain network [{miner_id}]")
        except Exception as e:
            logger.error(f"Error syncing with decentralized blockchain nodes: {e}")

        logger.info(f"Recorded blockchain audit block #{block_index} [Hash: {block_hash[:12]}...]")
        return new_block

    @classmethod
    def verify_chain_integrity(cls, db: Session) -> Tuple[bool, str, int]:
        """
        Verifies cryptographic integrity of all audit blocks in database.
        Returns (is_valid, report_message, total_blocks_checked).
        """
        blocks = db.query(AuditBlock).order_by(AuditBlock.block_index.asc()).all()
        if not blocks:
            return True, "Ledger is empty.", 0

        for i, block in enumerate(blocks):
            if i == 0:
                expected_prev = "0" * 64
            else:
                expected_prev = blocks[i-1].block_hash

            if block.previous_hash != expected_prev:
                msg = f"Hash linkage broken at block #{block.block_index}. Expected prev {expected_prev[:10]}..., got {block.previous_hash[:10]}..."
                logger.error(msg)
                return False, msg, len(blocks)

            calc_hash = cls.calculate_hash(
                block_index=block.block_index,
                timestamp=block.timestamp,
                action=block.action,
                user_id=block.user_id,
                details_json=block.details_json,
                previous_hash=block.previous_hash
            )

            if block.block_hash != calc_hash:
                msg = f"Block data tampered at block #{block.block_index}! Stored hash {block.block_hash[:10]}... != calculated hash {calc_hash[:10]}..."
                logger.error(msg)
                return False, msg, len(blocks)

        return True, f"All {len(blocks)} blockchain audit blocks verified cryptographically clean.", len(blocks)
