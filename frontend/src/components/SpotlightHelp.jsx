/**
 * SpotlightHelp.jsx  —  SIH 2026 Guided Explainer
 *
 * Architecture:
 *  • Side panel (360 px, right edge) — dashboard stays fully visible
 *  • Cross-view navigation: navigates to the correct tab via onNavigateTab,
 *    then retries the DOM query until the element mounts (max ~1.5 s)
 *  • Scrolls the target into view, then measures its bounding rect
 *  • Animated glow ring on the actual target element
 *  • Panel side dynamically chosen (left / right) to avoid covering target
 *  • Zero auto-popup guarantee — isOpen=false until user clicks [ ? HELP ]
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  HelpCircle, X, ChevronRight, ChevronLeft, Shield, DollarSign,
  Activity, Layers, Sparkles, Info, CheckCircle2, Terminal,
  Database, Lock, Cpu, Flame, Film, Target, BookOpen
} from 'lucide-react';
import {
  CANONICAL_DEMO_STATE,
  getActiveDemoState,
  formatLakhs,
  formatShortLakhs,
  formatFullInr
} from '../services/demoState';

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC CATALOGUE — 15 verified topics, each with a real tab + real DOM id
// ─────────────────────────────────────────────────────────────────────────────
// Tab IDs must match exactly the case labels in App.jsx renderActiveView()
// IntelligenceCenter topics that require a sub-tab are handled by intelSubTab
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
    target: '#org-data-btn',
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
    // NOTE: this element is CONDITIONALLY rendered only when attackState.active=true
    // When attack is NOT active, we fall back gracefully to spotlight the org-risk card
    fallbackTarget: '#spotlight-org-risk',
    what: "Real-time demonstration mode triggered when the controlled Security Lab launches an active exploit. CyberOptRQ reacts with active telemetry, risk & EAL surges, and embedded Bad Apple visualizer playback.",
    why: "Shows how CyberOptRQ dynamically responds in seconds: risk surges, EAL spikes, and the affected asset is pinpointed.",
    how: "Listens for WebSocket ATTACK_STARTED events, updating Pre-EAL to ₹613.7 Lakhs (₹61,371,720) and highlighting the live threat pipeline.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DOM target resolver with retry + scroll
// ─────────────────────────────────────────────────────────────────────────────
function resolveTarget(selector, fallback, onFound, onFailed, maxMs = 1600) {
  const deadline = Date.now() + maxMs;
  let rafId;

  const attempt = () => {
    let el = document.querySelector(selector);
    if (!el && fallback) {
      el = document.querySelector(fallback);
    }
    if (el) {
      // scroll into center of viewport
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      // wait for scroll animation, then measure
      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        onFound({ el, rect, usedFallback: !document.querySelector(selector) });
      }, 320);
      return;
    }
    if (Date.now() < deadline) {
      rafId = requestAnimationFrame(attempt);
    } else {
      onFailed(`Target not found: ${selector}`);
    }
  };

  rafId = requestAnimationFrame(attempt);
  return () => cancelAnimationFrame(rafId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Spotlight glow overlay
// ─────────────────────────────────────────────────────────────────────────────
function SpotlightRing({ rect, accent, panelOnRight }) {
  if (!rect) return null;

  // Sidebar width ~256px, header ~64px
  const SIDEBAR_W = 256;
  const HEADER_H = 64;
  const MARGIN = 10;

  const safeTop = Math.max(rect.top, HEADER_H + MARGIN);
  const safeLeft = Math.max(rect.left, SIDEBAR_W + MARGIN);
  const safeWidth = rect.width;
  const safeHeight = rect.bottom - safeTop;

  return (
    <>
      {/* Dim overlay with punch-out */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none',
          background: 'rgba(2,6,23,0.52)',
          maskImage: `radial-gradient(ellipse ${safeWidth + 80}px ${safeHeight + 80}px at ${safeLeft + safeWidth / 2}px ${safeTop + safeHeight / 2}px, transparent 50%, rgba(0,0,0,0.6) 75%, rgba(0,0,0,0.52) 100%)`,
          WebkitMaskImage: `radial-gradient(ellipse ${safeWidth + 80}px ${safeHeight + 80}px at ${safeLeft + safeWidth / 2}px ${safeTop + safeHeight / 2}px, transparent 50%, rgba(0,0,0,0.6) 75%, rgba(0,0,0,0.52) 100%)`,
        }}
      />
      {/* Glow ring */}
      <div
        style={{
          position: 'fixed', zIndex: 1001, pointerEvents: 'none',
          top: safeTop - 6,
          left: safeLeft - 6,
          width: safeWidth + 12,
          height: safeHeight + 12,
          borderRadius: 12,
          border: `2px solid ${accent}`,
          boxShadow: `0 0 0 4px ${accent}18, 0 0 28px ${accent}44`,
          animation: 'sihGlow 2.5s ease-in-out infinite',
        }}
      >
        <div style={{
          position: 'absolute', top: -20, left: 8,
          background: accent, color: '#0F172A',
          fontSize: 9, fontWeight: 900, fontFamily: 'monospace',
          letterSpacing: '0.12em', textTransform: 'uppercase',
          padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap',
        }}>
          ▶ Inspecting
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
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
  const [panelOnRight, setPanelOnRight] = useState(true);
  const cleanupRef = useRef(null);

  // Keep role filter in sync
  useEffect(() => { setRoleFilter(currentRole); }, [currentRole]);

  const activeDemo = getActiveDemoState(attackState);
  const isAttackActive = activeDemo.isAttackActive;
  const isAttackCompleted = activeDemo.isAttackCompleted;
  const activeRisk = activeDemo.riskScorePct;
  const activeEal = activeDemo.ealFormatted;
  const activeAsset = activeDemo.targetAsset;
  const activeCorrelation = attackState?.correlation_id || 'ATTACK-DEMO-2026';

  const topics = SPOTLIGHT_TOPICS.filter(t =>
    roleFilter === 'ALL' || t.roles.includes(roleFilter) || t.roles.includes('ALL')
  );
  const clampedIdx = Math.min(idx, topics.length - 1);
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
    } else if (raw.id === 'bad_apple') {
      if (isAttackActive) {
        t.what = 'BAD APPLE VISUALIZER: Embedded high-contrast visualizer playing in sync with live attack telemetry to give an immediate, unmistakable presentation cue.';
      }
    }
    return t;
  };

  const topic = getDynamicTopic(rawTopic);

  // ── Resolve target whenever topic or open state changes ──────────────────
  const resolveCurrentTarget = useCallback(() => {
    if (!isOpen || !topic) return;

    // Clean up previous resolve attempt
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
    setTargetRect(null);
    setUsedFallback(false);
    setResolving(true);

    // 1. Navigate to the required tab
    if (topic.tab && topic.tab !== activeTab) {
      onNavigateTab(topic.tab);
    }

    // 2. If the topic needs an Intelligence Center sub-tab, we need to wait
    //    for mount then click the sub-tab button
    const needsIntelSubTab = topic.intelSubTab && topic.tab === 'intelligence';

    const doResolve = () => {
      cleanupRef.current = resolveTarget(
        topic.target,
        topic.fallbackTarget || null,
        ({ el, rect, usedFallback: uf }) => {
          setUsedFallback(uf);
          setResolving(false);
          setTargetRect(rect);
          // Decide panel side: if target is on right half of viewport, put panel on left
          const midScreen = window.innerWidth / 2;
          setPanelOnRight(rect.left + rect.width / 2 < midScreen);
        },
        () => {
          setResolving(false);
          setTargetRect(null);
        },
        1600
      );
    };

    if (needsIntelSubTab) {
      setTimeout(() => {
        const subTabId = topic.intelSubTab;
        const targetBtn = document.getElementById(`tab-btn-${subTabId}`);
        if (targetBtn) {
          targetBtn.click();
        } else {
          const allBtns = document.querySelectorAll('button');
          for (const btn of allBtns) {
            const txt = btn.textContent || '';
            const wantCiso = topic.intelSubTab === 'ciso_queue' && (txt.includes('CISO Review') || txt.includes('ciso_queue'));
            const wantCfo  = topic.intelSubTab === 'cfo_queue'  && (txt.includes('CFO Review') || txt.includes('cfo_queue'));
            if (wantCiso || wantCfo) {
              btn.click();
              break;
            }
          }
        }
        setTimeout(doResolve, 250);
      }, 500);
    } else {
      setTimeout(doResolve, topic.tab !== activeTab ? 450 : 80);
    }
  }, [isOpen, topic, activeTab, onNavigateTab]);

  useEffect(() => {
    resolveCurrentTarget();
    return () => { if (cleanupRef.current) cleanupRef.current(); };
  }, [resolveCurrentTarget]);

  // Re-measure on scroll or resize with ResizeObserver for dynamic layout shifts
  useEffect(() => {
    if (!isOpen) return;
    const handle = () => {
      if (!topic) return;
      const el = document.querySelector(topic.target) ||
                 (topic.fallbackTarget ? document.querySelector(topic.fallbackTarget) : null);
      if (el) {
        const r = el.getBoundingClientRect();
        setTargetRect(r);
        setPanelOnRight(r.left + r.width / 2 < window.innerWidth / 2);
      }
    };
    window.addEventListener('scroll', handle, true);
    window.addEventListener('resize', handle);

    let observer = null;
    try {
      observer = new ResizeObserver(handle);
      observer.observe(document.body);
    } catch (e) {}

    return () => {
      window.removeEventListener('scroll', handle, true);
      window.removeEventListener('resize', handle);
      if (observer) observer.disconnect();
    };
  }, [isOpen, topic]);

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
  const PANEL_W = 350;

  const panelStyle = {
    position: 'fixed',
    top: 0, bottom: 0,
    width: PANEL_W,
    zIndex: 1100,
    display: 'flex', flexDirection: 'column',
    background: 'linear-gradient(160deg,#0F172A 0%,#0D1526 100%)',
    boxShadow: panelOnRight
      ? `-24px 0 80px rgba(0,0,0,0.55), -1px 0 0 ${accent}22`
      : `24px 0 80px rgba(0,0,0,0.55), 1px 0 0 ${accent}22`,
    borderLeft:  panelOnRight ? `1px solid ${accent}33` : 'none',
    borderRight: panelOnRight ? 'none' : `1px solid ${accent}33`,
    ...(panelOnRight ? { right: 0 } : { left: 0 }),
    animation: panelOnRight
      ? 'sihSlideRight 0.36s cubic-bezier(0.34,1.2,0.64,1) both'
      : 'sihSlideLeft 0.36s cubic-bezier(0.34,1.2,0.64,1) both',
  };

  return (
    <>
      {/* Global keyframes */}
      <style>{`
        @keyframes sihGlow {
          0%,100% { opacity:1; box-shadow:0 0 0 4px ${accent}18,0 0 28px ${accent}44; }
          50%      { opacity:.88; box-shadow:0 0 0 7px ${accent}0D,0 0 42px ${accent}55; }
        }
        @keyframes sihSlideRight {
          from { transform:translateX(100%); opacity:0; }
          to   { transform:translateX(0); opacity:1; }
        }
        @keyframes sihSlideLeft {
          from { transform:translateX(-100%); opacity:0; }
          to   { transform:translateX(0); opacity:1; }
        }
        @keyframes sihFadeUp {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      {/* Spotlight ring + dim layer */}
      <SpotlightRing rect={targetRect} accent={accent} panelOnRight={panelOnRight} />

      {/* Click backdrop to close */}
      <div
        style={{ position:'fixed', inset:0, zIndex:1002, cursor:'default' }}
        onClick={onClose}
      />

      {/* ── Side panel ─────────────────────────────────────────────────── */}
      <div id="spotlight-help-panel" data-testid="spotlight-help-panel" style={panelStyle} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding:'14px 18px 12px',
          borderBottom:`1px solid ${accent}22`,
          background:`linear-gradient(135deg,${accent}08,transparent)`,
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{
                padding:6, background:`${accent}18`, border:`1px solid ${accent}44`,
                borderRadius:8, color:accent, display:'flex', alignItems:'center',
              }}>
                <BookOpen size={13} />
              </div>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'monospace' }}>
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
                padding:6, borderRadius:8,
                background:'rgba(100,116,139,0.15)', border:'1px solid rgba(100,116,139,0.25)',
                color:'#94A3B8', cursor:'pointer', display:'flex',
                transition:'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.15)'; e.currentTarget.style.color='#F87171'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(100,116,139,0.15)'; e.currentTarget.style.color='#94A3B8'; }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Role filter pills */}
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {['CISO','CFO','Security','SOC','ALL'].map(r => (
              <button key={r}
                onClick={() => { setRoleFilter(r); setIdx(0); }}
                style={{
                  padding:'3px 9px', borderRadius:20, fontSize:10, fontWeight:700,
                  fontFamily:'monospace', cursor:'pointer', transition:'all 0.2s',
                  background: roleFilter===r ? accent : 'rgba(30,41,59,0.8)',
                  color: roleFilter===r ? '#0F172A' : '#64748B',
                  border: roleFilter===r ? `1px solid ${accent}` : '1px solid rgba(100,116,139,0.2)',
                }}
              >{r}</button>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex:1, overflowY:'auto', padding:'18px 18px 0' }}
          key={`${topic.id}-${clampedIdx}`}>

          {/* Topic identity row */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10,
            animation:'sihFadeUp 0.28s ease both' }}>
            <div style={{
              padding:9, background:`${accent}18`, border:`1px solid ${accent}44`,
              borderRadius:10, color:accent, flexShrink:0, display:'flex',
            }}>
              <TopicIcon size={17} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:8, color:accent, fontWeight:700, fontFamily:'monospace',
                letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:2 }}>
                {topic.category}
              </div>
              <h3 style={{ fontSize:14, fontWeight:800, color:'#F1F5F9', lineHeight:1.3, margin:0 }}>
                {topic.title}
              </h3>
            </div>
            <div style={{ fontSize:11, fontFamily:'monospace', color:'#475569', flexShrink:0, textAlign:'right' }}>
              <span style={{ color:accent, fontWeight:700, fontSize:15 }}>{clampedIdx+1}</span>
              <span style={{ color:'#475569' }}> / {topics.length}</span>
            </div>
          </div>

          {/* Target status */}
          <div style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'5px 10px', borderRadius:8, marginBottom:12,
            background: resolving ? 'rgba(30,41,59,0.6)' :
                        targetRect ? `${accent}0D` : 'rgba(30,41,59,0.6)',
            border: `1px solid ${resolving ? 'rgba(100,116,139,0.2)' :
                        targetRect ? accent+'33' : 'rgba(100,116,139,0.2)'}`,
            fontSize:9, fontFamily:'monospace',
            color: resolving ? '#64748B' : targetRect ? accent : '#64748B',
            animation:'sihFadeUp 0.3s ease 0.05s both',
          }}>
            <Target size={9} />
            <span style={{ fontWeight:700 }}>
              {resolving
                ? 'Navigating to target...'
                : targetRect
                  ? (usedFallback ? 'Showing fallback element (attack mode not active)' : 'Target highlighted on screen')
                  : 'Target not visible — navigate to it manually'}
            </span>
            <code style={{ marginLeft:'auto', opacity:0.55, fontSize:8 }}>
              {topic.tab}
            </code>
          </div>

          {/* WHAT / WHY / HOW cards */}
          {[
            { label:'What is this?', color:'#60A5FA', text: topic.what },
            { label:'Why does it matter?', color:'#FBBF24', text: topic.why },
            { label:'How does CyberOptRQ use it?', color:'#34D399', text: topic.how },
          ].map(({ label, color, text }, ci) => (
            <div key={label} style={{
              padding:'12px 14px', background:'rgba(15,23,42,0.7)',
              border:'1px solid rgba(51,65,85,0.6)', borderRadius:10, marginBottom:8,
              animation:`sihFadeUp 0.32s ease ${0.07 + ci*0.06}s both`,
            }}>
              <div style={{
                fontSize:9, fontWeight:800, color, fontFamily:'monospace',
                letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6,
                display:'flex', alignItems:'center', gap:5,
              }}>
                <span style={{ display:'inline-block', width:3, height:10, background:color, borderRadius:2 }} />
                {label}
              </div>
              <p style={{ fontSize:11.5, color:'#CBD5E1', lineHeight:1.65, margin:0 }}>
                {text}
              </p>
            </div>
          ))}


          {/* Progress dots */}
          <div style={{ display:'flex', justifyContent:'center', gap:5, marginTop:16, flexWrap:'wrap', marginBottom:10 }}>
            {topics.map((t, i) => (
              <button key={t.id} title={t.title}
                onClick={() => setIdx(i)}
                style={{
                  width: i===clampedIdx ? 18 : 6, height:6, borderRadius:3,
                  background: i===clampedIdx ? accent : 'rgba(100,116,139,0.3)',
                  border:'none', cursor:'pointer', padding:0,
                  transition:'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              />
            ))}
          </div>
          <div style={{ textAlign:'center', marginBottom:14, fontSize:9, color:'#374151', fontFamily:'monospace' }}>
            ← → arrow keys · Esc to close
          </div>
        </div>

        {/* Footer nav */}
        <div style={{
          padding:'12px 18px',
          borderTop:`1px solid ${accent}22`,
          background:'rgba(2,6,23,0.6)',
          display:'flex', alignItems:'center', gap:8,
        }}>
          <button onClick={onClose} style={{
            padding:'7px 13px', borderRadius:8,
            background:'rgba(30,41,59,0.8)', border:'1px solid rgba(100,116,139,0.3)',
            color:'#64748B', fontSize:11, fontWeight:700, fontFamily:'monospace',
            cursor:'pointer', transition:'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color='#F1F5F9'}
            onMouseLeave={e => e.currentTarget.style.color='#64748B'}
          >CLOSE</button>

          <div style={{ display:'flex', gap:6, marginLeft:'auto' }}>
            <button onClick={goPrev} style={{
              display:'flex', alignItems:'center', gap:4,
              padding:'7px 13px', borderRadius:8,
              background:'rgba(30,41,59,0.8)', border:'1px solid rgba(100,116,139,0.3)',
              color:'#CBD5E1', fontSize:11, fontWeight:700, fontFamily:'monospace',
              cursor:'pointer', transition:'all 0.2s',
            }}>
              <ChevronLeft size={13} /> PREV
            </button>
            <button onClick={goNext} style={{
              display:'flex', alignItems:'center', gap:4,
              padding:'7px 16px', borderRadius:8,
              background: accent, border:`1px solid ${accent}`,
              color:'#0F172A', fontSize:11, fontWeight:800, fontFamily:'monospace',
              cursor:'pointer', boxShadow:`0 4px 14px ${accent}44`,
              transition:'all 0.2s',
            }}>
              NEXT <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
