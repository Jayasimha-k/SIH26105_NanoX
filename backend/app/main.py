import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.api.routers import (
    auth, detect, predict, quantify, optimize,
    approvals, execution, recalculate, audit, business_value, ws
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="CyberOpt-RQ: AI-Powered Continuous Cyber Risk Quantification & Security Investment Optimization Platform (SIH PS-26105)"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(detect.router, prefix=settings.API_V1_STR)
app.include_router(predict.router, prefix=settings.API_V1_STR)
app.include_router(quantify.router, prefix=settings.API_V1_STR)
app.include_router(optimize.router, prefix=settings.API_V1_STR)
app.include_router(approvals.router, prefix=settings.API_V1_STR)
app.include_router(execution.router, prefix=settings.API_V1_STR)
app.include_router(recalculate.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)
app.include_router(business_value.router, prefix=settings.API_V1_STR)
app.include_router(ws.router)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "team": "Nano X",
        "sih_problem_statement": "26105",
        "status": "OPERATIONAL",
        "solution_flow": [
            "1. DETECT (NVD, EPSS, KEV, ATT&CK, Org Assets)",
            "2. PREDICT (P1-P4 Ensemble & Org Adaptation)",
            "3. QUANTIFY (EAL Loss Calculation)",
            "4. OPTIMIZE (PuLP Budget Investment Optimization)",
            "5. RECOMMEND (Prioritized Control Options)",
            "6. APPROVE (CISO Human-in-the-Loop)",
            "7. EXECUTE (IT Control Implementation)",
            "8. VERIFY & RECALCULATE (Self-Learning Feedback Loop)",
            "IMMUTABLE BLOCKCHAIN AUDIT TRAIL"
        ],
        "docs_url": "/docs"
    }
