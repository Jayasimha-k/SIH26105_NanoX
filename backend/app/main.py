import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.api.routers import (
    auth, detect, predict, quantify, optimize,
    approvals, execution, recalculate, audit, blockchain, business_value, ws, threat_intelligence, learning, intelligence, demo
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
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers (both /api and /api/v1 for seamless compatibility)
_all_routers = [
    auth.router, detect.router, predict.router, quantify.router, optimize.router,
    approvals.router, execution.router, recalculate.router, audit.router,
    blockchain.router, business_value.router, threat_intelligence.router,
    learning.router, intelligence.router, demo.router
]
for r in _all_routers:
    app.include_router(r, prefix=settings.API_V1_STR)
    if settings.API_V1_STR != "/api/v1":
        app.include_router(r, prefix="/api/v1")
app.include_router(ws.router)

# Mount Bad Apple Visualizer static directory & video serving for robust offline operation
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

_bad_apple_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "bad-apple-visualizer"))
if os.path.isdir(_bad_apple_dir):
    app.mount("/visualizer", StaticFiles(directory=_bad_apple_dir, html=True), name="visualizer")

@app.get("/demo/bad-apple-video")
def get_bad_apple_video():
    video_path = os.path.join(_bad_apple_dir, "bad_apple.mp4")
    if os.path.exists(video_path):
        return FileResponse(video_path, media_type="video/mp4")
    root_video = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "video [Lyrics in Romaji, Translation in English].mp4"))
    if os.path.exists(root_video):
        return FileResponse(root_video, media_type="video/mp4")
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Bad Apple video not found on disk")

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
