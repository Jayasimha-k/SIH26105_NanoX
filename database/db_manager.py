"""
database/db_manager.py
Unified SQLite Database Manager for SIH 2026 Air-Gapped Cyber Risk Platform.

Manages 9 core tables in cyber_risk.db:
1. organizations
2. assets
3. vulnerabilities
4. threat_events
5. asset_vulnerabilities
6. risk_snapshots
7. recommendations
8. investments
9. blockchain_records
"""

import os
import sys
import json
import sqlite3
from typing import Dict, Any, List, Optional

# Ensure project root in python search path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

DB_PATH = os.path.join(PROJECT_ROOT, "cyber_risk.db")


def get_connection(db_path: str = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str = DB_PATH, reset: bool = False):
    """Creates all 9 core schema tables in the local SQLite database."""
    if reset and os.path.exists(db_path):
        os.remove(db_path)

    conn = get_connection(db_path)
    cursor = conn.cursor()

    cursor.executescript("""
    -- 1. Organizations
    CREATE TABLE IF NOT EXISTS organizations (
        organization_id TEXT PRIMARY KEY,
        organization_name TEXT NOT NULL,
        industry TEXT NOT NULL,
        organization_size TEXT NOT NULL,
        number_of_employees INTEGER,
        number_of_endpoints INTEGER,
        number_of_servers INTEGER,
        current_risk_score REAL,
        current_risk_level TEXT,
        posture_json TEXT,
        last_updated TEXT
    );

    -- 2. Assets
    CREATE TABLE IF NOT EXISTS assets (
        asset_id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        asset_name TEXT NOT NULL,
        technology TEXT NOT NULL,
        asset_type TEXT NOT NULL,
        criticality REAL NOT NULL, -- 1.0 to 10.0
        exposure TEXT NOT NULL,    -- INTERNET_FACING, INTERNAL_PROTECTED, AIR_GAPPED_ISOLATED
        ip_address TEXT,
        owner TEXT,
        FOREIGN KEY (organization_id) REFERENCES organizations(organization_id)
    );

    -- 3. Vulnerabilities
    CREATE TABLE IF NOT EXISTS vulnerabilities (
        cve_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        affected_technology TEXT NOT NULL,
        cvss_score REAL NOT NULL,
        epss_score REAL NOT NULL,
        cisa_kev INTEGER NOT NULL, -- 1 or 0
        attack_vector TEXT,
        base_remediation TEXT,
        data_source TEXT DEFAULT 'REAL_CVE'
    );

    -- 4. Threat Events
    CREATE TABLE IF NOT EXISTS threat_events (
        event_id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        title TEXT NOT NULL,
        affected_technology TEXT NOT NULL,
        reference_cve TEXT,
        cvss_score REAL,
        epss_score REAL,
        cisa_kev INTEGER,
        description TEXT,
        threat_status TEXT,
        is_simulation INTEGER DEFAULT 0
    );

    -- 5. Asset Vulnerabilities (Active Correlated Mappings)
    CREATE TABLE IF NOT EXISTS asset_vulnerabilities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id TEXT NOT NULL,
        cve_id TEXT NOT NULL,
        detected_at TEXT NOT NULL,
        correlation_status TEXT NOT NULL, -- ACTIVE, MITIGATED, PATCHED
        asset_risk_score REAL,
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
        FOREIGN KEY (cve_id) REFERENCES vulnerabilities(cve_id)
    );

    -- 6. Risk Snapshots (Timeline of Risk Changes)
    CREATE TABLE IF NOT EXISTS risk_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organization_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        risk_score REAL NOT NULL,
        risk_level TEXT NOT NULL,
        trigger_event TEXT,
        trigger_id TEXT,
        affected_asset TEXT,
        explanation_json TEXT,
        FOREIGN KEY (organization_id) REFERENCES organizations(organization_id)
    );

    -- 7. Recommendations
    CREATE TABLE IF NOT EXISTS recommendations (
        recommendation_id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        title TEXT NOT NULL,
        target_asset TEXT,
        related_cve TEXT,
        control_category TEXT NOT NULL,
        expected_risk_reduction REAL NOT NULL,
        cost_inr REAL NOT NULL,
        priority TEXT NOT NULL,
        status TEXT DEFAULT 'PROPOSED' -- PROPOSED, APPROVED, REMEDIATED
    );

    -- 8. Investments (Control Catalog & Budgets)
    CREATE TABLE IF NOT EXISTS investments (
        investment_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        base_cost_inr REAL NOT NULL,
        expected_risk_reduction REAL,
        efficiency_ratio REAL,
        description TEXT
    );

    -- 9. Blockchain Records (Cryptographic Audit Trail)
    CREATE TABLE IF NOT EXISTS blockchain_records (
        block_index INTEGER PRIMARY KEY,
        timestamp TEXT NOT NULL,
        organization_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        previous_risk REAL NOT NULL,
        new_risk REAL NOT NULL,
        trigger TEXT NOT NULL,
        affected_asset TEXT,
        model_version TEXT NOT NULL,
        details_json TEXT NOT NULL,
        previous_hash TEXT NOT NULL,
        block_hash TEXT NOT NULL
    );
    """)

    conn.commit()
    conn.close()


