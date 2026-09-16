import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import engine, Base, SessionLocal
from app.models.db_models import User, Asset, Vulnerability, SecurityControl, Recommendation, IncidentHistory
from app.services.ledger import LedgerService
from app.utils.security import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(Asset).first() is not None:
            print("Database already seeded.")
            return

        print("Seeding CyberOpt-RQ database with SIH PS 26105 datasets...")

        # 1. Users with secure bcrypt hashes
        default_pwd = get_password_hash("CyberOpt@2026!")
        users = [
            User(username="ciso_executive", email="ciso@cyberopt.internal", hashed_password=default_pwd, role="CISO"),
            User(username="soc_analyst", email="soc@cyberopt.internal", hashed_password=default_pwd, role="SOC"),
            User(username="security_lead", email="security@cyberopt.internal", hashed_password=default_pwd, role="Security"),
            User(username="it_remediation", email="it@cyberopt.internal", hashed_password=default_pwd, role="IT")
        ]
        db.add_all(users)

        # 2. Asset Inventory (IT/OT/Cloud Assets - PDF Page 3 & 4)
        assets = [
            Asset(id="ASSET-001", name="Core Oracle Production DB", asset_type="OT Asset", criticality_score=9.5, financial_value=12000000.0, ip_address="10.0.1.50", owner="Database Admin", exposure_level="INTERNAL", sla_hours=12),
            Asset(id="ASSET-002", name="Production K8s Microservices Cluster", asset_type="Cloud Infrastructure", criticality_score=9.0, financial_value=8500000.0, ip_address="10.0.2.100", owner="DevOps Team", exposure_level="INTERNET_FACING", sla_hours=6),
            Asset(id="ASSET-003", name="Payment API Gateway", asset_type="Cloud Infrastructure", criticality_score=8.8, financial_value=6000000.0, ip_address="10.0.3.10", owner="FinTech Engineering", exposure_level="INTERNET_FACING", sla_hours=4),
            Asset(id="ASSET-004", name="Executive Email & Active Directory", asset_type="IT Asset", criticality_score=8.2, financial_value=4500000.0, ip_address="10.0.1.12", owner="IT Infrastructure", exposure_level="INTERNAL", sla_hours=24),
            Asset(id="ASSET-005", name="Customer Support Web Portal", asset_type="IT Asset", criticality_score=6.5, financial_value=2000000.0, ip_address="10.0.4.80", owner="Customer Ops", exposure_level="INTERNET_FACING", sla_hours=48)
        ]
        db.add_all(assets)

        # 3. Public Vulnerabilities (NVD, EPSS, CISA KEV, MITRE ATT&CK - PDF Page 3 & 6)
        vulns = [
            Vulnerability(
                id="CVE-2024-21626", cve_id="CVE-2024-21626", title="runc Container Escape RCE",
                cvss_score=9.8, epss_score=0.88, cisa_kev=True,
                mitre_attack_technique="T1190", mitre_attack_name="Exploit Public-Facing Application",
                cwe_id="CWE-787", affected_products="Linux Container Runtime / runc",
                attack_vector="NETWORK", complexity="LOW", privileges_required="NONE", financial_impact_base=3500000.0
            ),
            Vulnerability(
                id="CVE-2024-3094", cve_id="CVE-2024-3094", title="XZ Utils Supply Chain Backdoor",
                cvss_score=10.0, epss_score=0.95, cisa_kev=True,
                mitre_attack_technique="T1068", mitre_attack_name="Exploitation for Privilege Escalation",
                cwe_id="CWE-94", affected_products="liblzma / SSH Daemon",
                attack_vector="NETWORK", complexity="LOW", privileges_required="NONE", financial_impact_base=5000000.0
            ),
            Vulnerability(
                id="CVE-2023-4863", cve_id="CVE-2023-4863", title="libwebp Heap Buffer Overflow",
                cvss_score=8.8, epss_score=0.72, cisa_kev=True,
                mitre_attack_technique="T1210", mitre_attack_name="Exploitation of Remote Services",
                cwe_id="CWE-787", affected_products="WebP Image Decoder",
                attack_vector="NETWORK", complexity="LOW", privileges_required="NONE", financial_impact_base=1800000.0
            ),
            Vulnerability(
                id="CVE-2023-23397", cve_id="CVE-2023-23397", title="Microsoft Outlook NTLM Hash Elevation",
                cvss_score=9.8, epss_score=0.91, cisa_kev=True,
                mitre_attack_technique="T1078", mitre_attack_name="Valid Accounts",
                cwe_id="CWE-200", affected_products="Microsoft Outlook",
                attack_vector="NETWORK", complexity="LOW", privileges_required="NONE", financial_impact_base=2200000.0
            ),
            Vulnerability(
                id="CVE-2023-38831", cve_id="CVE-2023-38831", title="WinRAR Arbitrary Code Execution",
                cvss_score=7.8, epss_score=0.64, cisa_kev=False,
                mitre_attack_technique="T1059", mitre_attack_name="Command & Scripting Interpreter",
                cwe_id="CWE-78", affected_products="WinRAR Shell Extension",
                attack_vector="LOCAL", complexity="LOW", privileges_required="NONE", financial_impact_base=950000.0
            )
        ]
        db.add_all(vulns)

        # 4. Incident History (Past incidents & costs - PDF Page 3)
        incidents = [
            IncidentHistory(asset_id="ASSET-001", incident_name="Attempted SQL Injection & Data Probe", incident_type="Data Probe", loss_incurred=150000.0, date_occurred="2025-11-14"),
            IncidentHistory(asset_id="ASSET-002", incident_name="Cryptomining Container Intrusion", incident_type="Ransomware / Exploit", loss_incurred=450000.0, date_occurred="2026-02-01"),
            IncidentHistory(asset_id="ASSET-003", incident_name="Volumetric DDoS Spike on Payment Gateway", incident_type="DDoS", loss_incurred=300000.0, date_occurred="2026-05-18")
        ]
        db.add_all(incidents)

        # 5. Security Controls (EDR, Firewall, SIEM, WAF - PDF Page 3 & 4)
        controls = [
            SecurityControl(id="CTRL-001", code="ZERO_TRUST", name="Zero-Trust Microsegmentation & Network Isolation", category="Firewall", cost=300000.0, effectiveness=0.85, implementation_time_days=5, status="PROPOSED"),
            SecurityControl(id="CTRL-002", code="EDR_PATCH", name="Automated EDR & Container Guard Patching", category="EDR", cost=200000.0, effectiveness=0.90, implementation_time_days=3, status="PROPOSED"),
            SecurityControl(id="CTRL-003", code="WAF_BOT", name="Cloud Next-Gen WAF & Bot Mitigation", category="WAF", cost=250000.0, effectiveness=0.75, implementation_time_days=4, status="PROPOSED"),
            SecurityControl(id="CTRL-004", code="IAM_MFA", name="FIDO2 Hardware Key MFA Enforcement", category="IAM", cost=100000.0, effectiveness=0.95, implementation_time_days=2, status="PROPOSED"),
            SecurityControl(id="CTRL-005", code="SIEM_SOAR", name="SIEM + SOAR Automated Incident Response", category="SIEM", cost=150000.0, effectiveness=0.80, implementation_time_days=7, status="PROPOSED", requires_control_id="CTRL-002")
        ]
        db.add_all(controls)
        db.commit()

        # 6. Recommendations
        recommendations = [
            Recommendation(
                id="REC-001",
                title="Immediate Remediation of runc Container Escape (CVE-2024-21626)",
                description="Apply automated container patch & EDR guard duty on Production K8s cluster (ASSET-002).",
                asset_id="ASSET-002",
                vulnerability_id="CVE-2024-21626",
                control_id="CTRL-002",
                priority="CRITICAL",
                expected_risk_reduction=2850000.0,
                cost=200000.0,
                rosi=1325.0,
                status="PENDING"
            ),
            Recommendation(
                id="REC-002",
                title="Deploy Zero-Trust Microsegmentation on Core Oracle DB",
                description="Isolate Core Oracle DB (ASSET-001) from unauthorized lateral movements.",
                asset_id="ASSET-001",
                vulnerability_id="CVE-2024-3094",
                control_id="CTRL-001",
                priority="CRITICAL",
                expected_risk_reduction=3975000.0,
                cost=300000.0,
                rosi=1225.0,
                status="PENDING"
            ),
            Recommendation(
                id="REC-003",
                title="Enforce FIDO2 Hardware Keys for Active Directory Admins",
                description="Mitigate Outlook NTLM Hash Leak (CVE-2023-23397) on Executive AD Server (ASSET-004).",
                asset_id="ASSET-004",
                vulnerability_id="CVE-2023-23397",
                control_id="CTRL-004",
                priority="HIGH",
                expected_risk_reduction=1890000.0,
                cost=100000.0,
                rosi=1790.0,
                status="PENDING"
            )
        ]
        db.add_all(recommendations)
        db.commit()

        # 7. Initialize Genesis Block on Blockchain Audit Ledger
        LedgerService.record_decision(
            db=db,
            action="GENESIS_BLOCK_INITIALIZED",
            user_id="SYSTEM",
            details={"platform": "CyberOpt-RQ", "version": "1.0.0", "status": "HYPERLEDGER_AUDIT_OPERATIONAL"}
        )

        print("CyberOpt-RQ database successfully seeded with SIH 26105 datasets!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
