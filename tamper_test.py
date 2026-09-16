"""
tamper_test.py
Demonstrates Cryptographic Blockchain Tamper Detection.

SIH 2026 Problem Statement 26105
Procedure:
1. Verifies pristine blockchain integrity -> VERIFIED ✓
2. Simulates an adversary modifying an audit record in the database (e.g., lowering risk score from 71.0 to 25.0)
3. Re-runs cryptographic verification -> Fails with INTEGRITY VIOLATION ⚠
4. Restores original record -> Returns to VERIFIED ✓
"""

import os
import sys
import json
import sqlite3

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from database.db_manager import get_connection, DB_PATH
from blockchain.ledger import OfflineBlockchain


def run_tamper_demonstration():
    print("==================================================")
    print("  BLOCKCHAIN CRYPTOGRAPHIC TAMPER TEST")
    print("==================================================")

    bc = OfflineBlockchain(DB_PATH)
    conn = get_connection(DB_PATH)
    cursor = conn.cursor()

    # Step 1: Read current blocks and verify integrity
    cursor.execute("SELECT * FROM blockchain_records ORDER BY block_index ASC")
    blocks = [dict(row) for row in cursor.fetchall()]

    print(f"\n[Phase 1] Verifying current ledger ({len(blocks)} blocks)...")
    res1 = bc.verify_chain(blocks)
    print(f"  Status: {res1['status']}")
    print(f"  Report: {res1['message']}")

    if not res1["is_valid"]:
        print("Initial ledger is already invalid. Please re-seed database.")
        conn.close()
        return

    # Step 2: Simulate Tampering on Block #0 or #1
    target_block = blocks[-1]
    target_idx = target_block["block_index"]
    original_risk = target_block["new_risk"]
    tampered_risk = 15.0  # Attacker attempts to artificially report low risk

    print(f"\n[Phase 2] Simulating unauthorized modification...")
    print(f"  Target Block: #{target_idx}")
    print(f"  Adversary Action: Modifying stored new_risk from {original_risk:.1f} to {tampered_risk:.1f}")

    cursor.execute(
        "UPDATE blockchain_records SET new_risk = ? WHERE block_index = ?",
        (tampered_risk, target_idx)
    )
    conn.commit()

    # Step 3: Run verification on tampered database
    cursor.execute("SELECT * FROM blockchain_records ORDER BY block_index ASC")
    tampered_blocks = [dict(row) for row in cursor.fetchall()]

    print(f"\n[Phase 3] Running verification on tampered database...")
    res2 = bc.verify_chain(tampered_blocks)
    print(f"  Status: {res2['status']}")
    print(f"  Report: {res2['message']}")

    if not res2["is_valid"] and res2["status"] == "INTEGRITY VIOLATION ⚠":
        print("\n  >> SUCCESS: Tampering was detected and blocked by cryptographic verification!")
    else:
        print("\n  >> FAILURE: Tampering was NOT detected!")

    # Step 4: Revert tampering to restore integrity
    print(f"\n[Phase 4] Reverting database modification to original values...")
    cursor.execute(
        "UPDATE blockchain_records SET new_risk = ? WHERE block_index = ?",
        (original_risk, target_idx)
    )
    conn.commit()

    cursor.execute("SELECT * FROM blockchain_records ORDER BY block_index ASC")
    restored_blocks = [dict(row) for row in cursor.fetchall()]
    res3 = bc.verify_chain(restored_blocks)
    print(f"  Status: {res3['status']}")
    print(f"  Report: {res3['message']}")
    print("==================================================")

    conn.close()


if __name__ == "__main__":
    run_tamper_demonstration()
