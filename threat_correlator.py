"""
threat_correlator.py
Threat-to-Asset Correlation Engine for Air-Gapped Cybersecurity Risk Quantification.

Correlates incoming local/simulated threat intelligence records against the
organization's real internal asset inventory.

Key Logic:
1. Extract threat affected technology.
2. Query organization asset inventory for matching technology stacks.
3. If no match -> Risk delta is 0.0 (No organization-specific impact).
4. If match -> Perform exposure analysis (Internet-Facing vs Internal),
   criticality weighting, and weaponization scoring to calculate risk increase.
"""

import os
import sys
import json
import sqlite3
from typing import Dict, Any, List, Optional

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from database.db_manager import get_connection, DB_PATH


class ThreatAssetCorrelator:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self.exposure_multipliers = {
            "INTERNET_FACING": 1.0,
            "INTERNAL_PROTECTED": 0.35,
            "AIR_GAPPED_ISOLATED": 0.05
        }

    def correlate_threat(
        self,
        threat: Dict[str, Any],
        organization_id: str = "ORG-HOSP-A"
    ) -> Dict[str, Any]:
        """
        Performs correlation between an incoming threat event and the organization's assets.
        """
        threat_tech = threat.get("affected_technology", "").strip().lower()
        cvss = float(threat.get("cvss_score", 7.5))
        epss = float(threat.get("epss_score", 0.5))
        cisa_kev = bool(threat.get("cisa_kev", False))
        ref_cve = threat.get("reference_cve", "CVE-UNKNOWN")
        event_id = threat.get("event_id", "EVT-LOCAL")

        # 1. Fetch organization assets from local database
        conn = get_connection(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT asset_id, asset_name, technology, asset_type, criticality, exposure, ip_address "
            "FROM assets WHERE organization_id = ?",
            (organization_id,)
        )
        assets = [dict(row) for row in cursor.fetchall()]

        # 2. Check for matching assets
        matched_assets = []
        for asset in assets:
            asset_tech = asset["technology"].strip().lower()
            # Direct or substring match
            if threat_tech in asset_tech or asset_tech in threat_tech:
                matched_assets.append(asset)

        # Case A: No matching assets in organization inventory
        if not matched_assets:
            conn.close()
            return {
                "matched": False,
                "organization_id": organization_id,
                "threat_event_id": event_id,
                "threat_technology": threat.get("affected_technology", ""),
                "correlated_assets_count": 0,
                "correlated_assets": [],
                "risk_delta": 0.0,
                "correlation_status": "NO_RELEVANT_ASSETS",
                "message": (
                    f"Threat targeting '{threat.get('affected_technology')}' does not match "
                    f"any active systems in organization asset inventory. Zero posture risk increase."
                )
            }

        # Case B: Matching assets found -> calculate exposure-weighted risk impact
        correlated_details = []
        total_risk_delta = 0.0

        for asset in matched_assets:
            crit = float(asset["criticality"])  # 1.0 to 10.0
            exposure = asset["exposure"]
            exp_mult = self.exposure_multipliers.get(exposure, 0.35)

            # Severity weaponization index
            kev_factor = 1.25 if cisa_kev else 1.0
            # Asset individual risk delta: (CVSS / 10) * (0.6 + 0.4 * EPSS) * Crit * Exposure * KEV
            asset_delta = round((cvss / 10.0) * (0.5 + 0.5 * epss) * (crit / 10.0) * exp_mult * kev_factor * 12.0, 2)
            total_risk_delta += asset_delta

            correlated_details.append({
                "asset_id": asset["asset_id"],
                "asset_name": asset["asset_name"],
                "technology": asset["technology"],
                "criticality": crit,
                "exposure": exposure,
                "exposure_multiplier": exp_mult,
                "asset_risk_delta": asset_delta
            })

            # Record into asset_vulnerabilities correlation table
            cursor.execute("""
                INSERT INTO asset_vulnerabilities (asset_id, cve_id, detected_at, correlation_status, asset_risk_score)
                VALUES (?, ?, datetime('now'), 'ACTIVE', ?)
            """, (asset["asset_id"], ref_cve, asset_delta))

        # Cap single event risk surge reasonably
        capped_risk_delta = round(min(25.0, total_risk_delta), 1)

        conn.commit()
        conn.close()

        return {
            "matched": True,
            "organization_id": organization_id,
            "threat_event_id": event_id,
            "threat_technology": threat.get("affected_technology", ""),
            "correlated_assets_count": len(matched_assets),
            "correlated_assets": correlated_details,
            "raw_risk_delta": round(total_risk_delta, 2),
            "risk_delta": capped_risk_delta,
            "correlation_status": "ASSET_MATCH_CONFIRMED",
            "message": (
                f"Threat targeting '{threat.get('affected_technology')}' matched {len(matched_assets)} "
                f"organization asset(s). Internet exposure and criticality drive a dynamic risk surge of +{capped_risk_delta} points."
            )
        }
