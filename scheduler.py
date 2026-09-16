"""
scheduler.py
Local Threat Processing Scheduler & Manual Trigger Engine.

SIH 2026 Problem Statement 26105
Processes locally stored threat events periodically or on-demand without any network calls.
Correlates threats with organization assets, updates dynamic risk scores, and commits
cryptographic audit blocks to the local blockchain.
"""

import os
import sys
import time
import json
import argparse
from typing import Dict, Any, Optional

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from database.db_manager import get_connection, DB_PATH
from threat_correlator import ThreatAssetCorrelator
from local_risk_engine import LocalRiskEngine
from blockchain.ledger import OfflineBlockchain
from explainer import DeterministicRiskExplainer


class LocalThreatScheduler:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self.correlator = ThreatAssetCorrelator(db_path)
        self.risk_engine = LocalRiskEngine(db_path)
        self.blockchain = OfflineBlockchain(db_path)
        self.explainer = DeterministicRiskExplainer()

    def process_threat_event(
        self,
        event: Dict[str, Any],
        organization_id: str = "ORG-HOSP-A"
    ) -> Dict[str, Any]:
        """
        Executes complete offline threat pipeline:
        Threat -> Correlate with Assets -> Recalculate Risk -> Explain -> Commit to Blockchain.
        """
        event_id = event.get("event_id", "DEMO-THREAT")
        event_type = event.get("event_type", "VULNERABILITY_EVENT")
        affected_tech = event.get("affected_technology", "")

        # 1. Fetch current risk baseline
        curr_state = self.risk_engine.get_current_risk(organization_id)
        prev_risk = curr_state["risk_score"]

        # 2. Check if this is a remediation event
        if event_type == "REMEDIATION_EXECUTION":
            target_asset = event.get("target_asset", "SERVER-001")
            # Dynamic reduction
            recalc = self.risk_engine.calculate_composite_risk(
                organization_id=organization_id,
                mitigation_delta=15.0,
                trigger_reason=f"Remediation Applied ({event_id})",
                trigger_id=event_id,
                affected_asset=target_asset
            )
            new_risk = recalc["composite_risk_score"]

            # Update asset_vulnerabilities table to PATCHED
            conn = get_connection(self.db_path)
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE asset_vulnerabilities SET correlation_status = 'PATCHED' WHERE asset_id = ?",
                (target_asset,)
            )

            # Blockchain record
            cursor.execute("SELECT * FROM blockchain_records ORDER BY block_index DESC LIMIT 1")
            last_block = dict(cursor.fetchone())

            block = self.blockchain.create_block_record(
                last_block=last_block,
                organization_id=organization_id,
                event_type="REMEDIATION_EXECUTED",
                previous_risk=prev_risk,
                new_risk=new_risk,
                trigger=event_id,
                affected_asset=target_asset,
                details={
                    "remediation": event.get("title"),
                    "controls": event.get("controls_applied")
                }
            )

            cursor.execute("""
                INSERT INTO blockchain_records (
                    block_index, timestamp, organization_id, event_type, previous_risk,
                    new_risk, trigger, affected_asset, model_version, details_json,
                    previous_hash, block_hash
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                block["block_index"], block["timestamp"], block["organization_id"],
                block["event_type"], block["previous_risk"], block["new_risk"],
                block["trigger"], block["affected_asset"], block["model_version"],
                block["details_json"], block["previous_hash"], block["block_hash"]
            ))
            conn.commit()
            conn.close()

            explanation = self.explainer.explain_remediation_impact(
                remediation_event=event,
                target_asset=target_asset,
                previous_risk=prev_risk,
                new_risk=new_risk
            )

            return {
                "status": "REMEDIATION_PROCESSED",
                "event_id": event_id,
                "previous_risk": prev_risk,
                "new_risk": new_risk,
                "risk_delta": round(new_risk - prev_risk, 1),
                "blockchain_block": block["block_index"],
                "block_hash": block["block_hash"],
                "explanation": explanation
            }

        # 3. Standard Vulnerability / Threat Correlation
        correlation = self.correlator.correlate_threat(event, organization_id)

        if not correlation["matched"]:
            return {
                "status": "UNMATCHED_THREAT",
                "event_id": event_id,
                "previous_risk": prev_risk,
                "new_risk": prev_risk,
                "risk_delta": 0.0,
                "message": correlation["message"]
            }

        # 4. Threat matches assets -> Recalculate dynamic risk
        risk_surge = correlation["risk_delta"]
        recalc = self.risk_engine.calculate_composite_risk(
            organization_id=organization_id,
            active_threat_delta=risk_surge,
            trigger_reason=f"Threat Correlated ({event_id})",
            trigger_id=event_id,
            affected_asset=",".join([a["asset_id"] for a in correlation["correlated_assets"]])
        )
        new_risk = recalc["composite_risk_score"]

        # 5. Commit audit event to local blockchain
        conn = get_connection(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM blockchain_records ORDER BY block_index DESC LIMIT 1")
        last_block_row = cursor.fetchone()
        last_block = dict(last_block_row) if last_block_row else None

        block = self.blockchain.create_block_record(
            last_block=last_block,
            organization_id=organization_id,
            event_type="THREAT_CORRELATED_RISK_SURGE",
            previous_risk=prev_risk,
            new_risk=new_risk,
            trigger=event_id,
            affected_asset=",".join([a["asset_id"] for a in correlation["correlated_assets"]]),
            details={
                "event_title": event.get("title"),
                "threat_technology": affected_tech,
                "correlated_assets": correlation["correlated_assets"]
            }
        )

        cursor.execute("""
            INSERT INTO blockchain_records (
                block_index, timestamp, organization_id, event_type, previous_risk,
                new_risk, trigger, affected_asset, model_version, details_json,
                previous_hash, block_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            block["block_index"], block["timestamp"], block["organization_id"],
            block["event_type"], block["previous_risk"], block["new_risk"],
            block["trigger"], block["affected_asset"], block["model_version"],
            block["details_json"], block["previous_hash"], block["block_hash"]
        ))
        conn.commit()
        conn.close()

        # 6. Generate natural language explanation
        explanation = self.explainer.explain_threat_impact(
            threat_event=event,
            correlated_assets=correlation["correlated_assets"],
            previous_risk=prev_risk,
            new_risk=new_risk
        )

        return {
            "status": "THREAT_PROCESSED_AND_AUDITED",
            "event_id": event_id,
            "previous_risk": prev_risk,
            "new_risk": new_risk,
            "risk_delta": round(new_risk - prev_risk, 1),
            "correlated_assets": correlation["correlated_assets"],
            "blockchain_block": block["block_index"],
            "block_hash": block["block_hash"],
            "explanation": explanation
        }


def run_manual_trigger():
    """Manual one-shot trigger to process next threat event."""
    scheduler = LocalThreatScheduler()
    feed_path = os.path.join(PROJECT_ROOT, "data", "threats", "demo_threat_feed.json")
    if not os.path.exists(feed_path):
        print(f"Feed {feed_path} not found.")
        return

    with open(feed_path, "r") as f:
        feed = json.load(f)

    events = feed.get("events", [])
    if not events:
        print("No events in threat feed.")
        return

    # Process first event as manual sample
    res = scheduler.process_threat_event(events[0])
    print("\n--- Manual Threat Intelligence Processing Result ---")
    print(json.dumps(res, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Local Threat Intelligence Scheduler")
    parser.add_argument("--once", action="store_true", help="Process a single threat event and exit")
    args = parser.parse_args()

    if args.once:
        run_manual_trigger()
    else:
        print("Running in manual trigger mode (use --once).")
        run_manual_trigger()
