"""
organization_specific_model.py
Architecture & Integration Interface for the Organization-Specific Risk Model.

SIH 2026 Problem Statement 26105
Architecture:
  P1 + P2 + P3 + P4
          ↓
     Meta Model
          ↓
  Organization-Specific Risk Model
          ↓
         EAL
          ↓
  Investment Optimizer

STATUS: ARCHITECTURE & INTEGRATION FRAMEWORK (UNTRAINED - AWAITING META MODEL SCHEMA)
DO NOT invent P1-P4/Meta Model features. Fails clearly if integration contract is unfulfilled.
"""

import os
import sys
import json
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from enum import Enum


class IntegrationContractError(Exception):
    """Raised when required Meta Model schema or outputs are missing or unverified."""
    pass


@dataclass
class MetaModelResult:
    """
    Contract interface for the upstream Meta Model output.
    Awaiting real schema definition from the team member developing P1-P4 + Meta Model.
    """
    is_contract_fulfilled: bool = False
    meta_model_version: Optional[str] = None
    meta_score: Optional[float] = None  # e.g., exploitation probability or composite threat index
    raw_outputs: Dict[str, Any] = field(default_factory=dict)
    confidence: Optional[float] = None

    def __post_init__(self):
        if self.meta_score is None and "meta_risk" in self.raw_outputs:
            self.meta_score = float(self.raw_outputs["meta_risk"])

    def validate(self):
        if not self.is_contract_fulfilled:
            raise IntegrationContractError(
                "MetaModelResult contract is unfulfilled! "
                "The real P1-P4 and Meta Model schema have not been plugged in yet. "
                "See META_MODEL_INTEGRATION_CONTRACT.md to fulfill the schema."
            )
        if self.meta_score is None:
            raise IntegrationContractError("MetaModelResult.meta_score is required.")


@dataclass
class OrganizationProfile:
    """Organization-level demographics and high-level posture characteristics."""
    organization_id: str
    organization_name: str
    industry: str
    organization_size: str  # small, medium, large
    number_of_employees: int
    number_of_endpoints: int
    number_of_servers: int
    incident_history_count: int = 0
    posture_baseline_score: Optional[float] = None  # Optional output from models/organization-risk/


@dataclass
class Asset:
    """Internal asset inventory item with exposure and criticality."""
    asset_id: str
    asset_name: str
    technology: str
    criticality: float  # 1.0 to 10.0 scale
    exposure: str  # INTERNET_FACING, INTERNAL_PROTECTED, AIR_GAPPED_ISOLATED
    ip_address: Optional[str] = None
    owner: Optional[str] = None
    active_vulnerabilities: List[str] = field(default_factory=list)


@dataclass
class SecurityControl:
    """Implemented or proposed security control."""
    control_id: str
    name: str
    category: str
    is_active: bool
    effectiveness: float = 0.0  # 0.0 to 1.0


@dataclass
class BusinessContext:
    """Operational and business context influencing cyber risk."""
    regulatory_framework: str  # e.g., HIPAA, RBI-CSCF, DPDP-2023, ISO-27001
    annual_revenue_inr: float = 0.0
    downtime_cost_per_hour_inr: float = 0.0
    data_classification_tier: str = "CONFIDENTIAL"  # PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED


@dataclass
class FinancialImpact:
    """Financial parameters representing potential breach loss exposure."""
    single_loss_expectancy_inr: float  # SLE = Asset Value * Exposure Factor
    annualized_rate_of_occurrence: float  # ARO
    estimated_incident_cost_inr: float


@dataclass
class OrganizationRiskResult:
    """
    Final output contract of the Organization-Specific Risk Model.
    Feeds downstream into EAL quantification and the Investment Optimizer.
    """
    organization_id: str
    probability_of_event: float  # Estimated probability of breach event (0.0 to 1.0)
    financial_impact_inr: float  # Potential breach financial impact in INR
    expected_annual_loss_inr: float  # EAL = Probability * Financial Impact
    risk_level: str  # Low, Moderate, High, Critical
    model_confidence: float  # 0.0 to 1.0
    top_risk_drivers: List[str]
    integration_status: str
    meta_model_version_used: Optional[str] = None


