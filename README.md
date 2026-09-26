# CyberOpt-RQ — SIH 2026 Demo Platform

**PS 26105 · AI-Powered Continuous Cyber Risk Quantification & Security Investment Optimization**

> Fully offline-capable · No cloud credentials required for SIH demo · One-command startup

---

## Quick Start (SIH Demo — 2 Commands)

```powershell
# 1. Install dependencies (first time only)
.\scripts\setup_sih_demo.ps1

# 2. Launch the full demo
.\scripts\start_sih_demo.ps1
```

Browser opens automatically at **http://localhost:5173**

---

## Prerequisites

| Tool | Version | Required For |
|---|---|---|
| Python | 3.11 or newer | Backend |
| Node.js | 18 or newer | Frontend |
| Git | Any | Cloning |

No Docker, no cloud, no API keys required for the SIH demo.

---

## Demo Login

On the login screen:
- Click **"Enter Demo"** (top-right bypass) — no credentials needed
- Select a role from the landing page (CISO, CFO, SOC, Security, IT)

---

## Running URLs

| Service | URL |
|---|---|
| **Frontend Dashboard** | http://localhost:5173 |
| **Backend API** | http://localhost:8000 |
| **API Documentation** | http://localhost:8000/docs |

---

## SIH 27-Step Demo Script

| Step | Action | Where |
|---|---|---|
| 1 | Start demo system | `start_sih_demo.ps1` |
| 2 | Click "Enter Demo" | Login screen |
| 3 | Select CISO role | Login screen |
| 4 | View Dashboard | Executive Conclusions panel |
| 5 | Click **[ ? HELP ]** | Header toolbar |
| 6 | Use ← → to navigate Help | Side panel slides in |
| 7 | Explain Organization Data | Topic 3 in Help |
| 8 | Explain Current Risk | Topic 1 in Help |
| 9 | Explain Network Intelligence | Topic 4 in Help |
| 10 | Close Help (Esc) | Help side panel |
| 11 | Navigate → Intelligence | Sidebar |
| 12 | Show CISO newsletter | Intelligence Center |
| 13 | Show CFO newsletter | CFO tab |
| 14 | Navigate → Security Testing | Sidebar |
| 15 | Click "Launch Authorized Attack" | Security Lab |
| 16 | Return to Dashboard | Sidebar / auto-redirects |
| 17 | Watch ATTACK MODE activate | Dashboard HUD |
| 18 | Watch Bad Apple appear | Dashboard (embedded) |
| 19 | Observe affected asset highlighted | Top Risk Drivers |
| 20 | Watch EAL surge to ₹89.2L | Financial cards |
| 21 | Watch risk change to 87% | Executive Conclusions |
| 22 | Click "DEPLOY REMEDIATION" | Attack HUD panel |
| 23 | Verify risk drops to 14% | Dashboard |
| 24 | Verify EAL drops to ₹7.2L | Financial cards |
| 25 | Navigate → Audit | Sidebar |
| 26 | Show Fabric/blockchain audit | Audit View |
| 27 | Click **[ RESET DEMO ]** | Demo Bar |

---

## Demo Presentation Bar

A 9-stage presentation timeline bar appears below the header.
Click any stage to jump to that narrative point.

| Stage | Narrative |
|---|---|
| 1 — Baseline | Normal enterprise risk at baseline |
| 2 — Threat Intel | CISO newsletter arrives with CVE |
| 3 — CFO Context | CFO sees financial market context |
| 4 — Risk Quantified | Model 6 + P1–P5 pipeline active |
| 5 — Optimization | ILP solver recommends controls |
| 6 — Attack! | Security Lab launches authorized exploit |
| 7 — Dashboard Sync | Real-time ATTACK_STARTED received |
| 8 — Remediation | Zero-Trust microsegmentation deployed |
| 9 — Validation | Fabric audit confirms remediation |

---

## Help System

Click **[ ? HELP ]** in the top-right header.

- Dashboard **stays fully visible** — no opaque modal
- Target element **highlighted with animated glow**
- Side panel slides in from the right with structured explanation
- Navigate with **← → arrow keys** or PREV/NEXT buttons
- Filter by role: CISO · CFO · Security · SOC · ALL
- Press **Esc** to close

Help is **never auto-opened** — only activated by explicit user click.

