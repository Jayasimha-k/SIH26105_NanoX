import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  HelpCircle, X, ChevronRight, ChevronLeft, Shield, DollarSign,
  Activity, Layers, Sparkles, Info, CheckCircle2, Terminal,
  Database, Lock, Cpu, Flame, Film, Target, BookOpen
} from 'lucide-react';

/**
 * 18 Verified Spotlight Explanations — WHAT / WHY / HOW structure.
 * Each topic maps to a real DOM ID on the dashboard.
 */
export const SPOTLIGHT_TOPICS = [
  {
    id: 'cyber_risk',
    targetSelector: '#spotlight-org-risk',
    fallbackTab: 'dashboard',
    title: 'Current Cyber Risk',
    category: 'Core Risk',
    roles: ['CISO', 'Security', 'SOC'],
    icon: Shield,
    accent: '#F87171',          // red-400
    accentBg: 'rgba(248,113,113,0.08)',
    what: "CyberOptRQ's calibrated, organization-specific cyber risk score (0\u201390%), synthesized from structural telemetry and behavioral threat data.",
    why: "Raw technical alerts don't convey business impact. A Critical CVE on an isolated test machine carries low business risk; the same flaw on an internet-facing Kubernetes cluster is critical.",
    how: "The meta-model fuses NVD CVSS (P1), EPSS velocity (P2), organizational context (P3), attacker capability (P4), and network behavior (P6) into a calibrated financial risk metric."
  },
  {
    id: 'risk_drivers',
    targetSelector: '#spotlight-risk-drivers',
    fallbackTab: 'dashboard',
    title: 'Top Risk Drivers',
    category: 'Explainability',
    roles: ['CISO', 'Security', 'SOC'],
    icon: Flame,
    accent: '#FBBF24',
    accentBg: 'rgba(251,191,36,0.08)',
    what: "The ranked, causal factors and telemetry anomalies driving the current enterprise risk score.",
    why: "Executives and engineers need transparent causality \u2014 not an opaque black-box prediction. Visible drivers prevent alert fatigue and inform prioritization.",
    how: "Computes feature attribution across assets, identifying unpatched CVEs, abnormal flow packet rates, or deficient control postures ranked by financial impact."
  },
  {
    id: 'organization_data',
    targetSelector: '#org-data-btn',
    fallbackTab: 'dashboard',
    title: 'Organization Data & Context',
    category: 'Contextualization',
    roles: ['CISO', 'Security', 'Admin'],
    icon: Database,
    accent: '#60A5FA',
    accentBg: 'rgba(96,165,250,0.08)',
    what: "Enterprise baseline: asset inventory, technology stacks, exposure tiers, MFA/EDR coverage, and revenue dependence \u2014 the full organizational fingerprint.",
    why: "The exact same vulnerability creates completely different business risk across environments. Org posture de-biases universal threat feeds toward your specific exposure.",
    how: "Feeds P3 (Organizational Context) and scales Single Loss Expectancy (SLE) in EAL equations based on asset criticality and revenue dependency."
  },
  {
    id: 'network_intelligence',
    targetSelector: '#spotlight-network-intel',
    fallbackTab: 'dashboard',
    title: 'Network Behavioral Intelligence',
    category: 'Telemetry',
    roles: ['SOC', 'Security', 'CISO'],
    icon: Activity,
    accent: '#34D399',
    accentBg: 'rgba(52,211,153,0.08)',
    what: "Real-time statistical evaluation of packet flows, connection durations, and protocol flag anomalies \u2014 without decrypting sensitive payloads.",
    why: "Pre-breach vulnerability scores become stale. Real network evidence confirms whether active scanning, brute-forcing, or exfiltration is actively underway.",
    how: "Monitors 56 flow features against trained benign vs. attack distributions, outputting an empirical maliciousness probability P(Malicious Flow)."
  },
  {
    id: 'model_6',
    targetSelector: '#spotlight-model-6-details',
    fallbackTab: 'dashboard',
    title: 'Model 6 — Network Classifier',
    category: 'Machine Learning',
    roles: ['SOC', 'Security', 'Admin'],
    icon: Cpu,
    accent: '#A78BFA',
    accentBg: 'rgba(167,139,250,0.08)',
    what: "CyberOptRQ_P6_CIC2017_XGBoost_v1: an XGBoost classifier trained on 2.83M CIC-IDS2017 network flows, detecting 14 attack classes.",
    why: "Provides verifiable, publication-grade inference (97.30% holdout accuracy, 0.9895 ROC-AUC, 0.0210 Brier calibration score) with strict data-leakage auditing.",
    how: "Runs 100% offline at >260,000 flows/sec, feeding real-time network anomaly probabilities into the Bayesian Fusion layer. Model 6 is the network evidence provider \u2014 not the final EAL model."
  },
  {
    id: 'threat_intelligence',
    targetSelector: '#spotlight-threat-intel',
    fallbackTab: 'threat_intel',
    title: 'Threat Intelligence Pipeline',
    category: 'Intelligence',
    roles: ['CISO', 'SOC'],
    icon: Layers,
    accent: '#22D3EE',
    accentBg: 'rgba(34,211,238,0.08)',
    what: "Continuous aggregation of global threat feeds (CISA KEV, MITRE ATT&CK, NVD, EPSS) matched against enterprise asset configurations.",
    why: "Allows security leaders to anticipate emerging exploit campaigns before automated scanners touch corporate firewalls.",
    how: "Calculates weaponization velocity and maps adversary TTPs to local infrastructure assets using correlation engines."
  },
  {
    id: 'newsletter_intelligence',
    targetSelector: '#spotlight-newsletter',
    fallbackTab: 'intelligence',
    title: 'Newsletter Intelligence Processing',
    category: 'Intelligence',
    roles: ['CISO', 'CFO', 'Security'],
    icon: Info,
    accent: '#2DD4BF',
    accentBg: 'rgba(45,212,191,0.08)',
    what: "Standard RFC 822 email parser ingesting industry advisories (e.g., SANS @RISK, Morning Brew) with SHA-256 cryptographic hashing.",
    why: "Zero data fabrication: extracts real CVEs, vendor advisories, and financial market alerts without hallucinating unverified claims.",
    how: "Performs entity extraction, matches affected products against the enterprise tech stack, and routes to human validation queues."
  },
  {
    id: 'ciso_review',
    targetSelector: '#spotlight-ciso-review',
    fallbackTab: 'intelligence',
    title: 'CISO Human-in-the-Loop Gate',
    category: 'Governance',
    roles: ['CISO', 'Security'],
    icon: Shield,
    accent: '#60A5FA',
    accentBg: 'rgba(96,165,250,0.08)',
    what: "Mandatory executive validation workflow: CISO can CONFIRM, CORRECT, or REJECT incoming threat intelligence matches before they affect risk posture.",
    why: "Autonomous AI must never alter production risk postures without human review. This enforces strict governance and accountability.",
    how: "Upon confirmation, updates asset risk telemetry, records reviewer identity, and anchors the decision to an immutable audit record."
  },
  {
    id: 'cfo_financial',
    targetSelector: '#spotlight-cfo-finance',
    fallbackTab: 'intelligence',
    title: 'CFO Financial Intelligence',
    category: 'Finance',
    roles: ['CFO', 'CISO'],
    icon: DollarSign,
    accent: '#34D399',
    accentBg: 'rgba(52,211,153,0.08)',
    what: "Enterprise exposure tracking combining macroeconomic intelligence, cloud vendor cost forecasts, and compliance risks.",
    why: "Translates technical vulnerability telemetry into board-level balance sheet implications and capital budget justification.",
    how: "Evaluates market forecasts against local vendor exposure. Flags unverified vendor estimates as OUTCOME_PENDING until realized."
  },
  {
    id: 'eal',
    targetSelector: '#spotlight-financial-impact',
    fallbackTab: 'dashboard',
    title: 'Expected Annual Loss (EAL)',
    category: 'Quantification',
    roles: ['CFO', 'CISO'],
    icon: DollarSign,
    accent: '#4ADE80',
    accentBg: 'rgba(74,222,128,0.08)',
    what: "Financial quantification metric: EAL (\u20b9 INR) = Annual Rate of Occurrence \u00d7 Single Loss Expectancy \u00d7 Calibrated Exploit Probability.",
    why: "Replaces ambiguous Red/Yellow/Green risk matrices with mathematically sound financial exposure that boards and auditors understand.",
    how: "Dynamically recalculates Pre-EAL and Post-EAL, measuring the exact financial exposure averted by each deployed control."
  },
  {
    id: 'optimizer',
    targetSelector: '#spotlight-optimizer',
    fallbackTab: 'dashboard',
    title: 'Investment Optimization (ROSI)',
    category: 'Prescriptive AI',
    roles: ['CFO', 'CISO', 'Security'],
    icon: Sparkles,
    accent: '#FBBF24',
    accentBg: 'rgba(251,191,36,0.08)',
    what: "Integer Linear Programming solver (PuLP) prescribing the mathematically optimal portfolio of security controls within a given budget.",
    why: "Security teams face hundreds of vulnerabilities with finite budgets. Ad-hoc remediation wastes capital on low-impact controls.",
    how: "Solves max \u03a3(\u0394EAL - Cost) subject to Cost \u2264 Budget, returning Return on Security Investment (ROSI %) and exact controls to deploy."
  },
  {
    id: 'remediation',
    targetSelector: '#spotlight-remediation',
    fallbackTab: 'execution',
    title: 'Control Execution & Remediation',
    category: 'Operations',
    roles: ['Security', 'CISO', 'SOC'],
    icon: Lock,
    accent: '#818CF8',
    accentBg: 'rgba(129,140,248,0.08)',
    what: "Deployment workflow for approved prescriptive safeguards (e.g., Microsegmentation, EDR, Virtual Patching, IAM hardening).",
    why: "Closes the loop between strategic risk quantification and operational remediation, enforcing verified mitigation.",
    how: "Tracks deployment from PENDING \u2192 DEPLOYED, triggering automated post-control reassessment upon verification."
  },
  {
    id: 'reassessment',
    targetSelector: '#spotlight-reassessment',
    fallbackTab: 'dashboard',
    title: 'Risk & EAL Reassessment',
    category: 'Continuous Validation',
    roles: ['CISO', 'CFO', 'Security'],
    icon: CheckCircle2,
    accent: '#34D399',
    accentBg: 'rgba(52,211,153,0.08)',
    what: "Automated recalculation showing verified risk delta (e.g., 87% \u2192 14%) and financial loss reduction (e.g., \u20b98.92M \u2192 \u20b9720K).",
    why: "Demonstrates tangible ROI on deployed security investments and verifies whether applied controls effectively neutralized the threat.",
    how: "Updates asset exposure multipliers and control efficacy scores, generating audit-ready compliance evidence for SEC/SEBI/CERT-In."
  },
  {
    id: 'security_testing',
    targetSelector: '#spotlight-security-testing',
    fallbackTab: 'security_testing',
    title: 'Security Testing & Authorization',
    category: 'Evidence',
    roles: ['SOC', 'Security'],
    icon: Terminal,
    accent: '#F87171',
    accentBg: 'rgba(248,113,113,0.08)',
    what: "Controlled verification framework executing authorized offensive penetration checks within explicit enterprise scope.",
    why: "Synthesizes empirical proof rather than theoretical vulnerability scans. Strictly enforces authorization boundaries.",
    how: "Blocks unauthorized targets (e.g., bankofamerica.com is blocked), generating telemetry only for authorized lab assets."
  },
  {
    id: 'strix',
    targetSelector: '#spotlight-strix',
    fallbackTab: 'security_testing',
    title: 'Strix Autonomous Agent',
    category: 'Autonomous Testing',
    roles: ['Security', 'Admin'],
    icon: Terminal,
    accent: '#FB923C',
    accentBg: 'rgba(251,146,60,0.08)',
    what: "Adapter for the open-source Strix autonomous penetration testing agent with transparent runtime detection.",
    why: "Technical honesty: if Docker or Strix binaries are offline, the system clearly informs the operator rather than fabricating live agent execution.",
    how: "Detects host prerequisites (CLI binary, Docker socket, LLM keys); falls back to reproducible lab telemetry when prerequisites are missing."
  },
  {
    id: 'fabric_audit',
    targetSelector: '#spotlight-fabric-audit',
    fallbackTab: 'audit',
    title: 'Hyperledger Fabric Audit Trail',
    category: 'Integrity',
    roles: ['Admin', 'CISO', 'CFO'],
    icon: Layers,
    accent: '#60A5FA',
    accentBg: 'rgba(96,165,250,0.08)',
    what: "Permissioned enterprise blockchain anchoring every risk assessment, CISO approval, and remediation lifecycle event.",
    why: "Provides tamper-proof legal and regulatory compliance evidence for SEC/SEBI/CERT-In audits that cannot be altered retroactively.",
    how: "Submits SHA-256 hashes to etcdraft consensus peer nodes; reliably buffers to local offline audit queue when peer containers are stopped."
  },
  {
    id: 'attack_mode',
    targetSelector: '#spotlight-attack-mode',
    fallbackTab: 'dashboard',
    title: 'Synchronized Attack Mode',
    category: 'Live Demo',
    roles: ['CISO', 'SOC', 'Security'],
    icon: Flame,
    accent: '#F87171',
    accentBg: 'rgba(248,113,113,0.08)',
    what: "Real-time demonstration mode triggered when the controlled Security Lab launches an active exploit against an authorized asset.",
    why: "Shows how CyberOptRQ dynamically responds in seconds: risk surges, EAL spikes, and the affected asset is pinpointed.",
    how: "Listens for WebSocket ATTACK_STARTED events, updating Pre-EAL to \u20b98.92M and highlighting the live threat pipeline."
  },
  {
    id: 'bad_apple',
    targetSelector: '#bad-apple-video',
    fallbackTab: 'dashboard',
    title: 'Bad Apple Visualizer',
    category: 'Visualizer',
    roles: ['SOC', 'Security', 'CISO'],
    icon: Film,
    accent: '#F87171',
    accentBg: 'rgba(248,113,113,0.08)',
    what: "Embedded high-contrast visualizer automatically playing inside the dashboard upon receiving authorized attack telemetry.",
    why: "Provides an unmistakable, high-impact visual indicator during live presentations that an active attack flow is executing.",
    how: "The dashboard automatically reveals and starts the embedded visualizer without manual tab switching. It is an artifact of the attack, not the detector."
  }
];

