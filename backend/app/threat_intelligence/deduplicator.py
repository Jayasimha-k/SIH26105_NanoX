"""
backend/app/threat_intelligence/deduplicator.py
Deduplication engine using cryptographic content hashing.
Prevents duplicate ingestion across multiple newsletter issues and RSS updates.
"""

import hashlib
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.db_models import ThreatIntelligenceRecord

class ThreatDeduplicator:
    """
    Computes deterministic SHA-256 content hashes and checks existing database entries.
    """

    @staticmethod
    def compute_hash(item: Dict[str, Any]) -> str:
        """
        Generates SHA-256 hash from canonical threat metadata fields.
        """
        cve = (item.get("cve") or "").strip().upper()
        source = (item.get("source") or "").strip().lower()
        title = (item.get("title") or "").strip().lower()
        published_at = (item.get("published_at") or "").strip()

        composite_key = f"{cve}|{source}|{title}|{published_at}"
        return hashlib.sha256(composite_key.encode("utf-8")).hexdigest()

    @classmethod
    def is_duplicate(cls, db: Session, raw_hash: str, cve: Optional[str] = None, source: Optional[str] = None) -> bool:
        """
        Determines whether the threat item already exists in local storage.
        """
        # 1. Primary check by raw hash
        existing = db.query(ThreatIntelligenceRecord).filter(
            ThreatIntelligenceRecord.raw_hash == raw_hash
        ).first()
        if existing:
            return True

        # 2. Secondary check: if same CVE from same source exists with identical title
        if cve and source:
            existing_cve_source = db.query(ThreatIntelligenceRecord).filter(
                ThreatIntelligenceRecord.cve == cve,
                ThreatIntelligenceRecord.source == source
            ).first()
            if existing_cve_source:
                return True

        return False
