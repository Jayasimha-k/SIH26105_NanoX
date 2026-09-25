from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# SQLite specific connect args
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    Base.metadata.create_all(bind=engine)
    if settings.DATABASE_URL.startswith("sqlite"):
        with engine.connect() as conn:
            try:
                res = conn.execute(text("PRAGMA table_info(continual_learning_evidence)")).fetchall()
                col_names = [r[1] for r in res]
                if col_names and "recommended_control" not in col_names:
                    conn.execute(text("ALTER TABLE continual_learning_evidence ADD COLUMN recommended_control VARCHAR DEFAULT 'NIST-PR.AC-1: Access Control Hardening'"))
                    conn.commit()
            except Exception:
                pass
            try:
                res_org = conn.execute(text("PRAGMA table_info(organizations)")).fetchall()
                org_cols = [r[1] for r in res_org]
                if org_cols and "critical_services" not in org_cols:
                    conn.execute(text("ALTER TABLE organizations ADD COLUMN critical_services JSON DEFAULT '[]'"))
                    conn.commit()

                res_assets = conn.execute(text("PRAGMA table_info(assets)")).fetchall()
                asset_cols = [r[1] for r in res_assets]
                if asset_cols and "organization_id" not in asset_cols:
                    conn.execute(text("ALTER TABLE assets ADD COLUMN organization_id VARCHAR DEFAULT 'org_abc_tech'"))
                    conn.commit()

                res_inc = conn.execute(text("PRAGMA table_info(incident_history)")).fetchall()
                inc_cols = [r[1] for r in res_inc]
                if inc_cols:
                    if "severity" not in inc_cols:
                        conn.execute(text("ALTER TABLE incident_history ADD COLUMN severity VARCHAR DEFAULT 'HIGH'"))
                    if "description" not in inc_cols:
                        conn.execute(text("ALTER TABLE incident_history ADD COLUMN description VARCHAR"))
                    if "loss_inr" not in inc_cols:
                        conn.execute(text("ALTER TABLE incident_history ADD COLUMN loss_inr FLOAT DEFAULT 0.0"))
                    conn.commit()
            except Exception:
                pass

init_db()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