// ── Spotlight Highlight Overlay ─────────────────────────────────────────────
function SpotlightOverlay({ rect, accent, isVisible }) {
  if (!isVisible || !rect) return null;

  return (
    <>
      {/* Dark scrim with a "punch-out" hole around the target */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1000,
          background: 'rgba(2, 6, 23, 0.55)',
          backdropFilter: 'blur(1px)',
          WebkitBackdropFilter: 'blur(1px)',
          maskImage: `
            radial-gradient(ellipse ${rect.width + 64}px ${rect.height + 64}px at ${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px,
              transparent 60%, rgba(0,0,0,0.7) 80%, rgba(0,0,0,0.55) 100%)
          `,
          WebkitMaskImage: `
            radial-gradient(ellipse ${rect.width + 64}px ${rect.height + 64}px at ${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px,
              transparent 60%, rgba(0,0,0,0.7) 80%, rgba(0,0,0,0.55) 100%)
          `,
          transition: 'mask-image 0.35s ease, -webkit-mask-image 0.35s ease',
        }}
      />
      {/* Glowing ring around target */}
      <div
        className="fixed pointer-events-none rounded-2xl"
        style={{
          zIndex: 1001,
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          border: `2px solid ${accent}`,
          boxShadow: `0 0 0 3px ${accent}22, 0 0 32px ${accent}44, inset 0 0 16px ${accent}11`,
          transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          animation: 'spotlightPulse 2.4s ease-in-out infinite',
        }}
      >
        {/* "Inspecting" label badge */}
        <div
          style={{
            position: 'absolute',
            top: -22,
            left: 8,
            background: accent,
            color: '#0F172A',
            fontSize: '9px',
            fontWeight: '900',
            fontFamily: 'monospace',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '2px 8px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
          }}
        >
          ▶ Inspecting This Element
        </div>
      </div>
    </>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function SpotlightHelp({
  isOpen,
  onClose,
  currentRole = 'CISO',
  activeTab = 'dashboard',
  onNavigateTab
}) {
  const [activeRoleFilter, setActiveRoleFilter] = useState(currentRole);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const panelRef = useRef(null);

  // Sync role filter when prop changes
  useEffect(() => {
    setActiveRoleFilter(currentRole);
  }, [currentRole]);

  // Filtered topics for the active role
  const filteredTopics = SPOTLIGHT_TOPICS.filter((t) =>
    activeRoleFilter === 'ALL' ? true : t.roles.includes(activeRoleFilter)
  );

  const currentTopic = filteredTopics[Math.min(currentIndex, filteredTopics.length - 1)] || filteredTopics[0];

  // Locate and highlight target element
  const updateTargetRect = useCallback(() => {
    if (!isOpen || !currentTopic) {
      setHighlightRect(null);
      return;
    }
    const el = document.querySelector(currentTopic.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(() => {
        const updated = el.getBoundingClientRect();
        setHighlightRect({
          top: updated.top,
          left: updated.left,
          width: updated.width,
          height: updated.height,
        });
      }, 200);
    } else {
      setHighlightRect(null);
    }
  }, [isOpen, currentTopic]);

  useEffect(() => {
    if (!isOpen) return;
    updateTargetRect();
    const handleResize = () => updateTargetRect();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isOpen, updateTargetRect, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') handleNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, filteredTopics.length]);

  const navigateTo = (newIndex) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(newIndex);
    setTimeout(() => setIsAnimating(false), 350);
  };

  const handleNext = () => {
    navigateTo(currentIndex < filteredTopics.length - 1 ? currentIndex + 1 : 0);
  };

  const handlePrev = () => {
    navigateTo(currentIndex > 0 ? currentIndex - 1 : filteredTopics.length - 1);
  };

  if (!isOpen || !currentTopic) return null;

  const TopicIcon = currentTopic?.icon || HelpCircle;
  const accent = currentTopic?.accent || '#60A5FA';

  return (
    <>
      {/* Inject keyframe animation */}
      <style>{`
        @keyframes spotlightPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 3px ${accent}22, 0 0 32px ${accent}44; }
          50%       { opacity: 0.85; box-shadow: 0 0 0 6px ${accent}11, 0 0 48px ${accent}55; }
        }
        @keyframes slideInFromRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @keyframes fadeInPanel {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Spotlight overlay — stays behind the panel */}
      <SpotlightOverlay
        rect={highlightRect}
        accent={accent}
        isVisible={!!highlightRect}
      />

      {/* Close-on-backdrop click area (low z, above overlay) */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 1002, cursor: 'default' }}
        onClick={onClose}
      />

      {/* ── Explanation Side Panel ── */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full flex flex-col"
        style={{
          zIndex: 1100,
          width: '360px',
          maxWidth: '90vw',
          background: 'linear-gradient(160deg, #0F172A 0%, #0D1526 100%)',
          borderLeft: `1px solid ${accent}33`,
          boxShadow: `-24px 0 80px rgba(0,0,0,0.6), -2px 0 0 ${accent}22`,
          animation: 'slideInFromRight 0.38s cubic-bezier(0.34, 1.2, 0.64, 1) both',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─ Panel Header ─ */}
        <div
          style={{
            padding: '16px 20px 14px',
            borderBottom: `1px solid ${accent}22`,
            background: `linear-gradient(135deg, ${accent}08 0%, transparent 100%)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                padding: '6px',
                background: `${accent}18`,
                border: `1px solid ${accent}44`,
                borderRadius: '8px',
                color: accent,
                display: 'flex', alignItems: 'center'
              }}>
                <BookOpen size={14} />
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                  Guided Explainer
                </div>
                <div style={{ fontSize: '9px', color: '#64748B', fontFamily: 'monospace' }}>
                  SIH 2026 · Presentation Mode
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '6px', borderRadius: '8px',
                background: 'rgba(100,116,139,0.15)',
                border: '1px solid rgba(100,116,139,0.25)',
                color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center',
                transition: 'all 0.2s',
              }}
              title="Close Help (Esc)"
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#F87171'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(100,116,139,0.15)'; e.currentTarget.style.color = '#94A3B8'; }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Role filter pills */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {['CISO', 'CFO', 'Security', 'SOC', 'ALL'].map((r) => {
              const active = activeRoleFilter === r;
              return (
                <button
                  key={r}
                  onClick={() => { setActiveRoleFilter(r); setCurrentIndex(0); }}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '10px',
                    fontWeight: '700',
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: active ? accent : 'rgba(30,41,59,0.8)',
                    color: active ? '#0F172A' : '#64748B',
                    border: active ? `1px solid ${accent}` : '1px solid rgba(100,116,139,0.2)',
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─ Topic Content ─ */}
        <div
          style={{ flex: 1, overflowY: 'auto', padding: '20px' }}
          key={`${currentTopic.id}-${currentIndex}`}
        >
          {/* Topic header */}
          <div style={{ marginBottom: '16px', animation: 'fadeInPanel 0.3s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                padding: '10px',
                background: `${accent}18`,
                border: `1px solid ${accent}44`,
                borderRadius: '12px',
                color: accent,
                flexShrink: 0,
                display: 'flex', alignItems: 'center',
              }}>
                <TopicIcon size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '8px', fontFamily: 'monospace', color: accent, fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '3px' }}>
                  {currentTopic.category}
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#F1F5F9', lineHeight: '1.3', margin: 0 }}>
                  {currentTopic.title}
                </h3>
              </div>
              <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#475569', flexShrink: 0, textAlign: 'right' }}>
                <span style={{ color: accent, fontWeight: '700', fontSize: '14px' }}>{currentIndex + 1}</span>
                <span style={{ color: '#475569' }}> / {filteredTopics.length}</span>
              </div>
            </div>

            {/* Target element indicator */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 10px',
              background: highlightRect ? `${accent}0D` : 'rgba(30,41,59,0.5)',
              border: `1px solid ${highlightRect ? accent + '33' : 'rgba(100,116,139,0.2)'}`,
              borderRadius: '8px',
              fontSize: '9px', fontFamily: 'monospace', color: highlightRect ? accent : '#475569',
            }}>
              <Target size={10} />
              <span style={{ fontWeight: '700' }}>
                {highlightRect ? 'Target highlighted on screen' : 'Target element not visible on current tab'}
              </span>
              <code style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '8px' }}>
                {currentTopic.targetSelector}
              </code>
            </div>
          </div>

          {/* Three structured answers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', animation: 'fadeInPanel 0.35s ease 0.05s both' }}>
            {/* WHAT */}
            <div style={{
              padding: '14px 16px',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(51, 65, 85, 0.6)',
              borderRadius: '12px',
            }}>
              <div style={{ fontSize: '9px', fontWeight: '800', color: '#60A5FA', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '3px', height: '10px', background: '#60A5FA', borderRadius: '2px' }} />
                What is this?
              </div>
              <p style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.65', margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                {currentTopic.what}
              </p>
            </div>

            {/* WHY */}
            <div style={{
              padding: '14px 16px',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(51, 65, 85, 0.6)',
              borderRadius: '12px',
            }}>
              <div style={{ fontSize: '9px', fontWeight: '800', color: '#FBBF24', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '3px', height: '10px', background: '#FBBF24', borderRadius: '2px' }} />
                Why does it matter?
              </div>
              <p style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.65', margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                {currentTopic.why}
              </p>
            </div>

            {/* HOW */}
            <div style={{
              padding: '14px 16px',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(51, 65, 85, 0.6)',
              borderRadius: '12px',
            }}>
              <div style={{ fontSize: '9px', fontWeight: '800', color: '#34D399', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '3px', height: '10px', background: '#34D399', borderRadius: '2px' }} />
                How does CyberOptRQ use it?
              </div>
              <p style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.65', margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                {currentTopic.how}
              </p>
            </div>
          </div>

          {/* Topic quick-nav dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '20px', flexWrap: 'wrap' }}>
            {filteredTopics.map((t, i) => (
              <button
                key={t.id}
                onClick={() => navigateTo(i)}
                title={t.title}
                style={{
                  width: i === currentIndex ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: i === currentIndex ? accent : 'rgba(100,116,139,0.3)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
            ))}
          </div>

          {/* Keyboard hint */}
          <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '9px', color: '#374151', fontFamily: 'monospace' }}>
            ← → arrow keys · Esc to close
          </div>
        </div>

        {/* ─ Footer Navigation ─ */}
        <div style={{
          padding: '14px 20px',
          borderTop: `1px solid ${accent}22`,
          background: 'rgba(2,6,23,0.6)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(30,41,59,0.8)',
              border: '1px solid rgba(100,116,139,0.3)',
              color: '#64748B',
              fontSize: '11px',
              fontWeight: '700',
              fontFamily: 'monospace',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#F1F5F9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; }}
          >
            CLOSE
          </button>

          <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
            <button
              onClick={handlePrev}
              disabled={isAnimating}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(30,41,59,0.8)',
                border: '1px solid rgba(100,116,139,0.3)',
                color: '#CBD5E1',
                fontSize: '11px',
                fontWeight: '700',
                fontFamily: 'monospace',
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: isAnimating ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={13} />
              PREV
            </button>

            <button
              onClick={handleNext}
              disabled={isAnimating}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: accent,
                border: `1px solid ${accent}`,
                color: '#0F172A',
                fontSize: '11px',
                fontWeight: '800',
                fontFamily: 'monospace',
                cursor: 'pointer',
                boxShadow: `0 4px 16px ${accent}44`,
                transition: 'all 0.2s',
                opacity: isAnimating ? 0.7 : 1,
              }}
            >
              NEXT
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