class OrganizationSpecificRiskModel:
    """
    Organization-Specific Risk Model Adapter & Interface.
    
    This class is the architectural bridge between:
    - Upstream: Meta Model (P1-P4 synthesis) + Organization Assets + Business Context
    - Downstream: Expected Annual Loss (EAL) + Knapsack Investment Optimizer
    
    IMPORTANT:
    This model is currently staged as an interface. It will NOT fabricate
    predictions if the Meta Model contract is unfulfilled.
    """

    def __init__(self, allow_mock_contract: bool = False):
        self.allow_mock_contract = allow_mock_contract
        self.version = "0.1.0-STAGED_INTERFACE"
        self.is_trained = False  # Explicitly marked untrained until real dataset & Meta Model are available

    def assess_organization_specific_risk(
        self,
        meta_result: MetaModelResult,
        profile: OrganizationProfile,
        assets: List[Asset],
        controls: List[SecurityControl],
        business: BusinessContext,
        financial: FinancialImpact
    ) -> OrganizationRiskResult:
        """
        Calculates organization-specific risk combining the 11 required dimensions.
        Fails clearly if the MetaModelResult integration contract is invalid.
        """
        # Strict validation: Fail clearly if contract is unfulfilled and mock not explicitly permitted
        if not self.allow_mock_contract:
            meta_result.validate()  # Raises IntegrationContractError if unfulfilled or meta_score missing

        # Threat exploitation factor from Meta Model
        meta_factor = meta_result.meta_score if meta_result.meta_score is not None else 0.50

        # Asset criticality and exposure aggregation
        weighted_exposure_sum = 0.0
        total_criticality = 0.0
        exposure_weights = {
            "INTERNET_FACING": 1.0,
            "INTERNAL_PROTECTED": 0.35,
            "AIR_GAPPED_ISOLATED": 0.05
        }

        top_drivers = []
        for asset in assets:
            exp_mult = exposure_weights.get(asset.exposure, 0.35)
            weighted_exposure_sum += (asset.criticality / 10.0) * exp_mult
            total_criticality += asset.criticality

            if asset.exposure == "INTERNET_FACING" and asset.criticality >= 8.0:
                top_drivers.append(f"High-criticality external asset exposed: {asset.asset_name} [{asset.asset_id}]")
            if asset.active_vulnerabilities:
                top_drivers.append(f"Unpatched vulnerabilities on {asset.asset_id}: {', '.join(asset.active_vulnerabilities)}")

        avg_asset_exposure = (weighted_exposure_sum / max(1, len(assets)))

        # Controls mitigation factor
        active_controls = [c for c in controls if c.is_active]
        control_mitigation = sum([c.effectiveness for c in active_controls]) / max(1, len(controls)) if controls else 0.0

        # Posture baseline factor (optional from existing organization-risk model)
        posture_factor = (profile.posture_baseline_score / 100.0) if profile.posture_baseline_score is not None else 0.50

        # Composite Probability of Loss Event
        prob_event = float(min(0.99, max(0.01, (
            0.40 * meta_factor +
            0.30 * avg_asset_exposure +
            0.20 * posture_factor -
            0.10 * control_mitigation
        ))))

        # Financial Impact & EAL
        financial_impact = financial.single_loss_expectancy_inr
        eal = round(prob_event * financial_impact, 2)

        # Risk Level
        if prob_event < 0.25:
            level = "Low"
        elif prob_event < 0.50:
            level = "Moderate"
        elif prob_event < 0.75:
            level = "High"
        else:
            level = "Critical"

        confidence = 0.85 if meta_result.is_contract_fulfilled else 0.40

        if not top_drivers:
            top_drivers.append("Overall organizational control posture and threat environment.")

        return OrganizationRiskResult(
            organization_id=profile.organization_id,
            probability_of_event=round(prob_event, 4),
            financial_impact_inr=financial_impact,
            expected_annual_loss_inr=eal,
            risk_level=level,
            model_confidence=confidence,
            top_risk_drivers=top_drivers[:5],
            integration_status="MOCK_CONTRACT_MODE" if not meta_result.is_contract_fulfilled else "PRODUCTION_INTEGRATED",
            meta_model_version_used=meta_result.meta_model_version
        )
