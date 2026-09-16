import logging
import numpy as np
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Union

logger = logging.getLogger(__name__)

class EvidenceConflictDetector:
    """
    Logical Evidence-Conflict Layer for CyberOpt-RQ.
    
    Identifies meaningful disagreement and divergence across sub-model signals (P1-P4)
    and organizational context without modifying the underlying probability calculations.
    """

    # --- Documented Threshold Rationales ---
    # 1. Technical Severity (P1) vs Exploitation Likelihood (P2):
    #    - High Technical Severity: P1 >= 0.70 (Equivalent to CVSS >= 7.0 High/Critical)
    #    - Low Exploitation Likelihood: P2 <= 0.20 (EPSS <= 20% empirical wild exploitation probability)
    #    - Low Technical Severity: P1 <= 0.40 (CVSS <= 4.0 Low severity)
    #    - High Exploitation Likelihood: P2 >= 0.60 (EPSS >= 60% active wild exploitation probability)
    P1_HIGH_THRESH = 0.70
    P2_LOW_THRESH = 0.20
    P1_LOW_THRESH = 0.40
    P2_HIGH_THRESH = 0.60

    # 2. Confirmed Threat Evidence (P3) vs EPSS (P2):
    #    - Confirmed KEV Active Threat: P3 >= 0.80 (CISA KEV catalog confirmed active weaponization)
    #    - Disagreeing EPSS: P2 <= 0.20 (Model lags or underestimates known weaponized CVEs)
    #    - Unconfirmed KEV (P3 <= 0.30) with High Statistical Likelihood (P2 >= 0.80)
    P3_CONFIRMED_THRESH = 0.80
    P3_UNCONFIRMED_THRESH = 0.30
    P2_VERY_HIGH_THRESH = 0.80

    # 3. Threat Evidence vs Asset Exposure:
    #    - High Threat Signal: max(P2, P3) >= 0.70
    #    - Contradicting Asset Exposure: exposure_level == 'ISOLATED' (air-gapped / unreachable from threat vector)
    THREAT_HIGH_THRESH = 0.70

    # 4. Evidence Freshness Thresholds (days):
    FRESHNESS_CURRENT_DAYS = 90
    FRESHNESS_STALE_DAYS = 365

    @classmethod
    def evaluate(
        cls,
        p1: float,
        p2: float,
        p3: float,
        p4: float,
        exposure_level: Optional[str] = "INTERNAL",
        evidence_timestamps: Optional[List[Union[str, datetime]]] = None,
        reference_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Evaluates evidence conflict, numerical spread, standard deviation, and freshness.
        
        Returns a dictionary containing ONLY explanatory metrics and conflict flags.
        Does NOT modify or scale probabilities.
        """
        signals = [float(p1), float(p2), float(p3), float(p4)]

        # --- 1. Numerical Disagreement Features ---
        spread = round(float(max(signals) - min(signals)), 4)
        std = round(float(np.std(signals)), 4)

        conflict_reasons: List[str] = []

        # --- 2. Check: Severity vs Exploitation Conflict ---
        severity_exploitation_conflict = False
        if p1 >= cls.P1_HIGH_THRESH and p2 <= cls.P2_LOW_THRESH:
            severity_exploitation_conflict = True
            conflict_reasons.append(
                f"High technical severity (P1={p1:.2f}) but low active exploitation likelihood (P2={p2:.2f})."
            )
        elif p1 <= cls.P1_LOW_THRESH and p2 >= cls.P2_HIGH_THRESH:
            severity_exploitation_conflict = True
            conflict_reasons.append(
                f"Low technical severity (P1={p1:.2f}) but high active exploitation likelihood (P2={p2:.2f})."
            )

        # --- 3. Check: KEV vs EPSS Conflict ---
        kev_epss_conflict = False
        if p3 >= cls.P3_CONFIRMED_THRESH and p2 <= cls.P2_LOW_THRESH:
            kev_epss_conflict = True
            conflict_reasons.append(
                f"Confirmed active KEV weaponization (P3={p3:.2f}) contradicts low statistical EPSS (P2={p2:.2f})."
            )
        elif p3 <= cls.P3_UNCONFIRMED_THRESH and p2 >= cls.P2_VERY_HIGH_THRESH:
            kev_epss_conflict = True
            conflict_reasons.append(
                f"High statistical EPSS (P2={p2:.2f}) without verified CISA KEV presence (P3={p3:.2f})."
            )

        # --- 4. Check: Threat Evidence vs Asset Exposure Conflict ---
        threat_asset_exposure_conflict = False
        exposure_normalized = str(exposure_level or "").strip().upper()
        threat_level = max(p2, p3)

        if threat_level >= cls.THREAT_HIGH_THRESH and exposure_normalized == "ISOLATED":
            threat_asset_exposure_conflict = True
            conflict_reasons.append(
                f"High threat activity (max(P2,P3)={threat_level:.2f}) targeting isolated/air-gapped asset."
            )

        # --- 5. Evidence Freshness Analysis ---
        evidence_freshness = cls._evaluate_freshness(evidence_timestamps, reference_date)

        has_conflict = bool(
            severity_exploitation_conflict
            or kev_epss_conflict
            or threat_asset_exposure_conflict
        )

        return {
            "spread": spread,
            "std": std,
            "severity_exploitation_conflict": severity_exploitation_conflict,
            "kev_epss_conflict": kev_epss_conflict,
            "threat_asset_exposure_conflict": threat_asset_exposure_conflict,
            "evidence_freshness": evidence_freshness,
            "has_conflict": has_conflict,
            "conflict_reasons": conflict_reasons
        }

    @classmethod
    def _evaluate_freshness(
        cls,
        timestamps: Optional[List[Union[str, datetime]]],
        reference_date: Optional[datetime] = None
    ) -> str:
        """
        Evaluates freshness of provided timestamps without inventing missing dates.
        Returns: 'CURRENT', 'MIXED', 'STALE', or 'UNKNOWN'.
        """
        if not timestamps:
            return "UNKNOWN"

        ref_dt = reference_date or datetime.now(timezone.utc)
        if ref_dt.tzinfo is None:
            ref_dt = ref_dt.replace(tzinfo=timezone.utc)

        parsed_ages_days = []
        for ts in timestamps:
            if not ts:
                continue
            if isinstance(ts, datetime):
                dt = ts
            elif isinstance(ts, str):
                try:
                    # Support ISO format YYYY-MM-DD or full ISO 8601
                    clean_ts = ts.replace("Z", "+00:00")
                    if len(clean_ts) == 10:  # YYYY-MM-DD
                        dt = datetime.strptime(clean_ts, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                    else:
                        dt = datetime.fromisoformat(clean_ts)
                except Exception:
                    continue
            else:
                continue

            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)

            age_days = max(0, (ref_dt - dt).total_seconds() / 86400.0)
            parsed_ages_days.append(age_days)

        if not parsed_ages_days:
            return "UNKNOWN"

        all_current = all(age <= cls.FRESHNESS_CURRENT_DAYS for age in parsed_ages_days)
        all_stale = all(age > cls.FRESHNESS_STALE_DAYS for age in parsed_ages_days)

        if all_current:
            return "CURRENT"
        if all_stale:
            return "STALE"
        return "MIXED"
