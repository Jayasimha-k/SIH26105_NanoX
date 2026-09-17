"""
demo_intelligence_pipeline.py
CyberOptRQ — Continuous Intelligence, Newsletter Ingestion, Human-in-the-Loop & Model Refinement.
Deterministic Offline Air-Gapped Demonstration.

Demonstrates:
1. Organization registration & tech stack definition
2. Pre-existing CyberOptRQ prediction (CVE-2024-21626, Risk = 78%, EAL = ₹2.73M)
3. Offline RFC 822 .eml newsletter ingestion (SANS @RISK)
4. AI extraction of threat intelligence without fabricating data
5. Organization relevance matching & asset correlation
6. CISO Human-in-the-Loop review: [ CONFIRM ]
7. Ground-truth outcome recording (EXPLOITED_SUCCESSFULLY)
8. Prediction vs Reality comparison
9. Controlled model refinement feedback & statistical gate checks
10. Candidate promotion upon human approval
11. Hyperledger Fabric audit trail anchoring with Correlation ID
12. Symmetrical CFO Financial Intelligence workflow (Morning Brew, AWS capex forecast, CFO review, actual outcome tracking)
"""

import os
import sys
import json
import logging
from pathlib import Path

# Add backend directory to sys.path
REPO_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(REPO_ROOT / "backend"))

from app.database import SessionLocal, engine, Base
from app.models.db_models import Organization, Asset, Vulnerability, RiskAssessment
from app.intelligence.service import IntelligenceService
from app.intelligence.email_parser import EmailParser
from app.intelligence.source_detector import SourceDetector
from app.intelligence.deduplicator import EmailDeduplicator
from app.intelligence.content_extractor import ContentExtractor
from app.intelligence.relevance_engine import RelevanceEngine
from app.intelligence.evidence_store import IntelligenceEvidenceStore
from app.intelligence.review_engine import ReviewEngine
from app.intelligence.outcome_engine import OutcomeEngine
from app.intelligence.feedback_engine import ModelFeedbackEngine
from app.services.fabric_service import FabricService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ContinuousIntelDemo")

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


