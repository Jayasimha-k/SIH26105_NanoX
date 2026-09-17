"""
backend/app/intelligence/deduplicator.py
SHA-256 Fingerprinting and Deduplication Engine for Ingested Emails and Evidence.
"""

import hashlib
import re
from typing import Dict, Any


class EmailDeduplicator:
    """
    Computes deterministic SHA-256 fingerprints for emails and checks for duplicates.
    """

    @staticmethod
    def compute_content_hash(sender: str, subject: str, body_text: str) -> str:
        """
        Computes SHA-256 hash based on normalized sender, subject, and body text.
        Whitespace and casing are normalized to detect semantic duplicates.
        """
        norm_sender = sender.strip().lower()
        norm_subject = subject.strip().lower()
        # Normalize whitespace in body
        norm_body = re.sub(r'\s+', ' ', body_text.strip().lower())

        content_str = f"SENDER:{norm_sender}|SUBJ:{norm_subject}|BODY:{norm_body}"
        return hashlib.sha256(content_str.encode("utf-8")).hexdigest()

    @staticmethod
    def is_duplicate(db, content_hash: str) -> bool:
        """Checks if an email with this content hash has already been stored."""
        from app.models.db_models import EmailMessageRecord
        existing = db.query(EmailMessageRecord).filter(EmailMessageRecord.content_hash == content_hash).first()
        return existing is not None
