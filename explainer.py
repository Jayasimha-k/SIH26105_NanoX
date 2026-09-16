"""
explainer.py
Deterministic Template-Based Natural Language Cyber Risk Explainer.

SIH 2026 Problem Statement 26105
Generates human-readable risk rationales and executive summaries without calling
any online LLM or cloud APIs (100% offline, deterministic, auditable).
"""

from typing import Dict, Any, List


class DeterministicRiskExplainer:
    @staticmethod
    def explain_threat_impact(
        threat_event: Dict[str, Any],
        correlated_assets: List[Dict[str, Any]],
        previous_risk: float,
        new_risk: float
    ) -> str:
        """Generates clear, deterministic rationale for why risk increased."""
        delta = round(new_risk - previous_risk, 1)
        tech = threat_event.get("affected_technology", "Target Technology")
        event_title = threat_event.get("title", "New Vulnerability")
        ref_cve = threat_event.get("reference_cve", "CVE")

        lines = [
            f"Risk increased from {previous_risk:.1f} to {new_risk:.1f} (+{delta:.1f} points).",
            "Root Cause Analysis:",
            f"1. Threat Detection: Active threat '{event_title}' ({ref_cve}) was detected in local threat repository.",
            f"2. Asset Exposure: Matched {len(correlated_assets)} internal asset(s) running {tech}."
        ]

        for asset in correlated_assets:
            exposure_desc = "Directly Internet-Facing (High Attack Vector)" if asset.get("exposure") == "INTERNET_FACING" else "Internal Network"
            lines.append(
                f"   - {asset.get('asset_name')} [{asset.get('asset_id')}]: Criticality {asset.get('criticality')}/10, Exposure: {exposure_desc}."
            )

        lines.append("3. Exploitation Window: Unpatched vulnerability allows potential pre-authentication remote compromise.")
        lines.append("Action Recommended: Immediate vulnerability remediation and network isolation.")
        return "\n".join(lines)

    @staticmethod
    def explain_remediation_impact(
        remediation_event: Dict[str, Any],
        target_asset: str,
        previous_risk: float,
        new_risk: float
    ) -> str:
        """Generates clear rationale for why risk decreased after remediation."""
        delta = round(previous_risk - new_risk, 1)
        controls = remediation_event.get("controls_applied", ["Security Patch"])

        lines = [
            f"Risk successfully reduced from {previous_risk:.1f} to {new_risk:.1f} (-{delta:.1f} points).",
            "Remediation Impact Analysis:",
            f"1. Target Asset: Remediation executed on {target_asset}.",
            f"2. Controls Implemented: {', '.join(controls)}.",
            "3. Attack Surface Reduction: Exploitation vector neutralized; remote code execution surface closed.",
            "4. Audit Verification: Action cryptographically committed to local blockchain."
        ]
        return "\n".join(lines)

    @staticmethod
    def explain_posture_baseline(
        risk_score: float,
        risk_level: str,
        category_scores: Dict[str, float]
    ) -> str:
        """Generates executive summary of initial organizational posture."""
        highest_cat = max(category_scores.items(), key=lambda x: x[1]) if category_scores else ("None", 0)
        lowest_cat = min(category_scores.items(), key=lambda x: x[1]) if category_scores else ("None", 0)

        lines = [
            f"Baseline Cybersecurity Posture Risk: {risk_score:.1f}/100 [{risk_level.upper()} RISK]",
            f"Primary Vulnerability Driver: '{highest_cat[0]}' with risk index of {highest_cat[1]:.1f}/100.",
            f"Strongest Control Area: '{lowest_cat[0]}' with low risk score of {lowest_cat[1]:.1f}/100.",
            "Summary: Organization posture exhibits resilient core identity measures but requires urgent improvements in automated patching and immutable offline backups."
        ]
        return "\n".join(lines)