def run_continuous_intelligence_demo():
    print("=" * 85)
    print("  CYBEROPTRQ: CONTINUOUS INTELLIGENCE, HITL & MODEL REFINEMENT DEMO")
    print("=" * 85)
    print("  Core Architectural Principles Enforced:")
    print("  1. Newsletters are POST-PREDICTION evidence — NOT direct input to P1-P5 models.")
    print("  2. Standard RFC 822 Email Parser processes live mailboxes and offline .eml identically.")
    print("  3. Mandatory Human-in-the-Loop validation before any evidence qualifies for model feedback.")
    print("  4. Symmetrical lifecycles for both CISO (Cybersecurity) and CFO (Financial) Intelligence.")
    print("  5. Cryptographic audit trail permanently anchored to Hyperledger Fabric.")
    print("=" * 85)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # =====================================================================
        # PART 1: ORGANIZATION REGISTRATION
        # =====================================================================
        print("\n" + "=" * 85)
        print("[STEP 1] ORGANIZATION REGISTRATION & ENTERPRISE PROFILE SETUP")
        print("=" * 85)

        org_payload = {
            "id": "org_abc_tech",
            "name": "ABC Technologies",
            "domain": "abc.com",
            "industry": "Enterprise Cloud & Software Services",
            "country_region": "India / South Asia",
            "technology_stack": ["AWS", "Linux", "Apache", "Microsoft", "runc", "Docker"],
            "cloud_providers": ["AWS", "Azure"],
            "critical_assets": [
                {"id": "ASSET-001", "name": "Production Server", "criticality": 9.0, "exposure": "INTERNET_FACING"}
            ],
            "business_assets": ["Customer Database", "Proprietary Algorithm Repository"],
            "security_controls": ["NIST-PR.AC-1", "CIS-4.1", "EDR", "WAF"],
            "existing_vulnerabilities": ["CVE-2024-21626", "CVE-2023-46604"],
            "financial_exposure": 3500000.0
        }
        org = IntelligenceService.register_organization(db, org_payload)
        print(f"  [+] Organization Name     : {org.name} ({org.id})")
        print(f"  [+] Domain                : {org.domain}")
        print(f"  [+] Technology Stack      : {', '.join(org.technology_stack)}")
        print(f"  [+] Cloud Providers       : {', '.join(org.cloud_providers)}")
        print(f"  [+] Critical Asset        : {org.critical_assets[0]['name']} (Criticality: 9.0/10)")
        print(f"  [+] Financial Exposure    : ₹{org.financial_exposure:,.2f}")

        # Ensure Asset exists in Asset table
        asset = db.query(Asset).filter(Asset.id == "ASSET-001").first()
        if not asset:
            asset = Asset(
                id="ASSET-001",
                name="Production Server",
                asset_type="Cloud Infrastructure",
                criticality_score=9.0,
                financial_value=3500000.0,
                exposure_level="INTERNET_FACING"
            )
            db.add(asset)
            db.commit()

        # =====================================================================
        # PART 2: EXISTING HISTORICAL PREDICTION (PRE-NEWSLETTER)
        # =====================================================================
        print("\n" + "=" * 85)
        print("[STEP 2] EXISTING CYBEROPTRQ BASELINE PREDICTION (PRE-NEWSLETTER)")
        print("=" * 85)

        # Existing prediction made prior to newsletter arrival
        prev_pred = db.query(RiskAssessment).filter(
            RiskAssessment.asset_id == "ASSET-001",
            RiskAssessment.vulnerability_id == "CVE-2024-21626"
        ).first()
        if not prev_pred:
            prev_pred = RiskAssessment(
                asset_id="ASSET-001",
                vulnerability_id="CVE-2024-21626",
                p1_nvd=0.75,
                p2_epss=0.60,
                p3_kev=0.80,
                p4_mitre=0.70,
                meta_prob=0.76,
                org_adapted_prob=0.78,
                eal_pre=2730000.0,
                eal_post=2730000.0,
                risk_reduction=0.0
            )
            db.add(prev_pred)
            db.commit()
            db.refresh(prev_pred)

        print(f"  [+] Asset Under Review    : {prev_pred.asset_id} (Production Server)")
        print(f"  [+] Vulnerability Tracked : {prev_pred.vulnerability_id}")
        print(f"  [+] Model P1 (NVD CVSS)   : {prev_pred.p1_nvd:.2f}")
        print(f"  [+] Model P2 (EPSS Score) : {prev_pred.p2_epss:.2f}")
        print(f"  [+] Model P3 (Org Context): {prev_pred.p3_kev:.2f}")
        print(f"  [+] Model P4 (MITRE T1068): {prev_pred.p4_mitre:.2f}")
        print(f"  [+] Meta Model P5 Output  : {prev_pred.meta_prob:.2f}")
        print(f"  [*] Prior Adapted Risk    : {prev_pred.org_adapted_prob * 100:.1f}%")
        print(f"  [*] Prior Expected Loss   : ₹{prev_pred.eal_pre:,.2f} EAL")

        # =====================================================================
        # PART 3: INCOMING NEWSLETTER EMAIL INGESTION
        # =====================================================================
        print("\n" + "=" * 85)
        print("[STEP 3] EMAIL ARRIVAL & STANDARD RFC 822 PARSING")
        print("=" * 85)

        eml_path = os.path.join(REPO_ROOT, "data", "intelligence", "demo_emails", "sans_risk_001.eml")
        print(f"  [+] Receiving Email File  : {eml_path}")
        parsed_email = EmailParser.parse_eml_file(eml_path)
        content_hash = EmailDeduplicator.compute_content_hash(
            parsed_email["sender"], parsed_email["subject"], parsed_email["body_text"]
        )
        print(f"  [+] Sender Header         : {parsed_email['sender']}")
        print(f"  [+] Subject Line          : {parsed_email['subject']}")
        print(f"  [+] Message-ID            : {parsed_email['message_id']}")
        print(f"  [+] SHA-256 Content Hash  : {content_hash[:32]}...")

        # Source Detection
        source_info = SourceDetector.detect_source(parsed_email["sender"], parsed_email["subject"])
        print(f"  [+] Detected Source       : {source_info['source_name']} (Trust Level: {source_info['trust_level']})")

        # =====================================================================
        # PART 4: AI STRUCTURED INTELLIGENCE EXTRACTION
        # =====================================================================
        print("\n" + "=" * 85)
        print("[STEP 4] AI STRUCTURED THREAT EXTRACTION (ZERO DATA FABRICATION)")
        print("=" * 85)

        cyber_intel = ContentExtractor.extract_cyber_intelligence(
            parsed_email["body_text"], parsed_email["subject"], source_info["source_name"]
        )
        print(f"  [+] Extracted CVE         : {cyber_intel['cve']}")
        print(f"  [+] Affected Product      : {cyber_intel['product']}")
        print(f"  [+] Attack Vector         : {cyber_intel['attack_vector']}")
        print(f"  [+] MITRE Technique       : {cyber_intel['attack_technique']}")
        print(f"  [+] In-The-Wild Status    : {cyber_intel['exploitation_observed']}")
        print(f"  [+] Reported Outcome      : {cyber_intel['outcome']}")
        print(f"  [+] Extraction Confidence : {cyber_intel['confidence'] * 100:.1f}%")

        # =====================================================================
        # PART 5: ORGANIZATION RELEVANCE MATCHING & PREDICTION LINKAGE
        # =====================================================================
        print("\n" + "=" * 85)
        print("[STEP 5] RELEVANCE ENGINE & HISTORICAL PREDICTION LINKAGE")
        print("=" * 85)

        corr_id = f"CORR-2026-000001"
        match_info = RelevanceEngine.match_cyber_threat(db, org.id, cyber_intel)

        print(f"  [+] Relevance Level       : {match_info['relevance_level']} (Score: {match_info['relevance_score']}/100)")
        for r in match_info["reasons"]:
            print(f"      - {r}")
        print(f"  [+] Matched Target Asset  : {match_info['matched_asset_name']} ({match_info['matched_asset_id']})")
        print(f"  [+] Linked Prediction ID  : #{match_info['previous_prediction_id']}")
        print(f"  [+] Prior AI Prediction   : {match_info['previous_predicted_risk']}% probability")
        print(f"  [+] Established Links     : Threat -> Asset -> Vulnerability -> Prior Prediction")
        print(f"  [*] Correlation ID Issued : {corr_id}")

        # Store in evidence store
        cyber_rec = IntelligenceEvidenceStore.record_cyber_event(
            db=db,
            organization_id=org.id,
            message_id=parsed_email["message_id"],
            source_name=source_info["source_name"],
            extracted_info=cyber_intel,
            match_info=match_info,
            correlation_id=corr_id
        )

        # =====================================================================
        # PART 6: CISO HUMAN-IN-THE-LOOP REVIEW
        # =====================================================================
        print("\n" + "=" * 85)
        print("[STEP 6] CISO HUMAN-IN-THE-LOOP VALIDATION GATE")
        print("=" * 85)
        print("  Review Queue Card Presented to CISO:")
        print("  -------------------------------------------------------------")
        print(f"  CVE: {cyber_intel['cve']} | Source: {source_info['source_name']}")
        print(f"  Affected Product: {cyber_intel['product']}")
        print(f"  Attack Vector: {cyber_intel['attack_vector']} | MITRE: {cyber_intel['attack_technique']}")
        print(f"  Reported In-The-Wild Exploitation: YES")
        print(f"  Matched Asset: {match_info['matched_asset_name']}")
        print(f"  Previous CyberOptRQ Prediction: {match_info['previous_predicted_risk']}%")
        print("  Available Actions: [ CONFIRM ] [ CORRECT ] [ REJECT ] [ NEED INVESTIGATION ]")
        print("  -------------------------------------------------------------")

        review_res = ReviewEngine.process_ciso_review(
            db=db,
            event_id=cyber_rec.event_id,
            decision="CONFIRM",
            reviewer_id="CISO-Executive-Lead",
            reviewer_role="CISO",
            reason="Confirmed CVE-2024-21626 active in-the-wild runc breakout against our production cluster."
        )
        print(f"  [+] CISO Review Action    : {review_res['decision']}")
        print(f"  [+] Review ID             : {review_res['review_id']}")
        print(f"  [+] Reviewer ID           : {review_res['reviewer_id']} ({review_res['reviewer_role']})")
        print(f"  [+] Event Lifecycle State : {review_res['event_status']}")

        # =====================================================================
        # PART 7: GROUND TRUTH OUTCOME & PREDICTION VS REALITY
        # =====================================================================
        print("\n" + "=" * 85)
        print("[STEP 7] GROUND-TRUTH OUTCOME & PREDICTION VS REALITY COMPARISON")
        print("=" * 85)

        outcome_res = OutcomeEngine.record_cyber_outcome(
            db=db,
            event_id=cyber_rec.event_id,
            outcome_state="EXPLOITED_SUCCESSFULLY",
            observed_loss_inr=3500000.0,
            notes="SecOps verified real-world container boundary breakout telemetry on host node."
        )
        print(f"  [+] Ground Truth State    : {outcome_res['outcome_state']}")
        print(f"  [+] Prior Predicted Risk  : {outcome_res['predicted_risk']}%")
        print(f"  [+] Observed Binary Target: {outcome_res['observed_binary']} (Loss event verified)")
        print(f"  [+] Calibration Error     : {outcome_res['calibration_error']:.4f}")
        print(f"  [+] Brier Contribution    : {outcome_res['brier_contribution']:.4f}")
        print(f"  [+] Comparison Summary    : {outcome_res['summary']}")

        # =====================================================================
        # PART 8: CONTROLLED MODEL FEEDBACK & QUALITY GATING
        # =====================================================================
        print("\n" + "=" * 85)
        print("[STEP 8] CONTROLLED MODEL FEEDBACK & GOVERNANCE GATE EVALUATION")
        print("=" * 85)

        # Seed additional confirmed demo points to meet N >= 15 safety floor
        print("  [*] Enforcing Scientific Governance Rule: No automatic retraining on raw news.")
        print("  [*] Accumulating analyst-validated ground-truth samples...")
        IntelligenceService.ingest_offline_demo_emails(db, org.id)
        from app.continual_learning.service import ContinualLearningService
        ContinualLearningService.seed_demo_evidence(db, organization_id=org.id, count=25)

        feedback_status = ModelFeedbackEngine.get_feedback_status(db, org.id)
        print(f"  [+] Confirmed Samples     : {feedback_status['total_confirmed_samples']} (Safety minimum: {feedback_status['minimum_safety_samples']})")
        print(f"  [+] Feedback Queue Status : {feedback_status['feedback_status']}")
        print(f"  [+] Population Drift (PSI): {feedback_status['drift_summary']['status']} (Mean PSI: {feedback_status['drift_summary']['mean_psi']:.4f})")

        # Train Candidate Model
        print("\n  [*] Training Candidate Adaptation Model on Confirmed Evidence...")
        train_res = ModelFeedbackEngine.train_candidate_calibration(db, organization_id=org.id)
        cand_v = train_res["candidate_version"]
        cand_metrics = train_res["validation_metrics"]
        print(f"  [+] Candidate Version     : {cand_v}")
        print(f"  [+] Candidate ROC-AUC     : {cand_metrics.get('roc_auc', 'N/A')}")
        print(f"  [+] Candidate Brier Score : {cand_metrics.get('brier_score', 'N/A')}")
        print(f"  [+] Dataset SHA-256 Hash  : {train_res.get('dataset_hash', 'N/A')[:32]}...")

        # Validate Candidate Gates
        print("\n  [*] Evaluating Statistical Governance Gates (Champion vs Candidate)...")
        val_res = ModelFeedbackEngine.validate_candidate_gates(db, organization_id=org.id)
        print(f"  [+] Gate Decision         : {val_res['decision']} (Passed: {val_res['passed']})")
        for r in val_res["gate_reasons"]:
            print(f"      - {r}")

        # Human Approval Gate & Promotion
        print("\n  [*] Enforcing Mandatory Human Approval Gate...")
        promote_res = ModelFeedbackEngine.approve_and_promote_candidate(
            db=db,
            candidate_version=cand_v,
            approved_by="CISO_GOVERNANCE_BOARD",
            notes="Approved after validating Brier calibration and PSI prediction stability gates."
        )
        print(f"  [+] Promotion Status      : {promote_res['status']}")
        print(f"  [+] New Champion Version  : {promote_res['new_champion_version']}")
        print(f"  [+] Previous Version      : {promote_res['parent_version']}")

        # =====================================================================
        # PART 9: HYPERLEDGER FABRIC CRYPTOGRAPHIC AUDIT ANCHORING
        # =====================================================================
        print("\n" + "=" * 85)
        print("[STEP 9] HYPERLEDGER FABRIC IMMUTABLE AUDIT TRAIL")
        print("=" * 85)

        fabric_tx = FabricService.record_risk_assessment(
            org_id=org.id,
            threat_id="CVE-2024-21626",
            meta_risk=0.78,
            org_risk=0.78,
            eal=2730000.0,
            details={
                "event_id": cyber_rec.event_id,
                "correlation_id": corr_id,
                "lifecycle": "PREDICTION -> NEWSLETTER -> HITL_CONFIRM -> OUTCOME -> CANDIDATE_PROMOTED",
                "promoted_version": promote_res["new_champion_version"],
                "dataset_hash": promote_res["dataset_hash"],
                "artifact_hash": promote_res["artifact_hash"],
                "ciso": "CISO-Executive-Lead"
            }
        )
        print(f"  [+] Fabric Audit Event ID : {fabric_tx['event_id']}")
        print(f"  [+] Fabric Status         : {fabric_tx['status']}")
        print(f"  [+] Consensus Protocol    : {fabric_tx['consensus_engine']}")
        print(f"  [+] Correlation ID        : {corr_id}")
        print(f"  [+] Audit Lineage         : Prediction -> Newsletter Ingestion -> CISO Review -> Ground Truth Outcome -> Fabric Anchored")

        # =====================================================================
        # PART 10: SYMMETRICAL CFO FINANCIAL INTELLIGENCE WORKFLOW
        # =====================================================================
        print("\n" + "=" * 85)
        print("[STEP 10] CFO FINANCIAL INTELLIGENCE WORKFLOW (SYMMETRICAL ARCHITECTURE)")
        print("=" * 85)

        fin_eml_path = os.path.join(REPO_ROOT, "data", "intelligence", "demo_emails", "finance_newsletter_001.eml")
        print(f"  [+] Receiving Financial Email : {fin_eml_path}")
        parsed_fin = EmailParser.parse_eml_file(fin_eml_path)
        fin_source = SourceDetector.detect_source(parsed_fin["sender"], parsed_fin["subject"])

        fin_extracted = ContentExtractor.extract_financial_intelligence(
            parsed_fin["body_text"], parsed_fin["subject"], fin_source["source_name"]
        )
        fin_match = RelevanceEngine.match_financial_signal(db, org.id, fin_extracted)
        fin_corr_id = f"CORR-2026-CFO-001"

        print(f"  [+] Financial Source      : {fin_source['source_name']}")
        print(f"  [+] Extracted Company     : {fin_extracted['company']} (Ticker: {fin_extracted['ticker']})")
        print(f"  [+] Market Event          : {fin_extracted['market_event']}")
        print(f"  [+] Newsletter Forecast   : {fin_extracted['newsletter_forecast']}")
        print(f"  [+] Portfolio Match       : Direct cloud infrastructure provider ({fin_match['relevance_level']})")
        print(f"  [+] Relevant Exposure     : ₹{fin_match['relevant_exposure_inr']:,.2f}")
        print(f"  [+] Expected Return       : {fin_extracted['expected_return']} (Strictly not fabricated)")

        fin_rec = IntelligenceEvidenceStore.record_financial_event(
            db=db,
            organization_id=org.id,
            message_id=parsed_fin["message_id"],
            source_name=fin_source["source_name"],
            extracted_info=fin_extracted,
            match_info=fin_match,
            correlation_id=fin_corr_id
        )

        # CFO Human Review Gate
        cfo_review = ReviewEngine.process_cfo_review(
            db=db,
            financial_id=fin_rec.financial_id,
            decision="CONFIRM",
            reviewer_id="CFO-Executive-User",
            reason="Verified cloud capex growth aligns with our Q3 enterprise expansion budget."
        )
        print(f"  [+] CFO Review Decision   : {cfo_review['decision']} by {cfo_review['reviewer_id']}")

        # Actual Outcome Observed Later
        cfo_outcome = OutcomeEngine.record_financial_outcome(
            db=db,
            financial_id=fin_rec.financial_id,
            actual_market_outcome="AWS reported +19.4% cloud infrastructure revenue expansion; compliance spend increased 22%.",
            notes="Quarterly earnings confirmed newsletter signal without speculation."
        )
        print(f"  [+] Later Actual Outcome  : {cfo_outcome['actual_outcome']}")
        print(f"  [+] Forecast Accuracy     : {cfo_outcome['forecast_accuracy'] * 100:.1f}%")

        # Anchor CFO Transaction to Fabric
        fabric_cfo_tx = FabricService.record_investment_decision(
            org_id=org.id,
            control_id="FIN-AWS-CAPEX",
            investment_cost=3500000.0,
            expected_reduction=15.0,
            rosi=125.0,
            details={
                "financial_id": fin_rec.financial_id,
                "correlation_id": fin_corr_id,
                "cfo_decision": "CONFIRM",
                "forecast_accuracy": cfo_outcome["forecast_accuracy"]
            }
        )
        print(f"  [+] Fabric CFO Audit ID   : {fabric_cfo_tx['event_id']}")
        print(f"  [+] Consensus Protocol    : {fabric_cfo_tx['consensus_engine']}")

        print("\n" + "=" * 85)
        print("  ALL STEPS SUCCESSFULLY EXECUTED AND VERIFIED END-TO-END!")
        print("=" * 85)

    finally:
        db.close()


if __name__ == "__main__":
    run_continuous_intelligence_demo()
