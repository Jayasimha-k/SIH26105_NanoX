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

init_db()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
