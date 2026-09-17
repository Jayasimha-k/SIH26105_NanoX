"""
backend/app/intelligence/source_detector.py
Identifies the newsletter publisher, domain, and authority classification from email headers and content.
"""

import json
import os
import re
import fnmatch
from typing import Dict, Any, List, Optional

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
CONFIG_PATH = os.path.join(REPO_ROOT, "config", "intelligence_sources.json")


class SourceDetector:
    """
    Matches incoming email sender, subject, and body against registered sources.
    """

    _cached_sources: Optional[List[Dict[str, Any]]] = None

    @classmethod
    def load_sources(cls) -> List[Dict[str, Any]]:
        if cls._cached_sources is not None:
            return cls._cached_sources

        if os.path.exists(CONFIG_PATH):
            try:
                with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    cls._cached_sources = data.get("sources", [])
                    return cls._cached_sources
            except Exception:
                pass

        # Fallback default sources
        cls._cached_sources = [
            {
                "source_id": "sans_at_risk",
                "source_name": "SANS @RISK",
                "category": "CYBERSECURITY",
                "email_patterns": ["*@sans.org", "*at-risk*@sans.org"],
                "trust_level": "HIGH"
            },
            {
                "source_id": "sans_newsbites",
                "source_name": "SANS NewsBites",
                "category": "CYBERSECURITY",
                "email_patterns": ["*newsbites*@sans.org", "*@sans.org"],
                "trust_level": "HIGH"
            },
            {
                "source_id": "cisa_alerts",
                "source_name": "CISA Cybersecurity Advisories",
                "category": "CYBERSECURITY",
                "email_patterns": ["*@cisa.gov", "*@cisa.dhs.gov"],
                "trust_level": "AUTHORITATIVE"
            },
            {
                "source_id": "morning_brew",
                "source_name": "Morning Brew Financial",
                "category": "FINANCIAL",
                "email_patterns": ["*@morningbrew.com"],
                "trust_level": "HIGH"
            },
            {
                "source_id": "ft_firstft",
                "source_name": "Financial Times FirstFT",
                "category": "FINANCIAL",
                "email_patterns": ["*@ft.com"],
                "trust_level": "AUTHORITATIVE"
            }
        ]
        return cls._cached_sources

    @classmethod
    def detect_source(cls, sender: str, subject: str = "", body_text: str = "") -> Dict[str, Any]:
        """
        Detects publisher source from sender email pattern or content indicators.
        """
        sources = cls.load_sources()
        sender_lower = sender.strip().lower()

        # 1. Check sender against glob patterns
        for src in sources:
            patterns = src.get("email_patterns", [])
            for pat in patterns:
                if fnmatch.fnmatch(sender_lower, pat.lower()) or pat.replace("*", "").lower() in sender_lower:
                    return {
                        "source_id": src["source_id"],
                        "source_name": src["source_name"],
                        "category": src.get("category", "CYBERSECURITY"),
                        "trust_level": src.get("trust_level", "HIGH"),
                        "detected_by": "SENDER_MATCH"
                    }

        # 2. Check subject / content indicators
        combined = (subject + " " + body_text[:500]).lower()
        if "sans @risk" in combined or "@risk" in combined:
            return {
                "source_id": "sans_at_risk",
                "source_name": "SANS @RISK",
                "category": "CYBERSECURITY",
                "trust_level": "HIGH",
                "detected_by": "CONTENT_HEURISTIC"
            }
        if "sans newsbites" in combined or "newsbites" in combined:
            return {
                "source_id": "sans_newsbites",
                "source_name": "SANS NewsBites",
                "category": "CYBERSECURITY",
                "trust_level": "HIGH",
                "detected_by": "CONTENT_HEURISTIC"
            }
        if "cisa" in combined and ("advisory" in combined or "alert" in combined):
            return {
                "source_id": "cisa_alerts",
                "source_name": "CISA Cybersecurity Advisories",
                "category": "CYBERSECURITY",
                "trust_level": "AUTHORITATIVE",
                "detected_by": "CONTENT_HEURISTIC"
            }
        if "morning brew" in combined:
            return {
                "source_id": "morning_brew",
                "source_name": "Morning Brew Financial",
                "category": "FINANCIAL",
                "trust_level": "HIGH",
                "detected_by": "CONTENT_HEURISTIC"
            }

        # Default unknown source
        return {
            "source_id": "unknown_newsletter",
            "source_name": "Unknown Newsletter Source",
            "category": "CYBERSECURITY",
            "trust_level": "LOW",
            "detected_by": "DEFAULT_FALLBACK"
        }
