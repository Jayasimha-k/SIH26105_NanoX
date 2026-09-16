import os
import json
import hashlib
from typing import Tuple, Dict, Any
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes, serialization

class CryptoWallet:
    """
    ECDSA Cryptographic Wallet for Consortium Blockchain Nodes & Stakeholders.
    Uses elliptic curve SECP256K1 (same standard as Bitcoin/Ethereum).
    """

    STAKEHOLDERS = {
        "ciso": {
            "name": "Chief Information Security Officer (CISO)",
            "role": "CISO",
            "seed": b"cyberopt_rq_consortium_seed_ciso_secret_2024"
        },
        "soc": {
            "name": "SOC Operations Lead",
            "role": "SOC",
            "seed": b"cyberopt_rq_consortium_seed_soc_secret_2024"
        },
        "auditor": {
            "name": "Independent IT Security Auditor",
            "role": "AUDITOR",
            "seed": b"cyberopt_rq_consortium_seed_auditor_secret_2024"
        },
        "compliance": {
            "name": "Regulatory & Compliance Authority",
            "role": "COMPLIANCE",
            "seed": b"cyberopt_rq_consortium_seed_compliance_secret_2024"
        }
    }

    _key_cache = {}

    @classmethod
    def get_or_create_keys(cls, stakeholder_id: str) -> Tuple[str, Any]:
        """
        Returns (public_key_hex, private_key_obj) for a given stakeholder.
        Uses deterministic seed for consortium stability across backend reloads.
        """
        if stakeholder_id in cls._key_cache:
            return cls._key_cache[stakeholder_id]

        info = cls.STAKEHOLDERS.get(stakeholder_id.lower())
        seed_bytes = info["seed"] if info else f"seed_for_{stakeholder_id}".encode()

        # Derive 32-byte private key integer from SHA-256 hash of seed
        derived_int = int.from_bytes(hashlib.sha256(seed_bytes).digest(), byteorder="big")
        # Ensure within SECP256K1 curve order
        curve_order = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
        private_key_int = (derived_int % (curve_order - 1)) + 1
        private_key = ec.derive_private_key(private_key_int, ec.SECP256K1())

        # Public key in compressed hex format
        public_key = private_key.public_key()
        pub_bytes = public_key.public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.CompressedPoint
        )
        pub_hex = pub_bytes.hex()

        cls._key_cache[stakeholder_id] = (pub_hex, private_key)
        return pub_hex, private_key

    @classmethod
    def get_public_key(cls, stakeholder_id: str) -> str:
        pub_hex, _ = cls.get_or_create_keys(stakeholder_id)
        return pub_hex

    @classmethod
    def sign_payload(cls, stakeholder_id: str, payload: Dict[str, Any]) -> str:
        """
        Signs a dictionary payload using the stakeholder's ECDSA private key.
        Returns the hex signature.
        """
        _, private_key = cls.get_or_create_keys(stakeholder_id)
        serialized_data = json.dumps(payload, sort_keys=True).encode("utf-8")
        signature = private_key.sign(
            serialized_data,
            ec.ECDSA(hashes.SHA256())
        )
        return signature.hex()

    @classmethod
    def verify_signature(cls, public_key_hex: str, payload: Dict[str, Any], signature_hex: str) -> bool:
        """
        Verifies ECDSA signature against the provided public key hex and data payload.
        """
        try:
            public_bytes = bytes.fromhex(public_key_hex)
            public_key = ec.EllipticCurvePublicKey.from_encoded_point(ec.SECP256K1(), public_bytes)
            sig_bytes = bytes.fromhex(signature_hex)
            serialized_data = json.dumps(payload, sort_keys=True).encode("utf-8")

            public_key.verify(sig_bytes, serialized_data, ec.ECDSA(hashes.SHA256()))
            return True
        except Exception:
            return False

    @classmethod
    def get_consortium_directory(cls) -> Dict[str, Any]:
        """Returns directory of all registered consortium stakeholders and their public keys."""
        directory = {}
        for s_id, data in cls.STAKEHOLDERS.items():
            pub_hex, _ = cls.get_or_create_keys(s_id)
            directory[s_id] = {
                "name": data["name"],
                "role": data["role"],
                "public_key": pub_hex,
                "curve": "secp256k1",
                "algorithm": "ECDSA-SHA256"
            }
        return directory
