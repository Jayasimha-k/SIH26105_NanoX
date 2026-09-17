"""
backend/app/threat_intelligence/extractor.py
Entity extraction: CVE IDs, attack categories, affected products, and severity.
Strict adherence to truth: never invents CVSS or EPSS scores.
"""

import re
from typing import Dict, Any, List, Optional

CVE_REGEX = re.compile(r"\bCVE-\d{4}-\d{4,}\b", re.IGNORECASE)
DEMO_THREAT_REGEX = re.compile(r"\bDEMO-THREAT-[A-Za-z0-9-]+\b", re.IGNORECASE)

ATTACK_TYPE_KEYWORDS = {
    "RANSOMWARE": ["ransomware", "encryptor", "double extortion", "lockbit", "blackcat"],
    "EXPLOIT_PUBLIC_APP": ["remote code execution", "rce", "unauthenticated", "pre-auth", "public-facing", "buffer overflow"],
    "DDOS": ["denial of service", "ddos", "volumetric flood", "syn flood", "slowloris", "reflection attack"],
    "BRUTE_FORCE": ["brute force", "credential stuffing", "patator", "password spray"],
    "SQL_INJECTION": ["sql injection", "sqli", "database injection"],
    "PRIVILEGE_ESCALATION": ["privilege escalation", "privesc", "local privilege", "elevation of privilege"],
    "BOTNET": ["c2", "command and control", "botnet", "beaconing", "ares", "mirai"],
    "PORTSCAN": ["port scan", "reconnaissance", "probe", "network discovery"],
    "PHISHING": ["phishing", "spear phishing", "credential harvesting"]
}

PRODUCT_KEYWORDS = {
    "Microsoft Exchange": ["exchange server", "microsoft exchange", "proxylogon", "proxyshell"],
    "Linux Container Runtime / runc": ["runc", "container escape", "docker engine", "kubernetes"],
    "Apache HTTP Server": ["apache http", "apache server", "httpd"],
    "OpenSSL": ["openssl", "heartbleed", "libcrypto"],
    "Cisco IOS / XE": ["cisco ios", "cisco router", "cisco switch"],
    "Fortinet FortiOS": ["fortios", "fortigate", "fortinet"],
    "Ivanti Connect Secure": ["ivanti", "pulse secure", "connect secure"],
    "VMware vCenter / ESXi": ["vmware", "vcenter", "esxi"],
    "Palo Alto PAN-OS": ["palo alto", "pan-os", "globalprotect"]
}

class ThreatExtractor:
    """
    Extracts structured entities from parsed threat items.
    """

    @classmethod
    def extract_cve_ids(cls, text: str) -> List[str]:
        """
        Extracts all valid standard CVE identifiers and uppercase normalizes them.
        """
        if not text:
            return []
        matches = CVE_REGEX.findall(text)
        return sorted(list(set(m.upper() for m in matches)))

    @classmethod
    def extract_demo_threat_ids(cls, text: str) -> List[str]:
        """
        Extracts explicitly synthetic demo threat IDs.
        """
        if not text:
            return []
        matches = DEMO_THREAT_REGEX.findall(text)
        return sorted(list(set(m.upper() for m in matches)))

    @classmethod
    def infer_attack_type(cls, text: str, existing_type: Optional[str] = None) -> str:
        """
        Infers attack type from text keywords or returns existing type if present.
        """
        if existing_type and existing_type.strip():
            return existing_type.strip().upper()

        text_lower = text.lower() if text else ""
        for attack_cat, keywords in ATTACK_TYPE_KEYWORDS.items():
            for kw in keywords:
                if kw in text_lower:
                    return attack_cat
        return "GENERAL_SECURITY_ADVISORY"

    @classmethod
    def infer_affected_product(cls, text: str, existing_product: Optional[str] = None) -> Optional[str]:
        """
        Infers affected product/vendor from text keywords.
        """
        if existing_product and existing_product.strip():
            return existing_product.strip()

        text_lower = text.lower() if text else ""
        for prod_name, keywords in PRODUCT_KEYWORDS.items():
            for kw in keywords:
                if kw in text_lower:
                    return prod_name
        return None

    @classmethod
    def enrich_item(cls, raw_item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enriches a parsed item with extracted CVE, product, attack type, and demo markers.
        """
        content = raw_item.get("raw_content", "") or f"{raw_item.get('title', '')} {raw_item.get('description', '')}"

        cves = cls.extract_cve_ids(content)
        demo_ids = cls.extract_demo_threat_ids(content)

        event_id = raw_item.get("event_id")
        if event_id and event_id.upper().startswith("DEMO-THREAT"):
            demo_ids = [event_id.upper()]

        # Primary CVE selection
        primary_cve = raw_item.get("cve") or (cves[0] if cves else None)
        is_demo = bool(demo_ids or (primary_cve and primary_cve.startswith("DEMO-THREAT")) or (event_id and event_id.startswith("DEMO-THREAT")))

        attack_type = cls.infer_attack_type(content, raw_item.get("attack_type"))
        product = cls.infer_affected_product(content, raw_item.get("affected_product"))

        return {
            "title": raw_item.get("title", "Untitled Advisory"),
            "url": raw_item.get("url", ""),
            "description": raw_item.get("description", ""),
            "published_at": raw_item.get("published_at"),
            "source": raw_item.get("source", "Unknown"),
            "cve": primary_cve,
            "event_id": event_id,
            "all_extracted_cves": cves,
            "demo_id": demo_ids[0] if demo_ids else None,
            "is_demo": is_demo,
            "attack_type": attack_type,
            "affected_product": product
        }
