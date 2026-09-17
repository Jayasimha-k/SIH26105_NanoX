"""
backend/app/threat_intelligence/validator.py
Threat validation against syntax standards and locally cached authoritative records.
Enforces provenance tracking without trusting arbitrary newsletter claims as ground truth.
"""

import os
import re
import json
from typing import Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.db_models import Vulnerability

CVE_STRICT_REGEX = re.compile(r"^CVE-\d{4}-\d{4,}$")
DEMO_THREAT_STRICT_REGEX = re.compile(r"^DEMO-THREAT-.*$")

class ThreatValidator:
    """
    Validates threat candidate syntax and cross-references locally cached authoritative records.
    """

    _cached_cves: Optional[set] = None

    @classmethod
    def load_authoritative_cache(cls) -> set:
        """
        Loads all CVEs from local authoritative JSON caches (data/threats/vulnerabilities.json & cisa_kev.json).
        """
        if cls._cached_cves is not None:
            return cls._cached_cves

        cve_set = set()
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

        # 1. Check data/threats/vulnerabilities.json
        vuln_json = os.path.join(repo_root, "data", "threats", "vulnerabilities.json")
        if not os.path.exists(vuln_json):
            vuln_json = os.path.join("data", "threats", "vulnerabilities.json")
        if os.path.exists(vuln_json):
            try:
                with open(vuln_json, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    items = data.get("vulnerabilities", data) if isinstance(data, dict) else data
                    for item in items:
                        cve = item.get("cve_id") or item.get("id") or item.get("cve")
                        if cve:
                            cve_set.add(cve.strip().upper())
            except Exception:
                pass

        # 2. Check data/threats/cisa_kev.json
        kev_json = os.path.join(repo_root, "data", "threats", "cisa_kev.json")
        if not os.path.exists(kev_json):
            kev_json = os.path.join("data", "threats", "cisa_kev.json")
        if os.path.exists(kev_json):
            try:
                with open(kev_json, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    items = data.get("vulnerabilities", data) if isinstance(data, dict) else data
                    for item in items:
                        cve = item.get("cveID") or item.get("cve_id") or item.get("cve")
                        if cve:
                            cve_set.add(cve.strip().upper())
            except Exception:
                pass

        cls._cached_cves = cve_set
        return cls._cached_cves

    @classmethod
    def validate_threat(cls, db: Session, enriched_item: Dict[str, Any]) -> Tuple[str, str]:
        """
        Evaluates syntax and authoritative grounding.
        Returns: (validation_status, rationale)
          - VALIDATED: Valid syntax and verified in local authoritative NVD/KEV database.
          - VALIDATED_DEMO: Explicit synthetic demonstration event with verified demo ID.
          - PENDING_VALIDATION: Syntactically valid CVE mentioned in external advisory, but pending authoritative CVSS/EPSS cache verification.
          - REJECTED: Invalid CVE syntax or lacking sufficient technical indicators.
        """
        cve = enriched_item.get("cve")
        is_demo = enriched_item.get("is_demo", False)
        demo_id = enriched_item.get("demo_id")

        # 1. Handle Demo Simulation Events
        if is_demo or (demo_id and DEMO_THREAT_STRICT_REGEX.match(demo_id)):
            return "VALIDATED_DEMO", "Explicit synthetic air-gapped demonstration threat verified."

        # 2. If CVE is present, validate format
        if cve:
            cve_clean = cve.strip().upper()
            if not CVE_STRICT_REGEX.match(cve_clean):
                return "REJECTED", f"Malformed CVE identifier format: '{cve}'."

            # Check database vulnerabilities table
            db_vuln = db.query(Vulnerability).filter(Vulnerability.cve_id == cve_clean).first()
            if db_vuln:
                return "VALIDATED", f"Verified against local authoritative vulnerability database (CVSS: {db_vuln.cvss_score}, EPSS: {db_vuln.epss_score})."

            # Check file cache
            authoritative_set = cls.load_authoritative_cache()
            if cve_clean in authoritative_set:
                return "VALIDATED", "Verified against locally cached CISA KEV / NVD registry."

            # If valid CVE format but not in local cache:
            return "PENDING_VALIDATION", f"Syntactically valid CVE ({cve_clean}), pending local NVD/EPSS authoritative ingestion."

        # 3. If no CVE, check if it is a general security advisory with actionable indicators
        title = enriched_item.get("title", "").strip()
        desc = enriched_item.get("description", "").strip()
        if len(title) > 10 and len(desc) > 20:
            return "PENDING_VALIDATION", "Uncataloged security bulletin without explicit CVE identifier; queued for secondary analysis."

        return "REJECTED", "Insufficient technical indicators or empty advisory content."
