import os
import logging
import numpy as np
import joblib
from typing import Dict, Any, List, Optional
from app.ml.adapter import BaseModelAdapter
from app.ml.conflict_detector import EvidenceConflictDetector
from app.ml.calibrator import PlattCalibrator

logger = logging.getLogger(__name__)

class IndividualRiskModels:
    @staticmethod
    def model_1_nvd_cvss_cwe(cvss_score: Optional[float], cwe_id: Optional[str]) -> float:
        """
        Model 1 (P1): NVD / CVSS / CWE Base Severity Model.
        Maps CVSS v3.1 score (0-10) and CWE vulnerability class to normalized severity index.
        """
        cvss = 5.0 if cvss_score is None else float(cvss_score)
        cwe = str(cwe_id or "").strip()
        base_p1 = min(1.0, max(0.0, cvss / 10.0))
        # High impact CWE weight adjustments (e.g. CWE-787, CWE-89, CWE-78, CWE-94)
        cwe_multiplier = 1.15 if cwe in ["CWE-787", "CWE-89", "CWE-78", "CWE-94"] else 1.0
        return round(min(1.0, base_p1 * cwe_multiplier), 4)

    @staticmethod
    def model_2_epss(epss_score: Optional[float]) -> float:
        """
        Model 2 (P2): FIRST EPSS (Exploit Prediction Scoring System) Model.
        Returns the raw probability of active exploitation in the wild (0.0 to 1.0).
        """
        epss = 0.05 if epss_score is None else float(epss_score)
        return round(min(1.0, max(0.0, epss)), 4)

    @staticmethod
    def model_3_cisa_kev(is_cisa_kev: Optional[bool]) -> float:
        """
        Model 3 (P3): CISA Known Exploited Vulnerabilities (KEV) Model.
        Returns high confidence score (0.95) if actively exploited according to CISA, 0.20 otherwise.
        """
        return 0.95 if bool(is_cisa_kev) else 0.20

    @staticmethod
    def model_4_mitre_attack(technique_id: Optional[str]) -> float:
        """
        Model 4 (P4): MITRE ATT&CK Technique Severity Model.
        Quantifies attack technique severity:
        - Critical Initial Access / Remote Code Execution: 0.75 - 0.90
        - Execution, Persistence & Privilege Escalation: 0.40 - 0.65
        - Discovery, Collection & Reconnaissance: 0.10 - 0.25
        - Default / Unknown / Non-weaponized technique: 0.15
        """
        if not technique_id:
            return 0.15
        tid = str(technique_id).strip().upper()
        technique_weights = {
            # Critical Initial Access & Remote Exploitation (Tier 1)
            "T1190": 0.90,  # Exploit Public-Facing Application
            "T1210": 0.88,  # Exploitation of Remote Services
            "T1068": 0.82,  # Exploitation for Privilege Escalation
            "T1566": 0.78,  # Phishing
            "T1200": 0.75,  # Hardware Additions
            # Execution & Lateral Movement (Tier 2)
            "T1059": 0.65,  # Command and Scripting Interpreter
            "T1078": 0.55,  # Valid Accounts
            "T1053": 0.50,  # Scheduled Task/Job
            "T1021": 0.60,  # Remote Services (RDP/SSH)
            "T1555": 0.45,  # Credentials from Password Stores
            # Discovery, Reconnaissance & Passive Collection (Tier 3)
            "T1082": 0.18,  # System Information Discovery
            "T1083": 0.15,  # File and Directory Discovery
            "T1018": 0.20,  # Remote System Discovery
            "T1046": 0.22,  # Network Service Discovery
            "T1005": 0.25,  # Data from Local System
            "T1016": 0.12,  # System Network Configuration Discovery
            "T1033": 0.10,  # System Owner/User Discovery
        }
        return technique_weights.get(tid, 0.15)

