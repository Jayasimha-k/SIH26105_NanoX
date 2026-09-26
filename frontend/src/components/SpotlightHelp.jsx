/**
 * SpotlightHelp.jsx  —  SIH 2026 Guided Explainer
 *
 * Visual Architecture (Bulletproof Chromium / Edge Portal Implementation):
 *  • createPortal(..., document.body) prevents clipping by parent overflow/transforms.
 *  • 9999px box-shadow cutout leaves target 100% visible & un-dimmed while smoothly
 *    dimming the surrounding dashboard:
 *      box-shadow: 0 0 0 9999px rgba(15,23,42,0.72), 0 0 28px ${accent}66, inset 0 0 12px ${accent}22
 *  • Continuous requestAnimationFrame loop tracks element bounding rect across scrolls,
 *    window resizes, attack HUD expansions, Bad Apple video mounting, and view transitions.
 *  • Dynamic adaptive panel placement (Right -> Left -> Bottom -> Top -> Floating) ensures
 *    the explanation panel NEVER covers or collides with the target element.
 *  • Animated target callout badge and dashed SVG connector line.
 *  • Clear z-index hierarchy:
 *      Backdrop (z: 1000) -> Cutout ring (z: 1100) -> SVG connector (z: 1150) -> Help Panel (z: 1200)
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  HelpCircle, X, ChevronRight, ChevronLeft, Shield, DollarSign,
  Activity, Layers, Sparkles, Info, CheckCircle2,
  Database, Lock, Cpu, Flame, Target, BookOpen
} from 'lucide-react';
import {
  getActiveDemoState,
} from '../services/demoState';

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC CATALOGUE — 15 verified topics, each with a real tab + real DOM target
// ─────────────────────────────────────────────────────────────────────────────
export const SPOTLIGHT_TOPICS = [
  {
    id: 'cyber_risk',
    tab: 'dashboard',
    target: '#spotlight-org-risk',
    title: 'Current Cyber Risk Score',
    category: 'Core Risk',
    icon: Shield,
    accent: '#F87171',
    roles: ['CISO', 'Security', 'SOC'],
    what: "CyberOptRQ's calibrated, organization-specific cyber risk score (0-100%), synthesized from structural telemetry and behavioral threat data.",
    why: "Raw technical alerts don't convey business impact. A Critical CVE on an isolated test machine carries low business risk; the same flaw on an internet-facing Kubernetes cluster is critical.",
    how: "The meta-model fuses NVD CVSS (P1), EPSS velocity (P2), organizational context (P3), attacker capability (P4), and network behavior (P6) into a calibrated financial risk metric.",
  },
  {
    id: 'risk_drivers',
    tab: 'dashboard',
    target: '#spotlight-risk-drivers',
    title: 'Top Risk Drivers',
    category: 'Explainability',
    icon: Flame,
    accent: '#FBBF24',
    roles: ['CISO', 'Security', 'SOC'],
    what: "The ranked, causal factors and telemetry anomalies driving the current enterprise risk score.",
    why: "Executives need transparent causality — not an opaque black-box prediction. Visible drivers prevent alert fatigue and inform prioritization.",
    how: "Computes feature attribution across assets, identifying unpatched CVEs, abnormal flow packet rates, or deficient control postures ranked by financial impact.",
  },
  {
    id: 'organization_data',
    tab: 'my_org',
    target: '#spotlight-org-data',
    fallbackTarget: '#org-data-btn',
    title: 'Organization Data & Context',
    category: 'Contextualization',
    icon: Database,
    accent: '#60A5FA',
    roles: ['CISO', 'Security', 'ALL'],
    what: "Enterprise baseline: asset inventory, technology stacks, exposure tiers, MFA/EDR coverage, and revenue dependence — the full organizational fingerprint.",
    why: "The exact same vulnerability creates completely different business risk across environments. Org posture de-biases universal threat feeds toward your specific exposure.",
    how: "Feeds P3 (Organizational Context) and scales Single Loss Expectancy (SLE) in EAL equations based on asset criticality and revenue dependency.",
  },
  {
    id: 'network_intelligence',
    tab: 'network_intel',
    target: '#spotlight-network-intel',
    title: 'Network Behavioral Intelligence',
    category: 'Telemetry',
    icon: Activity,
    accent: '#34D399',
    roles: ['SOC', 'Security', 'CISO'],
    what: "Real-time statistical evaluation of packet flows, connection durations, and protocol flag anomalies — without decrypting sensitive payloads.",
    why: "Pre-breach vulnerability scores become stale. Real network evidence confirms whether active scanning, brute-forcing, or exfiltration is actively underway.",
    how: "Monitors 56 flow features against trained benign vs. attack distributions, outputting an empirical maliciousness probability P(Malicious Flow).",
  },
  {
    id: 'model_6',
    tab: 'network_intel',
    target: '#spotlight-model-6-details',
    title: 'Model 6 — Network Classifier',
    category: 'Machine Learning',
    icon: Cpu,
    accent: '#A78BFA',
    roles: ['SOC', 'Security', 'CISO', 'ALL'],
    what: "CyberOptRQ_P6_CIC2017_XGBoost_v1: an XGBoost classifier trained on 2.83M CIC-IDS2017 network flows, detecting 14 attack classes.",
    why: "Provides verifiable, publication-grade inference (97.30% holdout accuracy, 0.9895 ROC-AUC, 0.0210 Brier calibration score) with strict data-leakage auditing.",
    how: "Runs 100% offline at >260,000 flows/sec, feeding real-time network anomaly probabilities into the Bayesian Fusion layer. Model 6 is the network evidence provider — not the final EAL model.",
  },
  {
    id: 'threat_intelligence',
    tab: 'threat_intel',
    target: '#spotlight-threat-intel',
    title: 'Threat Intelligence Pipeline',
    category: 'Intelligence',
    icon: Layers,
    accent: '#22D3EE',
    roles: ['CISO', 'SOC'],
    what: "Continuous aggregation of global threat feeds (CISA KEV, MITRE ATT&CK, NVD, EPSS) matched against enterprise asset configurations.",
    why: "Allows security leaders to anticipate emerging exploit campaigns before automated scanners touch corporate firewalls.",
    how: "Calculates weaponization velocity and maps adversary TTPs to local infrastructure assets using correlation engines.",
  },
  {
    id: 'newsletter_intelligence',
    tab: 'intelligence',
    target: '#spotlight-newsletter',
    title: 'Newsletter Intelligence Processing',
    category: 'Intelligence',
    icon: Info,
    accent: '#2DD4BF',
    roles: ['CISO', 'CFO', 'Security'],
    what: "Standard RFC 822 email parser ingesting industry advisories (e.g., SANS @RISK, Morning Brew) with SHA-256 cryptographic hashing.",
    why: "Zero data fabrication: extracts real CVEs, vendor advisories, and financial market alerts without hallucinating unverified claims.",
    how: "Performs entity extraction, matches affected products against the enterprise tech stack, and routes to human validation queues.",
  },
  {
    id: 'ciso_review',
    tab: 'intelligence',
    intelSubTab: 'ciso_queue',
    target: '#spotlight-ciso-review',
    title: 'CISO Human-in-the-Loop Gate',
    category: 'Governance',
    icon: Shield,
    accent: '#60A5FA',
    roles: ['CISO', 'Security'],
    what: "Mandatory executive validation workflow: CISO can CONFIRM, CORRECT, or REJECT incoming threat intelligence matches before they affect risk posture.",
    why: "Autonomous AI must never alter production risk postures without human review. This enforces strict governance and accountability.",
    how: "Upon confirmation, updates asset risk telemetry, records reviewer identity, and anchors the decision to an immutable audit record.",
  },
  {
    id: 'cfo_financial',
    tab: 'intelligence',
    intelSubTab: 'cfo_queue',
    target: '#spotlight-cfo-finance',
    title: 'CFO Financial Intelligence',
    category: 'Finance',
    icon: DollarSign,
    accent: '#34D399',
    roles: ['CFO', 'CISO'],
    what: "Enterprise exposure tracking combining macroeconomic intelligence, cloud vendor cost forecasts, and compliance risks.",
    why: "Translates technical vulnerability telemetry into board-level balance sheet implications and capital budget justification.",
    how: "Evaluates market forecasts against local vendor exposure. Flags unverified vendor estimates as OUTCOME_PENDING until realized.",
  },
  {
    id: 'eal',
    tab: 'dashboard',
    target: '#spotlight-financial-impact',
    title: 'Expected Annual Loss (EAL)',
    category: 'Quantification',
    icon: DollarSign,
    accent: '#4ADE80',
    roles: ['CFO', 'CISO'],
    what: "Financial quantification metric: EAL (INR) = Annual Rate of Occurrence x Single Loss Expectancy x Calibrated Exploit Probability.",
    why: "Replaces ambiguous Red/Yellow/Green risk matrices with mathematically sound financial exposure that boards and auditors understand.",
    how: "Dynamically recalculates Pre-EAL and Post-EAL, measuring the exact financial exposure averted by each deployed control.",
  },
  {
    id: 'optimizer',
    tab: 'dashboard',
    target: '#spotlight-optimizer',
    title: 'Investment Optimization (ROSI)',
    category: 'Prescriptive AI',
    icon: Sparkles,
    accent: '#FBBF24',
    roles: ['CFO', 'CISO', 'Security'],
    what: "Integer Linear Programming solver (PuLP) prescribing the mathematically optimal portfolio of security controls within a given budget.",
    why: "Security teams face hundreds of vulnerabilities with finite budgets. Ad-hoc remediation wastes capital on low-impact controls.",
    how: "Solves max Sum(DEAL - Cost) subject to Cost <= Budget, returning Return on Security Investment (ROSI %) and exact controls to deploy.",
  },
  {
    id: 'remediation',
    tab: 'execution',
    target: '#spotlight-remediation',
    title: 'Control Execution & Remediation',
    category: 'Operations',
    icon: Lock,
    accent: '#818CF8',
    roles: ['Security', 'CISO', 'SOC'],
    what: "Deployment workflow for approved prescriptive safeguards (e.g., Microsegmentation, EDR, Virtual Patching, IAM hardening).",
    why: "Closes the loop between strategic risk quantification and operational remediation, enforcing verified mitigation.",
    how: "Tracks deployment from PENDING to DEPLOYED, triggering automated post-control reassessment upon verification.",
  },
  {
    id: 'reassessment',
    tab: 'execution',
    target: '#spotlight-reassessment',
    title: 'Risk & EAL Reassessment',
    category: 'Continuous Validation',
    icon: CheckCircle2,
    accent: '#34D399',
    roles: ['CISO', 'CFO', 'Security'],
    what: "Automated recalculation showing verified risk delta (78% -> 96% -> 14%) and financial loss reduction (₹613.7L -> ₹63.3L / -84.0% loss reduction).",
    why: "Demonstrates tangible ROI on deployed security investments and verifies whether applied controls effectively neutralized the threat.",
    how: "Updates asset exposure multipliers and control efficacy scores, generating audit-ready compliance evidence for SEC/SEBI/CERT-In.",
  },
  {
    id: 'fabric_audit',
    tab: 'blockchain',
    target: '#spotlight-fabric-audit',
    title: 'Hyperledger Fabric Audit Trail',
    category: 'Integrity',
    icon: Layers,
    accent: '#60A5FA',
    roles: ['CISO', 'Security', 'ALL'],
    what: "Permissioned enterprise blockchain anchoring every risk assessment, CISO approval, and remediation lifecycle event.",
    why: "Provides tamper-proof legal and regulatory compliance evidence for SEC/SEBI/CERT-In audits that cannot be altered retroactively.",
    how: "Submits SHA-256 hashes to etcdraft consensus peer nodes; reliably buffers to local offline audit queue when peer containers are stopped.",
  },
  {
    id: 'attack_mode',
    tab: 'dashboard',
    target: '#spotlight-attack-mode',
    title: 'Synchronized Attack Mode & Bad Apple',
    category: 'Live Demo',
    icon: Flame,
    accent: '#F87171',
    roles: ['CISO', 'SOC', 'Security', 'ALL'],
    fallbackTarget: '#spotlight-org-risk',
    what: "Real-time demonstration mode triggered when the controlled Security Lab launches an active exploit. CyberOptRQ reacts with active telemetry, risk & EAL surges, and embedded Bad Apple visualizer playback.",
    why: "Shows how CyberOptRQ dynamically responds in seconds: risk surges, EAL spikes, and the affected asset is pinpointed.",
    how: "Listens for WebSocket ATTACK_STARTED events, updating Pre-EAL to ₹613.7 Lakhs (₹61,371,720) and highlighting the live threat pipeline.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Adaptive panel positioning (Never covers target)
// ─────────────────────────────────────────────────────────────────────────────
function computeLayout(rect) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const PANEL_W = 380;
  const MARGIN = 14;

  if (!rect) {
    return {
      placement: 'floating',
      panelStyle: {
        position: 'fixed',
        top: MARGIN,
        bottom: MARGIN,
        right: MARGIN,
        width: Math.min(PANEL_W, vw - MARGIN * 2),
        maxHeight: `calc(100vh - ${MARGIN * 2}px)`,
      },
      connector: null,
    };
  }

  const tTop = Math.max(0, rect.top - 6);
  const tBottom = Math.min(vh, rect.bottom + 6);
  const tLeft = Math.max(0, rect.left - 6);
  const tRight = Math.min(vw, rect.right + 6);

  const spaceRight = vw - tRight;
  const spaceLeft = tLeft;
  const spaceBottom = vh - tBottom;
  const spaceTop = tTop;

  // 1. Try placing on RIGHT if ample room
  if (spaceRight >= PANEL_W + MARGIN) {
    const panelTop = Math.max(MARGIN, Math.min(tTop, vh - 480));
    const panelHeight = Math.min(680, vh - panelTop - MARGIN);
    const connY = Math.min(Math.max(tTop + 24, panelTop + 36), tBottom - 16);
    return {
      placement: 'right',
      panelStyle: {
        position: 'fixed',
        left: Math.round(tRight + 14),
        top: Math.round(panelTop),
        width: PANEL_W,
        maxHeight: Math.round(panelHeight),
      },
      connector: {
        x1: tRight,
        y1: connY,
        x2: tRight + 14,
        y2: connY,
      }
    };
  }

  // 2. Try placing on LEFT if ample room
  if (spaceLeft >= PANEL_W + MARGIN) {
    const panelTop = Math.max(MARGIN, Math.min(tTop, vh - 480));
    const panelHeight = Math.min(680, vh - panelTop - MARGIN);
    const connY = Math.min(Math.max(tTop + 24, panelTop + 36), tBottom - 16);
    return {
      placement: 'left',
      panelStyle: {
        position: 'fixed',
        left: Math.round(tLeft - PANEL_W - 14),
        top: Math.round(panelTop),
        width: PANEL_W,
        maxHeight: Math.round(panelHeight),
      },
      connector: {
        x1: tLeft,
        y1: connY,
        x2: tLeft - 14,
        y2: connY,
      }
    };
  }

  // 3. For wide cards spanning most of width: Try placing BELOW
  if (spaceBottom >= 180) {
    const cardMidX = tLeft + rect.width / 2;
    const panelLeft = Math.max(MARGIN, Math.min(cardMidX - PANEL_W / 2, vw - PANEL_W - MARGIN));
    const panelHeight = Math.min(spaceBottom - MARGIN * 2, 480);
    const connX = Math.round(Math.max(tLeft + 30, Math.min(cardMidX, tRight - 30)));
    return {
      placement: 'bottom',
      panelStyle: {
        position: 'fixed',
        left: Math.round(panelLeft),
        top: Math.round(tBottom + 12),
        width: Math.min(PANEL_W, vw - MARGIN * 2),
        maxHeight: Math.round(panelHeight),
      },
      connector: {
        x1: connX,
        y1: tBottom,
        x2: connX,
        y2: tBottom + 12,
      }
    };
  }

  // 4. Try placing ABOVE
  if (spaceTop >= 180) {
    const cardMidX = tLeft + rect.width / 2;
    const panelLeft = Math.max(MARGIN, Math.min(cardMidX - PANEL_W / 2, vw - PANEL_W - MARGIN));
    const panelHeight = Math.min(spaceTop - MARGIN * 2, 480);
    const connX = Math.round(Math.max(tLeft + 30, Math.min(cardMidX, tRight - 30)));
    return {
      placement: 'top',
      panelStyle: {
        position: 'fixed',
        left: Math.round(panelLeft),
        bottom: Math.round(vh - tTop + 12),
        width: Math.min(PANEL_W, vw - MARGIN * 2),
        maxHeight: Math.round(panelHeight),
      },
      connector: {
        x1: connX,
        y1: tTop,
        x2: connX,
        y2: tTop - 12,
      }
    };
  }

  // 5. If space is tight vertically, place below or above without covering
  if (spaceBottom >= spaceTop) {
    const cardMidX = tLeft + rect.width / 2;
    const panelLeft = Math.max(MARGIN, Math.min(cardMidX - PANEL_W / 2, vw - PANEL_W - MARGIN));
    return {
      placement: 'bottom-compact',
      panelStyle: {
        position: 'fixed',
        left: Math.round(panelLeft),
        top: Math.round(tBottom + 10),
        width: Math.min(PANEL_W, vw - MARGIN * 2),
        maxHeight: Math.max(160, Math.round(spaceBottom - 16)),
      },
      connector: null,
    };
  } else {
    const cardMidX = tLeft + rect.width / 2;
    const panelLeft = Math.max(MARGIN, Math.min(cardMidX - PANEL_W / 2, vw - PANEL_W - MARGIN));
    return {
      placement: 'top-compact',
      panelStyle: {
        position: 'fixed',
        left: Math.round(panelLeft),
        bottom: Math.round(vh - tTop + 10),
        width: Math.min(PANEL_W, vw - MARGIN * 2),
        maxHeight: Math.max(160, Math.round(spaceTop - 16)),
      },
      connector: null,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Spotlight Cutout & Dimming (Undimmed Target + Dimmed Surrounding)
// ─────────────────────────────────────────────────────────────────────────────
function SpotlightCutout({ rect, accent, topicTitle, topicCategory }) {
  if (!rect) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.70)',
          zIndex: 1000,
          pointerEvents: 'none',
          transition: 'opacity 0.25s ease',
        }}
      />
    );
  }

  const PADDING = 6;
  const top = Math.round(rect.top - PADDING);
  const left = Math.round(rect.left - PADDING);
  const width = Math.round(rect.width + PADDING * 2);
  const height = Math.round(rect.height + PADDING * 2);

  return (
    <div
      style={{
        position: 'fixed',
        top,
        left,
        width,
        height,
        borderRadius: 14,
        border: `2.5px solid ${accent}`,
        /* 9999px box-shadow dims the entire dashboard outside this transparent cutout */
        boxShadow: `0 0 0 9999px rgba(15, 23, 42, 0.72), 0 0 28px ${accent}66, inset 0 0 14px ${accent}22`,
        zIndex: 1100,
        pointerEvents: 'none',
        animation: 'sihGlow 2.5s ease-in-out infinite',
        transition: 'top 0.12s ease-out, left 0.12s ease-out, width 0.12s ease-out, height 0.12s ease-out',
      }}
    >
      {/* Callout Focus Badge */}
      <div
        style={{
          position: 'absolute',
          top: -24,
          left: 8,
          background: accent,
          color: '#0F172A',
          fontSize: 9.5,
          fontWeight: 900,
          fontFamily: 'monospace',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '3px 9px',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0F172A', display: 'inline-block' }} />
        <span>{topicCategory}: {topicTitle}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Connector Line (Target -> Panel)
// ─────────────────────────────────────────────────────────────────────────────
function SpotlightConnector({ connector, accent }) {
  if (!connector) return null;
  const { x1, y1, x2, y2 } = connector;
  return (
    <svg
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1150,
        pointerEvents: 'none',
      }}
    >
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={accent}
        strokeWidth="2.5"
        strokeDasharray="4 3"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx={x1} cy={y1} r="4" fill={accent} />
      <circle cx={x2} cy={y2} r="4" fill={accent} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Development Debug Overlay
// ─────────────────────────────────────────────────────────────────────────────
function SpotlightDebug({ rect, panelStyle }) {
  const isDebug = typeof window !== 'undefined' && (window.__DEBUG_SPOTLIGHT__ || window.location.search.includes('debug=1'));
  if (!isDebug) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 12, left: 12, zIndex: 9999,
      background: 'rgba(2,6,23,0.92)', border: '1px solid #38BDF8',
      padding: '8px 12px', borderRadius: 8, fontSize: 10, fontFamily: 'monospace',
      color: '#38BDF8', pointerEvents: 'none', lineHeight: 1.5,
    }}>
      <div><strong>DEBUG_SPOTLIGHT=true</strong></div>
      <div>TARGET: x={Math.round(rect?.left || 0)} y={Math.round(rect?.top || 0)} w={Math.round(rect?.width || 0)} h={Math.round(rect?.height || 0)}</div>
      <div>PANEL: left={panelStyle?.left ?? 'auto'} top={panelStyle?.top ?? 'auto'} w={panelStyle?.width}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main SpotlightHelp Component
// ─────────────────────────────────────────────────────────────────────────────
export default function SpotlightHelp({
  isOpen,
  onClose,
  currentRole = 'CISO',
  activeTab,
  onNavigateTab,
  attackState = {},
  overview = {},
  pipeline = null,
  onRefresh,
}) {
  const [roleFilter, setRoleFilter] = useState(currentRole);
  const [idx, setIdx] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [resolving, setResolving] = useState(false);

  // Decouple navigation callback from render churn
  const onNavigateTabRef = useRef(onNavigateTab);
  onNavigateTabRef.current = onNavigateTab;
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  useEffect(() => { setRoleFilter(currentRole); }, [currentRole]);

  const activeDemo = getActiveDemoState(attackState);
  const isAttackActive = activeDemo.isAttackActive;
  const isAttackCompleted = activeDemo.isAttackCompleted;
  const activeCorrelation = attackState?.correlation_id || 'ATTACK-DEMO-2026';

  const topics = SPOTLIGHT_TOPICS.filter(t =>
    roleFilter === 'ALL' || t.roles.includes(roleFilter) || t.roles.includes('ALL')
  );
  const clampedIdx = Math.min(idx, Math.max(0, topics.length - 1));
  const rawTopic = topics[clampedIdx];

  const getDynamicTopic = (raw) => {
    if (!raw) return raw;
    const t = { ...raw };
    if (raw.id === 'cyber_risk') {
      if (isAttackActive) {
        t.title = `Current Cyber Risk (Attack Surge: ${activeDemo.riskScorePct})`;
        t.what = `ATTACK SURGE DETECTED: Enterprise risk jumped to ${activeDemo.riskScorePct} (+18 pts from baseline 78%) due to validated exploitation on ${activeDemo.targetAsset}. Fusion v2 combined Model 6 flow anomaly (${activeDemo.p6FlowAnomaly?.toFixed(3) || '0.960'}) with CVSS 9.8 and EPSS 0.94.`;
        t.why = 'Real-time threat validation elevates exposure from theoretical likelihood to active business crisis.';
        t.how = 'Bayesian Fusion layer v2 fused Model 6 network flow evidence with P1-P5 meta-ensemble risk score.';
      } else if (isAttackCompleted) {
        t.title = 'Current Cyber Risk (Post-Remediation: 14%)';
        t.what = 'NEUTRALIZED: Residual risk dropped to 14% (-82 pts from peak 96%) after Zero-Trust microsegmentation deployment. Capital preserved: ₹550.4 Lakhs (₹55,044,840).';
        t.why = 'Proves to the CISO, CFO, and Board that deployed controls prevented catastrophic breach exposure.';
        t.how = `Fabric audit block ${pipeline?.fabric_tx_id || 'FABRIC-MINED'} anchors the verifiable reassessment.`;
      }
    } else if (raw.id === 'eal') {
      if (isAttackActive) {
        t.title = `Expected Annual Loss (Surge: ${activeDemo.ealShortFormatted})`;
        t.what = `EAL SURGED TO ${activeDemo.ealFormatted.toUpperCase()} (${activeDemo.ealFullFormatted}): Baseline was ₹395.4 Lakhs (surge delta +₹218.3L / +55.2%). FAIR model recalculated Single Loss Expectancy across impacted assets.`;
      } else if (isAttackCompleted) {
        t.title = `Expected Annual Loss (Residual: ${activeDemo.ealShortFormatted})`;
        t.what = `RESIDUAL EAL: ${activeDemo.ealFormatted} (${activeDemo.ealFullFormatted}) post-control. 84.0% reduction in annualized financial risk verified.`;
      } else {
        t.title = 'Expected Annual Loss (EAL)';
        t.what = `Financial quantification metric: Baseline enterprise EAL is ${activeDemo.ealFormatted} (${activeDemo.ealFullFormatted}). FAIR model: EAL = ARO x SLE x Calibrated Exploit Probability.`;
      }
    } else if (raw.id === 'model_6') {
      if (isAttackActive) {
        t.title = `Model 6 Network Flow (Anomaly: ${activeDemo.p6FlowAnomaly?.toFixed(3) || '0.960'})`;
        t.what = `ANOMALY BURST: Model 6 empirical flow score spiked to ${activeDemo.p6FlowAnomaly?.toFixed(3) || '0.960'} malicious probability on ${activeDemo.targetAsset}. 100% offline local XGBoost classification on CIC-IDS2017.`;
      } else {
        t.title = 'Model 6 — Network Classifier';
        t.what = 'CyberOptRQ_P6_CIC2017_XGBoost_v1: XGBoost classifier trained on 2.83M CIC-IDS2017 network flows. Baseline flow anomaly is 0.040 (benign normal).';
      }
    } else if (raw.id === 'optimizer') {
      if (isAttackActive) {
        t.title = 'Emergency Investment Optimization';
        t.what = `CRITICAL CONTROL PRESCRIBED: PuLP solver prioritized ${activeDemo.controlRecommendation || 'Zero-Trust Microsegmentation'} with 465.8% ROSI to avert ₹550.4 Lakhs in active loss exposure.`;
      }
    } else if (raw.id === 'remediation') {
      if (isAttackActive) {
        t.title = 'Prescribed Control Deployment';
        t.what = `EMERGENCY MITIGATION: Execute ${activeDemo.controlRecommendation || 'Zero-Trust Microsegmentation & Network Isolation'} via Security Lab or Remediation controls to neutralize attack surge.`;
      } else if (isAttackCompleted) {
        t.title = 'Control Execution & Remediation (Verified)';
        t.what = 'VERIFIED DEPLOYED: Zero-Trust Microsegmentation & Network Isolation deployed and cryptographically anchored to Hyperledger Fabric.';
      }
    } else if (raw.id === 'attack_mode') {
      if (isAttackActive) {
        t.what = `SYNCHRONIZED ATTACK MODE: Active security demonstration ${activeCorrelation} in progress. Live telemetry streaming across the dashboard.`;
      }
    }
    return t;
  };

  const topic = getDynamicTopic(rawTopic);

  // ── Continuous RAF Target Tracking ───────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !topic) {
      setTargetRect(null);
      return;
    }

    let hasScrolled = false;
    let rafId;

    // Trigger tab navigation if needed
    if (topic.tab && topic.tab !== activeTabRef.current) {
      onNavigateTabRef.current(topic.tab);
    }

    // Trigger Intelligence Center sub-tab if needed
    if (topic.intelSubTab && topic.tab === 'intelligence') {
      setTimeout(() => {
        const subTabId = topic.intelSubTab;
        const targetBtn = document.getElementById(`tab-btn-${subTabId}`);
        if (targetBtn) {
          targetBtn.click();
        } else {
          const allBtns = document.querySelectorAll('button');
          for (const btn of allBtns) {
            const txt = btn.textContent || '';
            const wantCiso = subTabId === 'ciso_queue' && (txt.includes('CISO Review') || txt.includes('ciso_queue'));
            const wantCfo  = subTabId === 'cfo_queue'  && (txt.includes('CFO Review') || txt.includes('cfo_queue'));
            if (wantCiso || wantCfo) {
              btn.click();
              break;
            }
          }
        }
      }, 150);
    }

    const track = () => {
      const el = document.querySelector(topic.target) ||
                 (topic.fallbackTarget ? document.querySelector(topic.fallbackTarget) : null);

      if (el) {
        if (!hasScrolled) {
          const initRect = el.getBoundingClientRect();
          const isWide = initRect.width > (window.innerWidth - 450);
          el.scrollIntoView({ behavior: 'smooth', block: isWide ? 'start' : 'center', inline: 'nearest' });
          hasScrolled = true;
        }

        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setTargetRect(prev => {
            if (!prev ||
                Math.abs(prev.left - r.left) > 1 ||
                Math.abs(prev.top - r.top) > 1 ||
                Math.abs(prev.width - r.width) > 1 ||
                Math.abs(prev.height - r.height) > 1) {
              return {
                left: r.left,
                top: r.top,
                right: r.right,
                bottom: r.bottom,
                width: r.width,
                height: r.height,
              };
            }
            return prev;
          });
          setResolving(false);
          setUsedFallback(!document.querySelector(topic.target) && !!topic.fallbackTarget);
        }
      } else {
        setResolving(true);
      }

      rafId = requestAnimationFrame(track);
    };

    rafId = requestAnimationFrame(track);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, topic?.id, topic?.tab, topic?.target, topic?.intelSubTab, topic?.fallbackTarget]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, clampedIdx, topics.length]);

  const goNext = () => setIdx(i => (i < topics.length - 1 ? i + 1 : 0));
  const goPrev = () => setIdx(i => (i > 0 ? i - 1 : topics.length - 1));

  if (!isOpen || !topic) return null;

  const accent = topic.accent || '#60A5FA';
  const TopicIcon = topic.icon || HelpCircle;

  // Compute adaptive layout (never covers target)
  const layout = computeLayout(targetRect);

  const panelFullStyle = {
    ...layout.panelStyle,
    zIndex: 1200,
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(165deg, rgba(15,23,42,0.97) 0%, rgba(13,21,38,0.98) 100%)',
    boxShadow: `0 24px 70px rgba(0,0,0,0.65), 0 0 0 1px ${accent}33`,
    borderRadius: 18,
    border: `1px solid ${accent}44`,
    backdropFilter: 'blur(20px)',
    overflow: 'hidden',
    animation: 'sihPanelFade 0.28s cubic-bezier(0.16, 1, 0.3, 1) both',
  };

  const portalContent = (
    <>
      {/* Keyframe animations */}
      <style>{`
        [id^="spotlight-"], #org-data-btn {
          scroll-margin-top: 85px !important;
        }
        @keyframes sihGlow {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 9999px rgba(15,23,42,0.72), 0 0 28px ${accent}66, inset 0 0 12px ${accent}22; }
          50%      { opacity: 0.88; box-shadow: 0 0 0 9999px rgba(15,23,42,0.76), 0 0 42px ${accent}88, inset 0 0 20px ${accent}44; }
        }
        @keyframes sihPanelFade {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes sihFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Dimmed backdrop + transparent target cutout */}
      <SpotlightCutout
        rect={targetRect}
        accent={accent}
        topicTitle={topic.title}
        topicCategory={topic.category}
      />

      {/* Subtle dashed SVG connector from target to explanation panel */}
      <SpotlightConnector connector={layout.connector} accent={accent} />

      {/* Backdrop click catcher to dismiss */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 1000, cursor: 'default' }}
        onClick={onClose}
      />

      {/* ── Explanation Panel ────────────────────────────────────────────── */}
      <div
        id="spotlight-help-panel"
        data-testid="spotlight-help-panel"
        style={panelFullStyle}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '14px 18px 12px',
          borderBottom: `1px solid ${accent}22`,
          background: `linear-gradient(135deg, ${accent}12, transparent)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                padding: 6, background: `${accent}18`, border: `1px solid ${accent}44`,
                borderRadius: 8, color: accent, display: 'flex', alignItems: 'center',
              }}>
                <BookOpen size={13} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                  Guided Explainer
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <span style={{
                    fontSize: 8.5,
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    padding: '1px 5px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                    background: isAttackActive ? 'rgba(239, 68, 68, 0.25)' : (isAttackCompleted ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.2)'),
                    color: isAttackActive ? '#F87171' : (isAttackCompleted ? '#34D399' : '#93C5FD'),
                    border: isAttackActive ? '1px solid #EF4444' : (isAttackCompleted ? '1px solid #10B981' : '1px solid #3B82F6'),
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: isAttackActive ? '#EF4444' : (isAttackCompleted ? '#10B981' : '#3B82F6'), display: 'inline-block' }} />
                    {activeDemo.statusLabel}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              title="Close Help (Esc)"
              style={{
                padding: 6, borderRadius: 8,
                background: 'rgba(100,116,139,0.15)', border: '1px solid rgba(100,116,139,0.25)',
                color: '#94A3B8', cursor: 'pointer', display: 'flex',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#F87171'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(100,116,139,0.15)'; e.currentTarget.style.color = '#94A3B8'; }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Role filter pills */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {['CISO', 'CFO', 'Security', 'SOC', 'ALL'].map(r => (
              <button key={r}
                onClick={() => { setRoleFilter(r); setIdx(0); }}
                style={{
                  padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                  fontFamily: 'monospace', cursor: 'pointer', transition: 'all 0.2s',
                  background: roleFilter === r ? accent : 'rgba(30,41,59,0.8)',
                  color: roleFilter === r ? '#0F172A' : '#64748B',
                  border: roleFilter === r ? `1px solid ${accent}` : '1px solid rgba(100,116,139,0.2)',
                }}
              >{r}</button>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 0' }}
          key={`${topic.id}-${clampedIdx}`}>

          {/* Topic identity row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10,
            animation: 'sihFadeUp 0.28s ease both' }}>
            <div style={{
              padding: 9, background: `${accent}18`, border: `1px solid ${accent}44`,
              borderRadius: 10, color: accent, flexShrink: 0, display: 'flex',
            }}>
              <TopicIcon size={17} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 8, color: accent, fontWeight: 700, fontFamily: 'monospace',
                letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
                {topic.category}
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9', lineHeight: 1.3, margin: 0 }}>
                {topic.title}
              </h3>
            </div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#475569', flexShrink: 0, textAlign: 'right' }}>
              <span style={{ color: accent, fontWeight: 700, fontSize: 15 }}>{clampedIdx + 1}</span>
              <span style={{ color: '#475569' }}> / {topics.length}</span>
            </div>
          </div>

          {/* Target Status Bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', borderRadius: 8, marginBottom: 12,
            background: resolving ? 'rgba(30,41,59,0.6)' :
                        targetRect ? `${accent}0D` : 'rgba(30,41,59,0.6)',
            border: `1px solid ${resolving ? 'rgba(100,116,139,0.2)' :
                        targetRect ? accent + '33' : 'rgba(100,116,139,0.2)'}`,
            fontSize: 9, fontFamily: 'monospace',
            color: resolving ? '#64748B' : targetRect ? accent : '#64748B',
            animation: 'sihFadeUp 0.3s ease 0.05s both',
          }}>
            <Target size={9} />
            <span style={{ fontWeight: 700 }}>
              {resolving
                ? 'Navigating to target...'
                : targetRect
                  ? (usedFallback ? 'Showing fallback element (attack mode not active)' : 'Target highlighted on screen')
                  : 'Target not visible — navigate to it manually'}
            </span>
            <code style={{ marginLeft: 'auto', opacity: 0.55, fontSize: 8 }}>
              {topic.tab}
            </code>
          </div>

          {/* WHAT / WHY / HOW cards */}
          {[
            { label: 'What is this?', color: '#60A5FA', text: topic.what },
            { label: 'Why does it matter?', color: '#FBBF24', text: topic.why },
            { label: 'How does CyberOptRQ use it?', color: '#34D399', text: topic.how },
          ].map(({ label, color, text }, ci) => (
            <div key={label} style={{
              padding: '12px 14px', background: 'rgba(15,23,42,0.7)',
              border: '1px solid rgba(51,65,85,0.6)', borderRadius: 10, marginBottom: 8,
              animation: `sihFadeUp 0.32s ease ${0.07 + ci * 0.06}s both`,
            }}>
              <div style={{
                fontSize: 9, fontWeight: 800, color, fontFamily: 'monospace',
                letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ display: 'inline-block', width: 3, height: 10, background: color, borderRadius: 2 }} />
                {label}
              </div>
              <p style={{ fontSize: 11.5, color: '#CBD5E1', lineHeight: 1.65, margin: 0 }}>
                {text}
              </p>
            </div>
          ))}

          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 14, flexWrap: 'wrap', marginBottom: 8 }}>
            {topics.map((t, i) => (
              <button key={t.id} title={t.title}
                onClick={() => setIdx(i)}
                style={{
                  width: i === clampedIdx ? 18 : 6, height: 6, borderRadius: 3,
                  background: i === clampedIdx ? accent : 'rgba(100,116,139,0.3)',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginBottom: 12, fontSize: 9, color: '#475569', fontFamily: 'monospace' }}>
            ← → arrow keys · Esc to close
          </div>
        </div>

        {/* Footer nav */}
        <div style={{
          padding: '12px 18px',
          borderTop: `1px solid ${accent}22`,
          background: 'rgba(2,6,23,0.7)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <button onClick={onClose} style={{
            padding: '7px 13px', borderRadius: 8,
            background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(100,116,139,0.3)',
            color: '#64748B', fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#F1F5F9'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
          >CLOSE</button>

          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            <button onClick={goPrev} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '7px 13px', borderRadius: 8,
              background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(100,116,139,0.3)',
              color: '#CBD5E1', fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              <ChevronLeft size={13} /> PREV
            </button>
            <button onClick={goNext} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '7px 16px', borderRadius: 8,
              background: accent, border: `1px solid ${accent}`,
              color: '#0F172A', fontSize: 11, fontWeight: 800, fontFamily: 'monospace',
              cursor: 'pointer', boxShadow: `0 4px 14px ${accent}44`,
              transition: 'all 0.2s',
            }}>
              NEXT <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Debug Overlay */}
      <SpotlightDebug rect={targetRect} panelStyle={panelFullStyle} />
    </>
  );

  return createPortal(portalContent, document.body);
}
