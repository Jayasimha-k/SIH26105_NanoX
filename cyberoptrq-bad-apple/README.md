# CyberOptRQ Bad Apple Visualizer (`cyberoptrq-bad-apple`)

## Purpose
The **Bad Apple Visualizer** provides high-impact cinematic feedback during controlled, authorized attack demonstrations for SIH 26105. 

It is decoupled from customer production risk workflows:
- Customer production risk flows strictly from telemetry, vulnerabilities, and threat intelligence.
- Bad Apple visualizer is only invoked during authorized demonstrations via the `ATTACK_STARTED` event contract.

## Automatic Dashboard Synchronization Architecture
During demonstrations, the presenter does **NOT** need to switch tabs manually:

```
[ Security Lab / Attacker Console ]
                 │
                 ▼ (POST /api/v1/demo/attack/start)
      [ CyberOptRQ Backend ]
                 │
                 ▼ (WebSocket Broadcast & SSE / Polling Fallback)
                 │  Event: "ATTACK_STARTED"
                 │  Correlation ID: "ATTACK-DEMO-2026-001"
                 │
                 ▼
   [ CyberOptRQ Executive Dashboard ]
                 │
                 ├─► Enters ATTACK MODE HUD
                 ├─► Automatically embeds and plays Bad Apple Visualizer
                 ├─► Highlights targeted asset (e.g. ASSET-001)
                 ├─► Surges FAIR EAL from baseline to attack peak via real P1–P6 pipeline
                 └─► Displays 1-click Emergency Remediation button

When "Deploy Emergency Remediation" is clicked:
                 │
                 ▼ (POST /api/v1/demo/attack/complete)
                 ├─► Hyperledger Fabric mines audit block
                 ├─► Reassessment recalculates residual risk (83.8% reduction)
                 ├─► Dashboard transitions visualizer to remediated state
                 └─► Baseline restored upon Demo Reset
```

## Standalone Execution
The visualizer can also be run independently on port 5174:
```bash
# Served from bad-apple-visualizer/ or cyberoptrq-bad-apple/
npx serve bad-apple-visualizer -p 5174
```

## Repository Separation Roadmap
Post-SIH submission, this visualizer will be maintained in a dedicated public repository (`cyberoptrq-bad-apple`).
