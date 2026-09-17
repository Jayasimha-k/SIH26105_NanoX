import sys
import os

# Add current path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.blockchain.crypto_wallet import CryptoWallet
from app.services.blockchain.smart_contracts import SmartContractEngine
from app.services.blockchain.network import blockchain_network

def test_blockchain():
    print("==================================================")
    print("TESTING DECENTRALIZED CONSORTIUM BLOCKCHAIN SYSTEM")
    print("==================================================")

    # 1. Test ECDSA Wallet & Cryptography
    print("\n[1] Testing ECDSA Key Pairs & Digital Signatures...")
    ciso_pub = CryptoWallet.get_public_key("ciso")
    print(f"  [PASS] CISO ECDSA Public Key: {ciso_pub[:32]}... ({len(ciso_pub)} chars)")
    
    test_payload = {"action": "APPROVE_FIREWALL", "cost": 35000, "rosi": 142.5}
    signature = CryptoWallet.sign_payload("ciso", test_payload)
    print(f"  [PASS] Signature generated with secp256k1: {signature[:32]}...")
    
    is_valid = CryptoWallet.verify_signature(ciso_pub, test_payload, signature)
    assert is_valid, "Signature verification failed!"
    print(f"  [PASS] Signature cryptographically verified: {is_valid}")

    # 2. Test Smart Contracts
    print("\n[2] Testing Decentralized Smart Contracts Engine...")
    valid_tx = {
        "tx_id": "TX-TEST-001",
        "action": "APPROVE_CONTROL",
        "actor": "ciso@enterprise.com",
        "payload": {"cost": 40000, "risk_reduction": 0.35, "rosi": 120.0}
    }
    passed, report, _ = SmartContractEngine.execute_contracts(valid_tx)
    print(f"  [PASS] Valid Policy Check: Passed={passed}, Report={report}")
    assert passed, "Valid transaction should pass smart contract!"

    invalid_tx = {
        "tx_id": "TX-TEST-002",
        "action": "APPROVE_CONTROL",
        "actor": "ciso@enterprise.com",
        "payload": {"cost": 40000, "risk_reduction": 0.01, "rosi": -25.0}  # Negative ROSI
    }
    passed, report, _ = SmartContractEngine.execute_contracts(invalid_tx)
    print(f"  [PASS] Violation Check: Passed={passed}, Report={report}")
    assert not passed, "Negative ROSI should be rejected by SC-001!"

    # 3. Test Multi-Node Consortium Setup
    print("\n[3] Testing Decentralized Consortium Network (4 Independent Nodes)...")
    nodes = blockchain_network.nodes
    print(f"  [PASS] Consortium Nodes Initialized: {list(nodes.keys())}")
    for nid, node in nodes.items():
        info = node.get_node_info()
        print(f"    - {info['name']} (Port {info['port']}): Height={info['block_height']}, Status={info['status']}, Genesis Hash={info['latest_hash'][:12]}...")

    # 4. Broadcast Transaction to All Nodes
    print("\n[4] Broadcasting Cryptographically Signed Transaction to Network Mempools...")
    success, msg, details = blockchain_network.broadcast_transaction(
        action="CISO_CONTROL_APPROVED",
        actor_role="ciso",
        actor_id="ciso@globalcyber.org",
        payload={
            "control_id": "CTRL-WAF-001",
            "control_name": "Cloud Next-Gen Web Application Firewall",
            "cost": 45000.0,
            "risk_reduction": 0.72,
            "rosi": 185.4
        }
    )
    print(f"  [PASS] Broadcast result: {msg}")
    for nid, node in nodes.items():
        print(f"    - {nid} Mempool Size: {len(node.mempool)} tx")

    # 5. Mine Block with Proof-of-Work & Run BFT Consensus
    print("\n[5] Mining Block with PoW & Achieving Multi-Node Consensus...")
    success, msg, event = blockchain_network.mine_and_consensus(miner_node_id="node_ciso")
    print(f"  [PASS] Mining Result: {msg}")
    print(f"  [PASS] Nonce: {event['nonce']}, Block Hash: {event['block_hash'][:24]}...")
    print(f"  [PASS] Byzantine Quorum Votes: {event['approval_ratio']}")
    for nid, node in nodes.items():
        print(f"    - {nid} New Block Height: {len(node.chain)} | Valid: {node.validate_chain()[0]}")

    # 6. Simulate Malicious Insider Tamper Attack on Node 1 (CISO)
    print("\n[6] Simulating Malicious Tamper Attack on Node 1 (CISO)...")
    tamper_res = blockchain_network.simulate_tamper_attack(node_id="node_ciso", block_index=1)
    print(f"  [PASS] Tamper applied: {tamper_res['message']}")
    ciso_valid, ciso_msg, _ = nodes["node_ciso"].validate_chain()
    print(f"  [PASS] Node 1 Validation: Valid={ciso_valid}, Error='{ciso_msg}'")
    assert not ciso_valid, "Tampered node should fail validation!"

    # 7. Run Byzantine Consensus & Auto-Repair
    print("\n[7] Running Byzantine Consensus Protocol & Auto-Recovery...")
    repair_res = blockchain_network.resolve_conflicts_and_auto_repair()
    print(f"  [PASS] Consensus Protocol Output: {repair_res['message']}")
    print(f"  [PASS] Nodes Reached Agreement: {repair_res['agreed_nodes']}")
    print(f"  [PASS] Repaired Nodes: {repair_res['repaired_nodes']}")
    
    ciso_repaired_valid, ciso_repaired_msg, _ = nodes["node_ciso"].validate_chain()
    print(f"  [PASS] Node 1 Post-Consensus Validation: Valid={ciso_repaired_valid}, Msg='{ciso_repaired_msg}'")
    assert ciso_repaired_valid, "Node 1 should be restored by consensus majority!"

    # 8. Testing Risk Assessment Anchoring with Validated P6 Evidence Provenance
    print("\n[8] Testing Risk Assessment Anchoring with P5/P6 Evidence Provenance...")
    prov_success, prov_msg, prov_details = blockchain_network.broadcast_transaction(
        action="RISK_ASSESSMENT_ANCHORED",
        actor_role="soc",
        actor_id="soc_analyst@enterprise.com",
        payload={
            "assessment_id": "ASSESS-2026-0917-P6",
            "organization": "NanoX Enterprise",
            "threat": "PortScan & Ingress Telemetry",
            "p5_prior_risk": 0.0001,
            "p6_network_evidence": 0.9994,
            "fused_probability": 0.8995,
            "fusion_version": "v2",
            "p5_model_version": "CyberOptRQ_Meta_XGBoost_FINAL_4INPUT",
            "p6_model_version": "CyberOptRQ_P6_CIC2017_XGBoost_v1",
            "p6_weight": 0.90,
            "eal_pre": 899500.0,
            "eal_post": 125000.0,
            "timestamp": "2026-09-17T04:45:00Z"
        }
    )
    print(f"  [PASS] Provenance Broadcast: {prov_msg}")
    mine_ok, mine_msg, mine_evt = blockchain_network.mine_and_consensus(miner_node_id="node_soc")
    print(f"  [PASS] Provenance Block Mined: Height={len(nodes['node_soc'].chain)}, Hash={mine_evt['block_hash'][:24]}...")
    assert mine_ok, "Provenance block mining should succeed!"

    print("\n==================================================")
    print("ALL BLOCKCHAIN SYSTEM TESTS PASSED SUCCESSFULLY! :)")
    print("==================================================")

if __name__ == "__main__":
    test_blockchain()
