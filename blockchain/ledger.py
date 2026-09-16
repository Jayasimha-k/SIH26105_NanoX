"""
blockchain/ledger.py
Local Cryptographic Audit Trail and Integrity Verification Engine.

SIH 2026 Problem Statement 26105
100% Offline Cryptographic Hash Ledger.
Records risk updates, threat correlations, investment decisions, and remediation actions.
"""

import os
import json
import hashlib
import datetime
from typing import Dict, Any, List, Tuple, Optional

ANCHOR_FILE = os.path.join(os.path.dirname(__file__), "trusted_root_anchor.json")


class OfflineBlockchain:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path
        self.anchor_info = self._load_anchor()

    def _load_anchor(self) -> Dict[str, Any]:
        if os.path.exists(ANCHOR_FILE):
            with open(ANCHOR_FILE, "r") as f:
                return json.load(f)
        return {
            "genesis_block_index": 0,
            "genesis_previous_hash": "0" * 64,
            "algorithm": "SHA-256"
        }

    @staticmethod
    def calculate_hash(
        block_index: int,
        timestamp: str,
        organization_id: str,
        event_type: str,
        previous_risk: float,
        new_risk: float,
        trigger: str,
        affected_asset: str,
        model_version: str,
        details_json: str,
        previous_hash: str
    ) -> str:
        """
        Calculates cryptographic SHA-256 hash across all block header fields and payload.
        """
        payload = (
            f"{block_index}|{timestamp}|{organization_id}|{event_type}|"
            f"{previous_risk:.2f}|{new_risk:.2f}|{trigger}|{affected_asset}|"
            f"{model_version}|{details_json}|{previous_hash}"
        )
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def create_block_record(
        self,
        last_block: Optional[Dict[str, Any]],
        organization_id: str,
        event_type: str,
        previous_risk: float,
        new_risk: float,
        trigger: str,
        affected_asset: str,
        details: Dict[str, Any],
        model_version: str = "0.1.0"
    ) -> Dict[str, Any]:
        """
        Constructs a new cryptographically chained audit block.
        """
        if last_block is None:
            block_index = 0
            previous_hash = self.anchor_info.get("genesis_previous_hash", "0" * 64)
        else:
            block_index = last_block["block_index"] + 1
            previous_hash = last_block["block_hash"]

        timestamp = datetime.datetime.utcnow().isoformat() + "Z"
        details_json = json.dumps(details, sort_keys=True)

        block_hash = self.calculate_hash(
            block_index=block_index,
            timestamp=timestamp,
            organization_id=organization_id,
            event_type=event_type,
            previous_risk=previous_risk,
            new_risk=new_risk,
            trigger=trigger,
            affected_asset=affected_asset,
            model_version=model_version,
            details_json=details_json,
            previous_hash=previous_hash
        )

        return {
            "block_index": block_index,
            "timestamp": timestamp,
            "organization_id": organization_id,
            "event_type": event_type,
            "previous_risk": round(previous_risk, 2),
            "new_risk": round(new_risk, 2),
            "trigger": trigger,
            "affected_asset": affected_asset,
            "model_version": model_version,
            "details_json": details_json,
            "previous_hash": previous_hash,
            "block_hash": block_hash
        }

    def verify_chain(self, blocks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Verifies cryptographic integrity of the entire blockchain against the trusted anchor.
        Detects broken links, header tampering, or payload modifications.
        """
        if not blocks:
            return {
                "is_valid": True,
                "status": "VERIFIED ✓",
                "blocks_checked": 0,
                "message": "Blockchain is currently empty."
            }

        expected_genesis_prev = self.anchor_info.get("genesis_previous_hash", "0" * 64)

        for i, block in enumerate(blocks):
            # 1. Verify previous hash linkage
            if i == 0:
                if block["previous_hash"] != expected_genesis_prev:
                    return {
                        "is_valid": False,
                        "status": "INTEGRITY VIOLATION ⚠",
                        "violation_block": 0,
                        "message": f"Genesis block broken! Expected previous hash {expected_genesis_prev[:12]}..., got {block['previous_hash'][:12]}..."
                    }
            else:
                expected_prev = blocks[i - 1]["block_hash"]
                if block["previous_hash"] != expected_prev:
                    return {
                        "is_valid": False,
                        "status": "INTEGRITY VIOLATION ⚠",
                        "violation_block": block["block_index"],
                        "message": f"Hash linkage broken at block #{block['block_index']}! Expected {expected_prev[:12]}..., got {block['previous_hash'][:12]}..."
                    }

            # 2. Recalculate block hash from raw content
            recalculated = self.calculate_hash(
                block_index=block["block_index"],
                timestamp=block["timestamp"],
                organization_id=block["organization_id"],
                event_type=block["event_type"],
                previous_risk=block["previous_risk"],
                new_risk=block["new_risk"],
                trigger=block["trigger"],
                affected_asset=block["affected_asset"],
                model_version=block["model_version"],
                details_json=block["details_json"],
                previous_hash=block["previous_hash"]
            )

            if block["block_hash"] != recalculated:
                return {
                    "is_valid": False,
                    "status": "INTEGRITY VIOLATION ⚠",
                    "violation_block": block["block_index"],
                    "message": f"Data tampering detected at block #{block['block_index']}! Stored hash: {block['block_hash'][:12]}... != Calculated hash: {recalculated[:12]}..."
                }

        return {
            "is_valid": True,
            "status": "VERIFIED ✓",
            "blocks_checked": len(blocks),
            "latest_block_hash": blocks[-1]["block_hash"],
            "message": f"All {len(blocks)} blockchain audit blocks verified cryptographically clean."
        }