class MetaModelEnsemble:
    _adapter: Optional[BaseModelAdapter] = None
    _calibrator: Optional[PlattCalibrator] = None

    @classmethod
    def get_adapter(cls) -> BaseModelAdapter:
        if cls._adapter is None:
            models_root = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                "models_artifacts"
            )
            meta_dir = os.path.join(models_root, "meta_model")
            cls._adapter = BaseModelAdapter(meta_dir)
        return cls._adapter

    @classmethod
    def get_calibrator(cls) -> PlattCalibrator:
        if cls._calibrator is None:
            models_root = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                "models_artifacts"
            )
            calibrator_path = os.path.join(models_root, "calibrator", "calibrator.joblib")
            if os.path.exists(calibrator_path):
                try:
                    cls._calibrator = joblib.load(calibrator_path)
                    logger.info("Loaded probability calibrator artifact.")
                except Exception as e:
                    logger.error(f"Failed to load calibrator from {calibrator_path}: {e}")
                    cls._calibrator = PlattCalibrator()
            else:
                cls._calibrator = PlattCalibrator()
        return cls._calibrator

    @classmethod
    def predict_meta(
        cls,
        p1: float,
        p2: float,
        p3: float,
        p4: float,
        asset_criticality: float = 5.0,
        exposure_level: str = "INTERNAL",
        incident_count: int = 0
    ) -> Dict[str, Any]:
        """
        Executes evidence -> conflict -> meta-model -> calibration pipeline:
        Features -> Meta-Model -> raw_probability -> PlattCalibrator -> calibrated_probability
        """
        exp_level = str(exposure_level or "INTERNAL").strip().upper()
        crit = 5.0 if asset_criticality is None else float(asset_criticality)
        inc_count = 0 if incident_count is None else int(incident_count)

        conflict_analysis = EvidenceConflictDetector.evaluate(
            p1=p1,
            p2=p2,
            p3=p3,
            p4=p4,
            exposure_level=exp_level
        )

        feature_vector = {
            "p1": p1,
            "p2": p2,
            "p3": p3,
            "p4": p4,
            "asset_criticality": crit,
            "exposure_level": exp_level,
            "incident_count": inc_count,
            "severity_exploitation_conflict": 1.0 if conflict_analysis["severity_exploitation_conflict"] else 0.0,
            "kev_epss_conflict": 1.0 if conflict_analysis["kev_epss_conflict"] else 0.0,
            "threat_asset_exposure_conflict": 1.0 if conflict_analysis["threat_asset_exposure_conflict"] else 0.0,
            "spread": conflict_analysis["spread"],
            "std": conflict_analysis["std"]
        }

        adapter = cls.get_adapter()
        raw_meta_prob = round(float(adapter.predict(feature_vector)), 4)

        calibrator = cls.get_calibrator()
        calibrated_prob = round(float(calibrator.calibrate(np.array([raw_meta_prob]))[0]), 4)

        return {
            "raw_probability": raw_meta_prob,
            "calibrated_probability": calibrated_prob,
            "meta_probability": calibrated_prob,
            "conflict_analysis": conflict_analysis
        }

    @classmethod
    def combine_predictions(
        cls,
        p1: float,
        p2: float,
        p3: float,
        p4: float,
        asset_criticality: float = 5.0,
        exposure_level: str = "INTERNAL",
        incident_count: int = 0
    ) -> float:
        """
        Backwards-compatible wrapper returning calibrated probability.
        """
        res = cls.predict_meta(
            p1=p1,
            p2=p2,
            p3=p3,
            p4=p4,
            asset_criticality=asset_criticality,
            exposure_level=exposure_level,
            incident_count=incident_count
        )
        return res["calibrated_probability"]

class OrganizationSpecificRiskModel:
    @staticmethod
    def adapt_to_organization(
        meta_prob: float,
        asset_criticality: float = 5.0,
        exposure_level: str = "INTERNAL",
        incident_count: int = 0
    ) -> float:
        """
        Organization context (asset criticality, exposure level, incident count)
        is natively learned by the tabular meta-model, replacing post-hoc heuristics.
        """
        return round(min(1.0, max(0.0, meta_prob)), 4)