---

## Offline Mode

The SIH demo runs 100% offline:

| Component | Offline Status |
|---|---|
| ML Models (P1–P6) | Local `.pkl` artifacts |
| Database | SQLite (`cyberopt_rq.db`) |
| Demo emails | Local `.eml` files in `data/intelligence/demo_emails/` |
| Bad Apple video | `frontend/public/bad_apple.mp4` |
| Auth | Local demo bypass (no Clerk cloud) |
| Blockchain audit | Local SHA-256 ledger (no Fabric peers needed) |

When running offline, the dashboard shows **"OFFLINE SIH DEMO MODE"** in the demo bar.

---

## Architecture

```
SIH26105_NanoX/
├── backend/                    # FastAPI + SQLAlchemy + SQLite
│   ├── app/
│   │   ├── main.py             # Application entrypoint
│   │   ├── config.py           # Settings & env vars
│   │   ├── api/routers/        # REST API endpoints
│   │   │   └── demo.py         # /demo/attack/* endpoints
│   │   ├── services/
│   │   │   ├── risk_engine.py  # EAL & ROSI calculator
│   │   │   ├── optimizer.py    # PuLP ILP solver
│   │   │   └── websocket_manager.py
│   │   └── ml/orchestrator.py  # P1–P6 inference pipeline
│   ├── requirements.txt
│   └── .env.example
├── frontend/                   # React 18 + Vite 5
│   ├── src/
│   │   ├── App.jsx             # Root — state, WebSocket, routing
│   │   ├── components/
│   │   │   ├── Header.jsx      # Help + Demo Bar controls
│   │   │   ├── SpotlightHelp.jsx   # Side-panel guided explainer
│   │   │   ├── DemoPresentationBar.jsx  # 9-stage narrative bar
│   │   │   └── views/
│   │   │       ├── DashboardView.jsx    # Executive dashboard + Bad Apple
│   │   │       ├── SecurityTestingView.jsx
│   │   │       └── IntelligenceCenterView.jsx
│   │   └── services/
│   │       ├── api.js          # All API calls
│   │       └── websocket.js    # WebSocket client
│   ├── public/
│   │   └── bad_apple.mp4      # Embedded attack visualizer
│   └── .env.example
├── models/
│   └── p6/                    # XGBoost CIC-IDS2017 classifier
│       ├── CyberOptRQ_P6_CIC2017_XGBoost_v1.pkl
│       └── metadata.json      # 97.30% acc · 0.9895 ROC-AUC · 0.0210 Brier
├── scripts/
│   ├── setup_sih_demo.ps1     # Install all dependencies
│   └── start_sih_demo.ps1     # One-command launch
└── README.md
```

---

## Model 6 (P6) — Verified Metrics

| Metric | Value | Source |
|---|---|---|
| Holdout Accuracy | **97.30%** | CIC-IDS2017 test split |
| ROC-AUC | **0.9895** | 14-class OvR |
| Brier Score (Calibration) | **0.0210** | Lower = better calibrated |
| Inference Speed | **>260,000 flows/sec** | Local CPU, no GPU |
| Training Data | **2.83M flows** | CIC-IDS2017 |
| Data Leakage Audit | **Ports removed** | `scripts/audit_p6_dataset.py` |

Model 6 is a **network evidence provider**, not the final EAL model.
The meta-model (P5) fuses P1–P6 into the financial risk score.

---

## Manual Commands (Alternative to Scripts)

```powershell
# Backend
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev

# Reset demo state
curl -X POST http://localhost:8000/api/v1/demo/attack/reset
```

---

## Security Checklist (Pre-Commit)

- ✅ `.env` files in `.gitignore`
- ✅ `.env.example` files contain only placeholder values
- ✅ No Supabase keys committed
- ✅ No Clerk secret keys committed
- ✅ No personal machine paths in source code
- ✅ `database/backup/root_snapshot.json` contains historical DB paths (data file, not source)

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Stable, reviewed builds only |
| `feature/bad-apple-sync` | Current SIH demo development |
| `feature/security-lab` | Security Lab features |
| `feature/supabase-saas` | Cloud/SaaS mode |

> **DO NOT merge to main before SIH review.**

---

*SIH 2026 · Problem Statement 26105 · CyberOpt-RQ Platform*