def seed_default_data(db_path: str = DB_PATH):
    """Seeds Hospital A demonstration data, assets, and vulnerability catalogs."""
    init_db(db_path)
    conn = get_connection(db_path)
    cursor = conn.cursor()

    # Check if already seeded
    cursor.execute("SELECT COUNT(*) FROM organizations WHERE organization_id = 'ORG-HOSP-A'")
    if cursor.fetchone()[0] > 0:
        conn.close()
        return

    # 1. Organization: Hospital A
    hosp_posture = {
        "organization_id": "ORG-HOSP-A",
        "organization_name": "Hospital A Healthcare Trust",
        "industry": "healthcare",
        "organization_size": "large",
        "number_of_employees": 1200,
        "number_of_endpoints": 1800,
        "number_of_servers": 45,
        "cloud_usage_percentage": 50.0,
        "remote_worker_percentage": 25.0,
        "critical_asset_count": 12,
        "mfa_coverage": 40.0,
        "password_policy_score": 65.0,
        "access_review_frequency_days": 90,
        "sso_adoption_percentage": 45.0,
        "privileged_account_mfa": 0,
        "privileged_access_management": 0,
        "least_privilege_enforced": 0,
        "asset_inventory_coverage": 85.0,
        "asset_discovery_frequency_days": 60,
        "data_classification_implemented": 1,
        "critical_asset_identification": 1,
        "endpoint_protection_coverage": 70.0,
        "encryption_at_rest": 75.0,
        "encryption_in_transit": 80.0,
        "firewall_deployment": 1,
        "network_segmentation": 0,
        "security_awareness_training": 1,
        "secure_configuration_baselines": 0,
        "vulnerability_scanning_frequency_days": 45,
        "patch_frequency_days": 45,
        "average_patch_delay": 50,
        "critical_vulnerability_remediation_time": 30,
        "penetration_testing_frequency_months": 12,
        "siem_deployed": 0,
        "security_monitoring": 1,
        "soc_coverage_hours": 8,
        "edr_coverage": 30.0,
        "log_retention_days": 90,
        "automated_alerting": 0,
        "mean_time_to_detect": 72.0,
        "mean_time_to_respond": 48.0,
        "incident_response_plan": 1,
        "incident_response_testing": 0,
        "dedicated_ir_team": 0,
        "offline_backup": 0,
        "backup_frequency_hours": 24,
        "backup_testing_frequency_months": 6,
        "disaster_recovery_plan": 1,
        "recovery_time_objective_hours": 48,
        "recovery_point_objective_hours": 24,
        "vendor_risk_management": 0,
        "third_party_access_controls": 0,
        "supply_chain_monitoring": 0,
        "previous_incidents_count": 1,
        "previous_data_breach": 0,
        "ransomware_history": 0
    }

    cursor.execute("""
        INSERT INTO organizations (
            organization_id, organization_name, industry, organization_size,
            number_of_employees, number_of_endpoints, number_of_servers,
            current_risk_score, current_risk_level, posture_json, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    """, (
        "ORG-HOSP-A", "Hospital A Healthcare Trust", "healthcare", "large",
        1200, 1800, 45, 62.0, "High", json.dumps(hosp_posture)
    ))

    # 2. Assets for Hospital A (Key test case from Problem Statement)
    assets = [
        ("SERVER-001", "ORG-HOSP-A", "Mail & Records Exchange Server", "Microsoft Exchange", "Server", 9.5, "INTERNET_FACING", "192.168.10.15", "Hospital IT Ops"),
        ("SERVER-002", "ORG-HOSP-A", "Linux PACS Imaging Host", "Linux", "Server", 6.5, "INTERNAL_PROTECTED", "10.0.4.22", "Radiology Dept"),
        ("SERVER-003", "ORG-HOSP-A", "Core Oracle Patient EHR Database", "Oracle Database", "Database", 9.8, "INTERNAL_PROTECTED", "10.0.1.50", "Database Admin"),
        ("SERVER-004", "ORG-HOSP-A", "Outpatient Appointment Web Portal", "Apache HTTP Server", "Web Server", 7.0, "INTERNET_FACING", "192.168.10.80", "Web Team"),
        ("SERVER-005", "ORG-HOSP-A", "Telemetry & IoT Medical Hub", "Embedded Linux", "IoT Gateway", 8.0, "INTERNAL_PROTECTED", "10.0.5.12", "Clinical Engineering")
    ]
    cursor.executemany("""
        INSERT INTO assets (asset_id, organization_id, asset_name, technology, asset_type, criticality, exposure, ip_address, owner)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, assets)

    # 3. Load Real Vulnerabilities from data/threats/vulnerabilities.json
    vuln_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "threats", "vulnerabilities.json")
    if os.path.exists(vuln_file):
        with open(vuln_file, "r") as f:
            vdata = json.load(f).get("vulnerabilities", [])
            for v in vdata:
                cursor.execute("""
                    INSERT OR REPLACE INTO vulnerabilities (
                        cve_id, title, affected_technology, cvss_score, epss_score, cisa_kev, attack_vector, base_remediation, data_source
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'REAL_CVE')
                """, (
                    v["cve_id"], v["title"], json.dumps(v["affected_technologies"]),
                    v["cvss_score"], v["epss_score"], 1 if v.get("cisa_kev") else 0,
                    v.get("attack_vector", "NETWORK"), v.get("base_remediation", "")
                ))

    # 4. Standard Investments Catalog
    investments = [
        ("INV-BACKUP", "Immutable Air-Gapped Offline Backup Vault", "recovery", 650000.0, 19.6, 3.015, "Air-gapped WORM backup protecting against enterprise ransomware extortion."),
        ("INV-PATCH", "Automated Patch & Vulnerability Orchestration", "vulnerability_management", 450000.0, 14.2, 3.156, "Continuous asset scanning and automated patch testing pipeline for CVE remediation."),
        ("INV-MFA", "Enterprise Hardware MFA & FIDO2 Enforcement", "identity_and_access", 500000.0, 9.9, 1.980, "Deploys hardware/push-based MFA across 100% of employees and admin accounts."),
        ("INV-EDR", "Next-Gen Managed EDR & Threat Hunting", "detection", 900000.0, 7.8, 0.867, "Continuous behavioral endpoint detection, telemetry archiving, and automated quarantine."),
        ("INV-MICROSEG", "Zero-Trust Network Microsegmentation", "protection", 400000.0, 6.5, 1.625, "Isolates critical patient records and Exchange servers from lateral movement.")
    ]
    cursor.executemany("""
        INSERT OR REPLACE INTO investments (investment_id, name, category, base_cost_inr, expected_risk_reduction, efficiency_ratio, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, investments)

    # 5. Genesis Risk Snapshot
    cursor.execute("""
        INSERT INTO risk_snapshots (organization_id, timestamp, risk_score, risk_level, trigger_event, trigger_id, affected_asset, explanation_json)
        VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?)
    """, (
        "ORG-HOSP-A", 62.0, "High", "INITIAL_BASELINE", "GENESIS", "ALL",
        json.dumps({"reason": "Initial organization posture assessment based on NIST CSF 2.0 baseline."})
    ))

    # 6. Genesis Blockchain Block
    from blockchain.ledger import OfflineBlockchain
    bc = OfflineBlockchain()
    genesis_block = bc.create_block_record(
        last_block=None,
        organization_id="ORG-HOSP-A",
        event_type="INITIAL_ASSESSMENT",
        previous_risk=0.0,
        new_risk=62.0,
        trigger="GENESIS_BASELINE",
        affected_asset="ALL_ASSETS",
        details={"status": "Genesis risk baseline recorded for Hospital A Healthcare Trust"}
    )
    cursor.execute("""
        INSERT INTO blockchain_records (
            block_index, timestamp, organization_id, event_type, previous_risk,
            new_risk, trigger, affected_asset, model_version, details_json,
            previous_hash, block_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        genesis_block["block_index"], genesis_block["timestamp"], genesis_block["organization_id"],
        genesis_block["event_type"], genesis_block["previous_risk"], genesis_block["new_risk"],
        genesis_block["trigger"], genesis_block["affected_asset"], genesis_block["model_version"],
        genesis_block["details_json"], genesis_block["previous_hash"], genesis_block["block_hash"]
    ))

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db(reset=True)
    seed_default_data()
    print("Database cyber_risk.db successfully initialized and seeded.")