class FullAIRiskPipeline:
    @classmethod
    def run_pipeline(
        cls,
        cvss_score: Optional[float] = 5.0,
        cwe_id: Optional[str] = "UNKNOWN",
        epss_score: Optional[float] = 0.05,
        is_cisa_kev: Optional[bool] = False,
        mitre_technique: Optional[str] = "T1190",
        asset_criticality: Optional[float] = 5.0,
        exposure_level: Optional[str] = "INTERNAL",
        incident_count: Optional[int] = 0
    ) -> Dict[str, Any]:
        """
        Executes full AI prediction workflow:
        Uses the 5 trained production XGBoost models with conflict analysis and calibrated organization adaptation.
        """
        try:
            from app.ml.production_loader import production_ml_engine
            vuln_dict = {
                "cvss_score": cvss_score,
                "cwe_id": cwe_id,
                "epss_score": epss_score,
                "cisa_kev": is_cisa_kev,
                "mitre_attack_technique": mitre_technique,
                "exploitability_score": min(3.9, (cvss_score or 5.0) * 0.35),
                "impact_score": min(6.0, (cvss_score or 5.0) * 0.65),
                "attack_vector": "NETWORK" if (cvss_score or 5.0) >= 7.0 else "LOCAL",
                "complexity": "LOW",
                "privileges_required": "NONE" if (cvss_score or 5.0) >= 8.0 else "LOW"
            }
            asset_dict = {
                "criticality_score": asset_criticality,
                "exposure_level": exposure_level
            }
            res = production_ml_engine.predict_all(vuln_dict, asset_dict, incident_count)
            p1 = res["p1_nvd"]
            p2 = res["p2_epss"]
            p3 = res["p3_org_risk"]
            p4 = res["p4_mitre_attack"]
            
            p1_sev = IndividualRiskModels.model_1_nvd_cvss_cwe(cvss_score, cwe_id) if cvss_score is not None else p1
            p2_epss = IndividualRiskModels.model_2_epss(epss_score) if epss_score is not None else p2
            p3_kev = IndividualRiskModels.model_3_cisa_kev(is_cisa_kev) if is_cisa_kev is not None else p3
            p4_att = IndividualRiskModels.model_4_mitre_attack(mitre_technique) if mitre_technique is not None else p4
            
            conflict_info = EvidenceConflictDetector.evaluate(
                p1=p1_sev,
                p2=p2_epss,
                p3=p3_kev,
                p4=p4_att,
                exposure_level=exposure_level or "INTERNAL"
            )

            return {
                "p1_nvd": res["p1_nvd"],
                "p1_class": res.get("p1_class", 1 if p1 >= 0.5 else 0),
                "p2_epss": res["p2_epss"],
                "p2_class": res.get("p2_class", 1 if p2 >= 0.5 else 0),
                "p3_cisa_kev": res["p3_org_risk"],
                "p3_class": res.get("p3_class", 1 if p3 >= 0.5 else 0),
                "p4_mitre_attack": res["p4_mitre_attack"],
                "p4_class": res.get("p4_class", 1 if p4 >= 0.5 else 0),
                "raw_probability": res["meta_exploitation_probability"],
                "calibrated_probability": res["organization_adapted_probability"],
                "meta_exploitation_probability": res["meta_exploitation_probability"],
                "organization_adapted_probability": res["organization_adapted_probability"],
                "meta_prediction_class": res.get("meta_prediction_class", 1 if res["meta_exploitation_probability"] >= 0.5 else 0),
                "conflict_information": conflict_info,
                "models_used": res.get("models_used", []),
                "architecture": res.get("architecture", "")
            }
        except Exception as e:
            logger.warning(f"Falling back to analytical models due to: {e}")
            p1 = IndividualRiskModels.model_1_nvd_cvss_cwe(cvss_score, cwe_id)
            p2 = IndividualRiskModels.model_2_epss(epss_score)
            p3 = IndividualRiskModels.model_3_cisa_kev(is_cisa_kev)
            p4 = IndividualRiskModels.model_4_mitre_attack(mitre_technique)

            meta_result = MetaModelEnsemble.predict_meta(
                p1=p1,
                p2=p2,
                p3=p3,
                p4=p4,
                asset_criticality=asset_criticality if asset_criticality is not None else 5.0,
                exposure_level=exposure_level or "INTERNAL",
                incident_count=incident_count if incident_count is not None else 0
            )
            raw_p = meta_result["raw_probability"]
            calibrated_p = meta_result["calibrated_probability"]

            return {
                "p1_nvd": p1,
                "p1_class": 1 if p1 >= 0.5 else 0,
                "p2_epss": p2,
                "p2_class": 1 if p2 >= 0.5 else 0,
                "p3_cisa_kev": p3,
                "p3_class": 1 if p3 >= 0.5 else 0,
                "p4_mitre_attack": p4,
                "p4_class": 1 if p4 >= 0.5 else 0,
                "raw_probability": raw_p,
                "calibrated_probability": calibrated_p,
                "meta_exploitation_probability": raw_p,
                "organization_adapted_probability": calibrated_p,
                "meta_prediction_class": 1 if raw_p >= 0.5 else 0,
                "conflict_information": meta_result.get("conflict_analysis"),
                "models_used": ["Analytical Model 1", "Analytical Model 2", "Analytical Model 3", "Analytical Model 4", "Meta Ensemble"],
                "architecture": "Analytical P1-P4 -> Meta Weighted Ensemble -> Calibrated Adaptation"
            }
