"""
backend/app/intelligence/normalizer.py
Content normalization, text sanitization, and entity cleanup.
"""

import re
from typing import Dict, Any


class ContentNormalizer:
    """
    Sanitizes raw text, strips email disclaimers, and canonicalizes entity names.
    """

    @staticmethod
    def normalize_text(text: str) -> str:
        """Removes email disclaimer noise and normalizes whitespace."""
        if not text:
            return ""

        # Remove common unsubscribe and legal disclaimers
        disclaimer_patterns = [
            r"You are receiving this email because.*",
            r"To unsubscribe or update your preferences.*",
            r"Copyright © \d{4}.*All rights reserved\.",
            r"Sent by .* in partnership with .*",
            r"View in browser.*"
        ]
        cleaned = text
        for pat in disclaimer_patterns:
            cleaned = re.sub(pat, "", cleaned, flags=re.IGNORECASE)

        # Standardize multiple newlines and spaces
        cleaned = re.sub(r'[ \t]+', ' ', cleaned)
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
        return cleaned.strip()

    @staticmethod
    def normalize_vendor(vendor_raw: str) -> str:
        """Canonicalizes vendor name."""
        v = (vendor_raw or "").strip().lower()
        if "apache" in v:
            return "Apache Software Foundation"
        if "open container" in v or "runc" in v or "oci" in v:
            return "Open Containers Initiative"
        if "ivanti" in v:
            return "Ivanti"
        if "amazon" in v or "aws" in v:
            return "Amazon Web Services"
        if "microsoft" in v or "azure" in v:
            return "Microsoft"
        return vendor_raw.strip() if vendor_raw else "UNKNOWN"
