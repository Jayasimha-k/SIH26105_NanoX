# CyberOptRQ Security Lab (`cyberoptrq-security-lab`)

## Architectural Overview
The **Security Lab** is the authorized testing and telemetry generation engine for CyberOptRQ. It is strictly isolated from the public marketing website and operates under cryptographic scope constraints.

In production and SIH demonstrations:
- It **never** attacks arbitrary external websites or infrastructure.
- Every test requires an **Authorized Target**, an **Authorized Scope**, a **Scenario Definition**, and generates a unique **Correlation ID** (e.g. `ATTACK-DEMO-2026-001`).
- Telemetry flows to the CyberOptRQ backend, triggering real-time risk recalculation through models P1–P6, Fusion v2, and FAIR EAL.

## Event Contract

### 1. `ATTACK_STARTED`
Dispatched when an authorized simulation begins:
```json
{
  "event": "ATTACK_STARTED",
  "correlation_id": "ATTACK-DEMO-2026-001",
  "organization_id": "org_abc_tech",
  "asset_id": "ASSET-001",
  "scenario": "cve_2024_21626_rce",
  "scope": "localhost:8000,10.0.1.50,ASSET-001",
  "timestamp": "2026-09-25T14:30:00Z"
}
```

### 2. `ATTACK_COMPLETED` / `REMEDIATED`
Dispatched when emergency remediation is applied or the scenario completes:
```json
{
  "event": "ATTACK_COMPLETED",
  "correlation_id": "ATTACK-DEMO-2026-001",
  "status": "REMEDIATED",
  "timestamp": "2026-09-25T14:32:00Z"
}
```

### 3. `DEMO_RESET`
Restores all risk states, EAL values, and visualizers to baseline IDLE.

## Strix Integration Policy
- Scanner integration via `integrations/strix_adapter.py` and `backend/app/api/routers/security_testing.py`.
- Enforces strict whitelisting of private lab environments and customer-verified inventory.
- Proof-of-concept findings populate real vulnerability records in the Supabase/PostgreSQL schema.

## Repository Separation Roadmap
Post-SIH submission, this folder will be extracted into a standalone GitHub repository (`cyberoptrq-security-lab`). During the SIH phase, it lives as a modular package within the existing repository to guarantee SIH demo stability.
