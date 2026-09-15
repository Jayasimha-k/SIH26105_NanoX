# CyberOpt-RQ Platform

CyberOpt-RQ is a full-stack, production-style platform for **AI-powered continuous cyber-risk quantification and security-investment optimization**.

---

## Key System Features

1. **Plug-and-Play ML Orchestrator (`backend/models_artifacts/`)**:
   - Supports **4 base models + 1 meta-model**.
   - Standardized `metadata.json` contract for input features, output formats, and performance metrics.
   - Standardized `BaseModelAdapter` interface: ML team can drop in trained `model.pkl` / `model.joblib` artifacts with **zero changes to the frontend** and minimal/no changes to the core backend.
2. **Quantitative Risk Engine (`backend/app/services/risk_engine.py`)**:
   - Calculates **Expected Annual Loss (EAL)**: $\text{EAL}_{\text{pre}} = P_{\text{exploit}} \times \text{Financial Impact}$.
   - Calculates **Post-Control EAL**: $\text{EAL}_{\text{post}} = \text{EAL}_{\text{pre}} \times \prod (1 - \text{Effectiveness}_i)$.
   - Calculates **Expected Risk Reduction** and **Return on Security Investment (ROSI)**.
3. **PuLP Optimization Engine (`backend/app/services/optimizer.py`)**:
   - 0-1 Integer Linear Program (ILP) solver finding the optimal combination of controls within budget ceilings.
   - Interactive threshold slider and dependency enforcement rules.
4. **What-If Sensitivity Analysis**:
   - Dynamic threat surge multipliers and active control toggles for instant risk recalculation.
5. **Cryptographic Blockchain Audit Ledger (`backend/app/services/ledger.py`)**:
   - SHA-256 block-chaining engine recording recommendation decisions, CISO approvals, IT execution, and verification steps.
   - Built-in tamper verification tool.
6. **Real-Time WebSockets (`backend/app/services/websocket_manager.py`)**:
   - Event pub/sub broadcasting live updates (`CONTROL_APPROVED`, `EXECUTION_UPDATED`, `VERIFICATION_COMPLETED`) across CISO, SOC, and IT clients.
7. **Complete Dark-Theme React Dashboard (`frontend/`)**:
   - 18 view modules including Executive Dashboard, Vulnerabilities, Assets, AI Predictions, Financial Risk, Controls, PuLP Optimizer, What-If Analysis, Recommendations, CISO Approvals, Real-Time Stream, IT Implementation Tracking, Blockchain Ledger Explorer, Model Performance, and Plug & Play Configuration.

---

## Directory Structure

```text
SIH/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entrypoint
│   │   ├── config.py                # System settings & environment variables
│   │   ├── database.py              # SQLite/PostgreSQL SQLAlchemy session
│   │   ├── models/db_models.py      # ORM Models (User, Asset, Vuln, Control, AuditBlock...)
│   │   ├── schemas/schemas.py       # Pydantic request/response validation
│   │   ├── ml/
│   │   │   ├── adapter.py           # Plug-and-Play ModelAdapter driver
│   │   │   └── orchestrator.py      # 2-stage ML pipeline orchestrator
│   │   ├── services/
│   │   │   ├── risk_engine.py       # EAL & ROSI calculation engine
│   │   │   ├── optimizer.py         # PuLP ILP solver
│   │   │   ├── ledger.py            # SHA-256 blockchain audit service
│   │   │   └── websocket_manager.py # Real-time event broadcaster
│   │   ├── api/routers/             # API v1 route endpoints
│   │   └── seed.py                  # Seed script for initial demo data
│   ├── models_artifacts/            # Plug-and-Play trained model folders
│   │   ├── model_1/ (metadata.json, model.pkl)
│   │   ├── model_2/ (metadata.json, model.pkl)
│   │   ├── model_3/ (metadata.json, model.pkl)
│   │   ├── model_4/ (metadata.json, model.pkl)
│   │   └── meta_model/ (metadata.json, model.pkl)
│   ├── requirements.txt
│   ├── run.py
│   └── test_verification.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── views/               # All 18 module view components
│   │   ├── services/                # API and WebSocket client helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Quick Start Guide

### 1. Run the Backend API Server
```bash
cd backend
pip install -r requirements.txt
python run.py
```
*Backend runs on `http://localhost:8000` (OpenAPI Docs at `http://localhost:8000/docs`).*

### 2. Run the React Frontend Application
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## How to Plug In Trained Models Later

Tell your ML team to place their trained binary model artifacts (`model.pkl` or `model.joblib`) into `backend/models_artifacts/model_1`, `model_2`, `model_3`, `model_4`, and `meta_model` along with an updated `metadata.json`.

The backend automatically loads the binary models and executes inference without requiring any frontend or core backend changes!
