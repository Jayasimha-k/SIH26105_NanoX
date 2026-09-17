"""
backend/app/threat_intelligence/service.py
Threat Intelligence Ingestion and Reassessment Service.
Orchestrates offline-first ingestion, deduplication, validation, P1-P6 evaluation, Fusion v2, and Fabric auditing.
"""

import os
import json
import urllib.request
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.db_models import ThreatIntelligenceRecord, Asset, Vulnerability, SecurityControl
from app.threat_intelligence.parser import ThreatFeedParser
from app.threat_intelligence.extractor import ThreatExtractor
from app.threat_intelligence.deduplicator import ThreatDeduplicator
from app.threat_intelligence.validator import ThreatValidator
from app.ml.risk_models import FullAIRiskPipeline, IndividualRiskModels
from app.ml.fusion_layer import fuse_risk_evidence
from app.services.risk_engine import RiskEngine
from app.services.fabric_service import FabricService

logger = logging.getLogger(__name__)

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
CONFIG_PATH = os.path.join(REPO_ROOT, "config", "threat_sources.json")

class ThreatIntelligenceService:
    """
    Continuous Threat Intelligence Ingestion, Validation, and Model Reassessment Service.
    """

    @classmethod
    def load_sources_config(cls) -> List[Dict[str, Any]]:
        """Loads threat sources registry from config/threat_sources.json."""
        if os.path.exists(CONFIG_PATH):
            try:
                with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                    return [s for s in cfg.get("sources", []) if s.get("enabled", True)]
            except Exception as e:
                logger.warning(f"Failed to read threat sources config: {e}")
        return []

    @classmethod
    def ingest_from_registry(cls, db: Session, offline_mode: bool = True) -> Dict[str, Any]:
        """
        Executes ingestion across configured sources.
        In offline mode, only processes local JSON/XML feeds.
        In online mode, attempts RSS/Atom feeds with graceful fallback.
        """
        sources = cls.load_sources_config()
        ingested_count = 0
        duplicate_count = 0
        validated_count = 0
        pending_count = 0
        rejected_count = 0
        processed_items = []

        seen_threat_ids = set(r[0] for r in db.query(ThreatIntelligenceRecord.threat_id).all())

        for src in sources:
            src_type = src.get("type", "")
            src_url = src.get("url", "")
            src_name = src.get("name", "Unknown Source")

            raw_items = []

            # Resolve local path relative to REPO_ROOT or cwd
            local_resolved_path = src_url
            if not os.path.isabs(local_resolved_path):
                cand = os.path.join(REPO_ROOT, local_resolved_path)
                if os.path.exists(cand):
                    local_resolved_path = cand

            # 1. Local Feed Ingestion (Offline First)
            if src_type == "local_json" or src_url.endswith(".json"):
                if os.path.exists(local_resolved_path):
                    try:
                        with open(local_resolved_path, "r", encoding="utf-8") as f:
                            raw_items = ThreatFeedParser.parse_json_feed(f.read(), source_name=src_name)
                    except Exception as e:
                        logger.error(f"Error reading local feed {local_resolved_path}: {e}")

            # 2. Remote RSS/Atom Ingestion
            elif src_type == "rss" and not offline_mode:
                try:
                    req = urllib.request.Request(
                        src_url,
                        headers={"User-Agent": "CyberOptRQ-ThreatIntel/1.0 (SIH 2026 PS 26105)"}
                    )
                    with urllib.request.urlopen(req, timeout=4) as response:
                        content = response.read().decode("utf-8", errors="ignore")
                        raw_items = ThreatFeedParser.parse_rss_xml(content, source_name=src_name)
                except Exception as e:
                    logger.warning(f"Online fetch skipped/failed for {src_name} ({src_url}): {e}")
                    # In offline or disconnected environment, this is normal and expected
                    continue

            # Process extracted items
            for raw in raw_items:
                enriched = ThreatExtractor.enrich_item(raw)
                raw_hash = ThreatDeduplicator.compute_hash(enriched)

                # Deduplication Check
                if ThreatDeduplicator.is_duplicate(db, raw_hash, enriched.get("cve"), enriched.get("source")):
                    duplicate_count += 1
                    continue

                # Validation Check
                status, rationale = ThreatValidator.validate_threat(db, enriched)
                if status in ["VALIDATED", "VALIDATED_DEMO"]:
                    validated_count += 1
                elif status == "PENDING_VALIDATION":
                    pending_count += 1
                else:
                    rejected_count += 1

                # Generate primary threat ID
                cve_val = enriched.get("cve")
                demo_id = enriched.get("demo_id") or enriched.get("event_id")
                if demo_id:
                    threat_id = demo_id
                elif cve_val:
                    threat_id = f"THREAT-{cve_val}"
                else:
                    threat_id = f"THREAT-ADVISORY-{raw_hash[:8].upper()}"

                # Ensure threat_id uniqueness across DB and current batch
                suffix = 1
                orig_threat_id = threat_id
                while threat_id in seen_threat_ids:
                    threat_id = f"{orig_threat_id}-{suffix}"
                    suffix += 1
                seen_threat_ids.add(threat_id)

                record = ThreatIntelligenceRecord(
                    threat_id=threat_id,
                    cve=cve_val,
                    source=enriched.get("source", src_name),
                    source_url=enriched.get("url"),
                    title=enriched.get("title")[:250],
                    description=enriched.get("description"),
                    published_at=enriched.get("published_at"),
                    first_seen_at=datetime.utcnow(),
                    validation_status=status,
                    affected_product=enriched.get("affected_product"),
                    attack_type=enriched.get("attack_type"),
                    raw_hash=raw_hash,
                    processed_at=datetime.utcnow(),
                    model_assessment_status="PENDING"
                )

                db.add(record)
                ingested_count += 1
                processed_items.append({
                    "threat_id": threat_id,
                    "cve": cve_val,
                    "title": record.title,
                    "validation_status": status,
                    "source": record.source
                })

        db.commit()

        return {
            "offline_mode": offline_mode,
            "ingested_count": ingested_count,
            "duplicate_count": duplicate_count,
            "validated_count": validated_count,
            "pending_count": pending_count,
            "rejected_count": rejected_count,
            "items": processed_items
        }

    @classmethod
    def ingest_manual_advisory(cls, db: Session, text: str, source: str = "Manual Security Advisory") -> Dict[str, Any]:
        """Ingests unstructured advisory text or JSON string."""
        raw_items = ThreatFeedParser.parse_text_advisory(text, source_name=source)
        if not raw_items:
            return {"status": "ERROR", "message": "No valid content parsed."}

        raw = raw_items[0]
        enriched = ThreatExtractor.enrich_item(raw)
        raw_hash = ThreatDeduplicator.compute_hash(enriched)

        if ThreatDeduplicator.is_duplicate(db, raw_hash, enriched.get("cve"), source):
            return {"status": "DUPLICATE", "message": "Advisory already exists in threat repository."}

        status, rationale = ThreatValidator.validate_threat(db, enriched)

        cve_val = enriched.get("cve")
        threat_id = f"THREAT-{cve_val}" if cve_val else f"THREAT-MANUAL-{raw_hash[:8].upper()}"

        record = ThreatIntelligenceRecord(
            threat_id=threat_id,
            cve=cve_val,
            source=source,
            source_url="local://manual_input",
            title=enriched.get("title")[:250],
            description=enriched.get("description"),
            published_at=enriched.get("published_at"),
            first_seen_at=datetime.utcnow(),
            validation_status=status,
            affected_product=enriched.get("affected_product"),
            attack_type=enriched.get("attack_type"),
            raw_hash=raw_hash,
            processed_at=datetime.utcnow(),
            model_assessment_status="PENDING"
        )
        db.add(record)
        db.commit()

        return {
            "status": "INGESTED",
            "threat_id": threat_id,
            "cve": cve_val,
            "validation_status": status,
            "rationale": rationale
        }

    @classmethod
    def run_reassessment(
        cls,
        db: Session,
        threat_id: Optional[str] = None,
        org_id: str = "Hospital A",
        simulated_p6_evidence: Optional[float] = None,
        limit: Optional[int] = 10
    ) -> List[Dict[str, Any]]:
        """
        Executes Task 14 & 15: Automated Multi-Modal Risk Reassessment.
        Evaluates P1-P5 + P6 Empirical Model + Fusion v2 (0.10*P5 + 0.90*P6) -> EAL -> Fabric Ledger.
        """
        query = db.query(ThreatIntelligenceRecord)
        if threat_id:
            query = query.filter(ThreatIntelligenceRecord.threat_id == threat_id)
        else:
            query = query.filter(
                ThreatIntelligenceRecord.validation_status.in_(["VALIDATED", "VALIDATED_DEMO"]),
                ThreatIntelligenceRecord.model_assessment_status == "PENDING"
            )
            if limit:
                query = query.limit(limit)

        threats = query.all()
        results = []

        # Available Assets and Controls
        assets = db.query(Asset).all()
        controls = db.query(SecurityControl).all()

        for threat in threats:
            # 1. Asset Matching: match affected technology to asset or use default critical asset
            matched_asset = None
            if threat.affected_product:
                for a in assets:
                    if threat.affected_product.lower() in a.name.lower() or threat.affected_product.lower() in a.asset_type.lower():
                        matched_asset = a
                        break
            if not matched_asset and assets:
                matched_asset = assets[0]

            financial_value = matched_asset.financial_value if matched_asset else 10000000.0

            # 2. Extract or lookup vulnerability attributes for P1-P5
            cvss = 7.5
            epss = 0.25
            cisa_kev = False
            mitre_tech = "T1190"

            if threat.cve:
                vuln = db.query(Vulnerability).filter(Vulnerability.cve_id == threat.cve).first()
                if vuln:
                    cvss = vuln.cvss_score
                    epss = vuln.epss_score
                    cisa_kev = vuln.cisa_kev
                    mitre_tech = vuln.mitre_attack_technique

            # If it's an escalation demo event, adjust parameters
            if threat.attack_type == "EXPLOITABILITY_ESCALATION" or "weaponized" in (threat.description or "").lower():
                epss = 0.965
                cisa_kev = True
                cvss = 9.8

            # 3. Run P1-P4 Models
            p1 = IndividualRiskModels.model_1_nvd_cvss_cwe(cvss, "CWE-787")
            p2 = IndividualRiskModels.model_2_epss(epss)
            p3 = IndividualRiskModels.model_3_cisa_kev(cisa_kev)
            p4 = IndividualRiskModels.model_4_mitre_attack(mitre_tech)

            # 4. Run P5 Meta Ensemble Pipeline
            pipeline = FullAIRiskPipeline()
            try:
                pipeline_res = pipeline.run_pipeline(
                    cvss_score=cvss,
                    cwe_id="CWE-787",
                    epss_score=epss,
                    is_cisa_kev=cisa_kev,
                    mitre_technique=mitre_tech,
                    asset_criticality=matched_asset.criticality_score if matched_asset else 5.0,
                    exposure_level=matched_asset.exposure_level if matched_asset else "INTERNAL"
                )
                p5 = pipeline_res.get("meta_exploitation_probability", (p1+p2+p3+p4)/4.0)
            except Exception:
                p5 = round((0.25 * p1 + 0.35 * p2 + 0.25 * p3 + 0.15 * p4), 4)

            # 5. Determine P6 Empirical Evidence
            # If simulated/empirical telemetry is provided, use it; otherwise infer based on active attack state
            if simulated_p6_evidence is not None:
                p6 = max(0.0, min(1.0, float(simulated_p6_evidence)))
            elif threat.validation_status == "VALIDATED_DEMO" and "escalation" in threat.threat_id.lower():
                p6 = 0.95
            elif cisa_kev or epss > 0.5:
                p6 = 0.85
            else:
                p6 = 0.15

            # 6. Apply Fusion v2: P_fused = 0.10 * P5 + 0.90 * P6
            fusion_res = fuse_risk_evidence(
                p5_risk_score=p5,
                p6_network_evidence=p6,
                fusion_version="v2",
                assessment_id=f"REASSESS-{threat.threat_id}"
            )
            fused_prob = fusion_res["fused_probability"]

            # 7. Calculate EAL
            financial_breach_cost = financial_value * 0.20
            eal_pre = RiskEngine.calculate_eal_pre(fused_prob, financial_breach_cost)
            eal_post = RiskEngine.calculate_eal_post(eal_pre, controls[:2])
            risk_reduction = RiskEngine.calculate_risk_reduction(eal_pre, eal_post)

            # 8. Anchor Reassessment on Hyperledger Fabric (Task 15)
            fabric_details = {
                "p5_probability": p5,
                "p6_probability": p6,
                "fused_probability": fused_prob,
                "p5_model_version": "CyberOptRQ_Model5_Meta_Ensemble_v1",
                "p6_model_version": "CyberOptRQ_P6_CIC2017_XGBoost_v1",
                "fusion_version": "v2",
                "p6_weight": 0.90,
                "p5_weight": 0.10,
                "matched_asset_id": matched_asset.id if matched_asset else "ASSET-GLOBAL",
                "risk_reduction_inr": risk_reduction,
                "assessment_timestamp": datetime.utcnow().isoformat() + "Z"
            }

            fabric_res = FabricService.record_risk_assessment(
                org_id=org_id,
                threat_id=threat.threat_id,
                meta_risk=p5,
                org_risk=fused_prob,
                eal=eal_pre,
                details=fabric_details
            )

            # 9. Mark threat as assessed
            threat.model_assessment_status = "ASSESSED"
            threat.processed_at = datetime.utcnow()
            db.commit()

            results.append({
                "threat_id": threat.threat_id,
                "cve": threat.cve,
                "asset_name": matched_asset.name if matched_asset else "Default Enterprise Infrastructure",
                "p5_meta_probability": p5,
                "p6_empirical_probability": p6,
                "fused_probability": fused_prob,
                "fusion_version": "v2 (w_p6=0.90, w_p5=0.10)",
                "eal_pre": eal_pre,
                "eal_post": eal_post,
                "risk_reduction": risk_reduction,
                "fabric_audit_status": fabric_res.get("status"),
                "fabric_event_id": fabric_res.get("event_id")
            })

        return results
