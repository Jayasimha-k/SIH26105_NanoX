import os
import sys

# Ensure backend directory in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import engine, Base, SessionLocal
from app.models.db_models import User, Asset, Vulnerability, SecurityControl, Recommendation
from app.services.ledger import LedgerService

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Asset).first() is not None:
            print("Database already seeded.")
            return

        print("Seeding CyberOpt-RQ initial database...")

        # 1. Users
        users = [
            User(username="ciso_executive", email="ciso@cyberopt.internal", hashed_password="hashed_secret", role="CISO"),
            User(username="soc_analyst", email="soc@cyberopt.internal", hashed_password="hashed_secret", role="SOC"),
            User(username="it_remediation", email="it@cyberopt.internal", hashed_password="hashed_secret", role="IT")
        ]
        db.add_all(users)

        # 2. Assets
        assets = [
            Asset(id="ASSET-001", name="Core Oracle Production DB", asset_type="Database", criticality_score=9.5, financial_value=12000000.0, ip_address="10.0.1.50", owner="Database Admin", exposure_level="INTERNAL"),
            Asset(id="ASSET-002", name="Production K8s Microservices Cluster", asset_type="Cloud Infrastructure", criticality_score=9.0, financial_value=8500000.0, ip_address="10.0.2.100", owner="DevOps Team", exposure_level="INTERNET_FACING"),
            Asset(id="ASSET-003", name="Payment API Gateway", asset_type="Web Service", criticality_score=8.8, financial_value=6000000.0, ip_address="10.0.3.10", owner="FinTech Engineering", exposure_level="INTERNET_FACING"),
            Asset(id="ASSET-004", name="Executive Email & Active Directory", asset_type="Server", criticality_score=8.2, financial_value=4500000.0, ip_address="10.0.1.12", owner="IT Infrastructure", exposure_level="INTERNAL"),
            Asset(id="ASSET-005", name="Customer Support Web Portal", asset_type="Web Service", criticality_score=6.5, financial_value=2000000.0, ip_address="10.0.4.80", owner="Customer Ops", exposure_level="INTERNET_FACING")
        ]
        db.add_all(assets)

        # 3. Vulnerabilities
        vulns = [
            Vulnerability(id="CVE-2024-21626", cve_id="CVE-2024-21626", title="runc Container Escape RCE", cvss_score=9.8, epss_score=0.88, cisa_kev=True, attack_vector="NETWORK", complexity="LOW", privileges_required="NONE", financial_impact_base=3500000.0),
            Vulnerability(id="CVE-2024-3094", cve_id="CVE-2024-3094", title="XZ Utils Supply Chain Backdoor", cvss_score=10.0, epss_score=0.95, cisa_kev=True, attack_vector="NETWORK", complexity="LOW", privileges_required="NONE", financial_impact_base=5000000.0),
            Vulnerability(id="CVE-2023-4863", cve_id="CVE-2023-4863", title="libwebp Heap Buffer Overflow", cvss_score=8.8, epss_score=0.72, cisa_kev=True, attack_vector="NETWORK", complexity="LOW", privileges_required="NONE", financial_impact_base=1800000.0),
            Vulnerability(id="CVE-2023-23397", cve_id="CVE-2023-23397", title="Microsoft Outlook NTLM Elevation of Privilege", cvss_score=9.8, epss_score=0.91, cisa_kev=True, attack_vector="NETWORK", complexity="LOW", privileges_required="NONE", financial_impact_base=2200000.0),
            Vulnerability(id="CVE-2023-38831", cve_id="CVE-2023-38831", title="WinRAR Arbitrary Code Execution", cvss_score=7.8, epss_score=0.64, cisa_kev=False, attack_vector="LOCAL", complexity="LOW", privileges_required="NONE", financial_impact_base=950000.0)
        ]
        db.add_all(vulns)

        # 4. Security Controls
        controls = [
            SecurityControl(id="CTRL-001", code="MICRO_SEG", name="Zero-Trust Microsegmentation & Network Isolation", category="Network", cost=300000.0, effectiveness=0.85, implementation_time_days=5, status="PROPOSED"),
            SecurityControl(id="CTRL-002", code="K8S_PATCH", name="Automated Container Patching & Guard Duty", category="Endpoint", cost=200000.0, effectiveness=0.90, implementation_time_days=3, status="PROPOSED"),
            SecurityControl(id="CTRL-003", code="WAF_DDOS", name="Cloud Next-Gen WAF & Bot Mitigation", category="Network", cost=250000.0, effectiveness=0.75, implementation_time_days=4, status="PROPOSED"),
            SecurityControl(id="CTRL-004", code="FIDO2_MFA", name="FIDO2 Hardware Key Enforcement for Admins", category="IAM", cost=100000.0, effectiveness=0.95, implementation_time_days=2, status="PROPOSED"),
            SecurityControl(id="CTRL-005", code="SOAR_PATCH", name="SOAR Automated Vulnerability Remediation Pipeline", category="Patching", cost=150000.0, effectiveness=0.80, implementation_time_days=7, status="PROPOSED", requires_control_id="CTRL-002")
        ]
        db.add_all(controls)
        db.commit()

        # 5. Recommendations
        recommendations = [
            Recommendation(
                id="REC-001",
                title="Immediate Remediation of runc Container Escape (CVE-2024-21626)",
                description="Apply automated container patch & microsegmentation on Production K8s cluster (ASSET-002).",
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
                title="Deploy Zero-Trust Microsegmentation on Core Banking DB",
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

        # 6. Initialize Genesis Block on Blockchain Audit Ledger
        LedgerService.record_decision(
            db=db,
            action="GENESIS_BLOCK_INITIALIZED",
            user_id="SYSTEM",
            details={"platform": "CyberOpt-RQ", "version": "1.0.0", "status": "LEDGER_OPERATIONAL"}
        )

        print("CyberOpt-RQ database successfully seeded!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
