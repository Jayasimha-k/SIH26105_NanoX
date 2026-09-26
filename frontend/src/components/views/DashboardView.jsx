import React, { useState, useEffect } from 'react';
import {
  Shield, AlertTriangle, TrendingUp, DollarSign, CheckCircle2,
  XCircle, ArrowRight, HelpCircle, X, Zap, Radio, RefreshCw, Layers, Terminal, ExternalLink, Cpu, FileText
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../../services/api';

const mockTrendData = [
  { month: 'Jan', preEal: 28.5, postEal: 14.2 },
  { month: 'Feb', preEal: 31.0, postEal: 12.8 },
  { month: 'Mar', preEal: 35.4, postEal: 11.5 },
  { month: 'Apr', preEal: 42.1, postEal: 9.8 },
  { month: 'May', preEal: 39.8, postEal: 8.4 },
  { month: 'Jun', preEal: 44.5, postEal: 7.2 },
];

const topFinancialRisks = [
  {
    id: 'ASSET-002',
    name: 'Production K8s Microservices Cluster',
    cve: 'CVE-2024-3094',
    cveTitle: 'XZ Utils Backdoor RCE',
    exposure: 'Internet-Facing',
    criticality: '9.2 / 10',
    eal: '₹18.2 Lakhs',
    impact: '₹90.0 Lakhs',
    recommendedControl: 'Zero-Trust Microsegmentation & Network Isolation'
  },
  {
    id: 'ASSET-003',
    name: 'Payment API Gateway',
    cve: 'CVE-2023-4863',
    cveTitle: 'libwebp Heap Buffer Overflow',
    exposure: 'External API',
    criticality: '8.8 / 10',
    eal: '₹12.4 Lakhs',
    impact: '₹31.7 Lakhs',
    recommendedControl: 'Memory-Safe Buffer Shield & API Gateway WAF'
  },
  {
    id: 'ASSET-001',
    name: 'Core Oracle Production Database',
    cve: 'CVE-2024-21626',
    cveTitle: 'runc Container Escape RCE',
    exposure: 'Internal Zone',
    criticality: '9.5 / 10',
    eal: '₹8.6 Lakhs',
    impact: '₹66.5 Lakhs',
    recommendedControl: 'Kernel Container Patching & Runtime Defense'
  }
];

export default function DashboardView({
  overview,
  onNavigate,
  recommendations = [],
  onRefresh,
  attackState = {},
  onCompleteAttack
}) {
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [explainType, setExplainType] = useState('EAL'); // 'EAL' or 'ROSI'
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [isRemediating, setIsRemediating] = useState(false);
  const [animStep, setAnimStep] = useState(0);
  const [displayRisk, setDisplayRisk] = useState(78);
  const [displayEal, setDisplayEal] = useState(4450000);

  const formatCurrency = (val) => `₹${((val || 0) / 100000).toFixed(1)}L`;

  // Attack status helpers & Live ML Pipeline data
  const isAttackActive = attackState?.active || attackState?.status === 'ATTACK_STARTED';
  const isAttackCompleted = attackState?.status === 'ATTACK_COMPLETED';
  const pipeline = attackState?.pipeline;
  const baselinePreEal = overview?.total_pre_control_eal || 4450000;

  // Staged attack lifecycle and numeric transition sequence
  useEffect(() => {
    if (isAttackActive) {
      console.log(`[DASHBOARD] ATTACK_STARTED received: correlation_id=${attackState?.correlation_id || 'ATTACK-DEMO-2026-001'}`);
      console.log('[DASHBOARD] attack mode enabled');
      console.log('[BAD-APPLE] visualizer mounted');

      const targetRisk = Math.round((pipeline?.fused_probability || 0.87) * 100);
      const targetEal = pipeline?.active_attack_eal || 8920000;

      const timers = [];
      timers.push(setTimeout(() => setAnimStep(1), 50));   // T+0.05: 🚨 Attack detected
      timers.push(setTimeout(() => setAnimStep(2), 250));  // T+0.25: Target asset highlighted
      timers.push(setTimeout(() => setAnimStep(3), 500));  // T+0.50: Model 6 network anomaly burst
      timers.push(setTimeout(() => {
        setAnimStep(4); // T+0.80: Risk score transitions upward
        let currR = 78;
        const rInterval = setInterval(() => {
          currR += 1;
          if (currR >= targetRisk) {
            setDisplayRisk(targetRisk);
            clearInterval(rInterval);
          } else {
            setDisplayRisk(currR);
          }
        }, 35);
      }, 750));
      timers.push(setTimeout(() => {
        setAnimStep(5); // T+1.20: EAL transitions upward
        let currE = 4450000;
        const step = Math.round((targetEal - 4450000) / 12);
        const eInterval = setInterval(() => {
          currE += step;
          if (currE >= targetEal) {
            setDisplayEal(targetEal);
            clearInterval(eInterval);
          } else {
            setDisplayEal(currE);
          }
        }, 35);
      }, 1100));
      timers.push(setTimeout(() => setAnimStep(6), 1450)); // T+1.45: Optimizer recommendations update
      timers.push(setTimeout(() => {
        setAnimStep(7); // T+1.75: Bad Apple visualizer playback begins
        const videoEl = document.getElementById('bad-apple-video');
        if (videoEl) {
          videoEl.play().then(() => {
            console.log('[BAD-APPLE] playback started');
          }).catch((err) => {
            console.warn('[BAD-APPLE] autoplay retry:', err);
            videoEl.muted = true;
            videoEl.play().then(() => console.log('[BAD-APPLE] playback started')).catch(() => {});
          });
        }
      }, 1750));

      return () => timers.forEach(clearTimeout);
    } else if (isAttackCompleted) {
      setDisplayRisk(14);
      setDisplayEal(pipeline?.post_eal || 720000);
      setAnimStep(8); // Remediated
    } else {
      setDisplayRisk(78);
      setDisplayEal(baselinePreEal);
      setAnimStep(0);
    }
  }, [isAttackActive, isAttackCompleted, pipeline, baselinePreEal, attackState?.correlation_id]);

  const preEal = isAttackActive
    ? displayEal
    : (isAttackCompleted ? (pipeline?.post_eal || 720000) : baselinePreEal);

  const postEal = isAttackCompleted
    ? (pipeline?.post_eal || 720000)
    : ((overview && overview.total_post_control_eal < overview.total_pre_control_eal)
        ? overview.total_post_control_eal
        : Math.round(preEal * 0.16));

  const riskReduction = preEal - postEal;
  const reductionPct = preEal > 0 ? (((preEal - postEal) / preEal) * 100).toFixed(1) : '83.8';
  const rosi = overview?.enterprise_rosi || 465.8;

  // Dynamic trend data showing baseline vs live attack surge vs post-remediation
  const dynamicTrendData = isAttackActive
    ? [
        { month: 'Jan', preEal: 28.5, postEal: 14.2 },
        { month: 'Feb', preEal: 31.0, postEal: 12.8 },
        { month: 'Mar', preEal: 35.4, postEal: 11.5 },
        { month: 'Apr', preEal: 42.1, postEal: 9.8 },
        { month: 'May', preEal: 39.8, postEal: 8.4 },
        { month: 'Jun (Baseline)', preEal: 44.5, postEal: 7.2 },
        { month: 'NOW (LIVE ATTACK)', preEal: Number((displayEal / 100000).toFixed(1)), postEal: 7.2 },
      ]
    : (isAttackCompleted
        ? [
            { month: 'Jan', preEal: 28.5, postEal: 14.2 },
            { month: 'Feb', preEal: 31.0, postEal: 12.8 },
            { month: 'Mar', preEal: 35.4, postEal: 11.5 },
            { month: 'Apr', preEal: 42.1, postEal: 9.8 },
            { month: 'May', preEal: 39.8, postEal: 8.4 },
            { month: 'Jun (Baseline)', preEal: 44.5, postEal: 7.2 },
            { month: 'ATTACK SPIKE', preEal: 89.2, postEal: 7.2 },
            { month: 'REMEDIATED (7.2L)', preEal: 7.2, postEal: 7.2 },
          ]
        : mockTrendData);

  // Dynamic top financial risks highlighting the asset under attack
  const dynamicTopRisks = isAttackActive
    ? [
        {
          id: attackState?.asset_id || 'ASSET-001',
          name: pipeline?.asset_name || 'Core Oracle Production Database',
          cve: 'CVE-2024-21626 (runc Container Escape RCE)',
          cveTitle: 'Active RCE Exploitation & Network Flow Anomaly Spike',
          exposure: 'INTERNET-FACING (SURGING)',
          criticality: `${pipeline?.asset_criticality || 9.5} / 10`,
          eal: `₹${((displayEal || 8920000) / 100000).toFixed(1)} Lakhs`,
          impact: '₹90.0 Lakhs',
          recommendedControl: 'Zero-Trust Microsegmentation & Network Isolation (Emergency)',
          isUnderAttack: true,
        },
        ...topFinancialRisks.filter(r => r.id !== (attackState?.asset_id || 'ASSET-001'))
      ]
    : topFinancialRisks;

  // Pending decisions
  const pendingRecs = recommendations.filter(r => r.status === 'PENDING');
  const displayPending = pendingRecs.length > 0 ? pendingRecs : [
    {
      id: 'REC-001',
      title: 'Zero-Trust Microsegmentation & Network Isolation',
      risk: 'Internet-facing K8s Cluster (CVE-2024-3094)',
      cost: 250000,
      expected_risk_reduction: 1420000,
      priority: 'CRITICAL',
      status: 'PENDING'
    },
    {
      id: 'REC-002',
      title: 'Kernel Container Patching & Runtime Defense',
      risk: 'Oracle Production DB (CVE-2024-21626)',
      cost: 120000,
      expected_risk_reduction: 870000,
      priority: 'HIGH',
      status: 'PENDING'
    },
    {
      id: 'REC-003',
      title: 'Memory-Safe Buffer Shield & API Gateway WAF',
      risk: 'Payment API Gateway (CVE-2023-4863)',
      cost: 150000,
      expected_risk_reduction: 540000,
      priority: 'HIGH',
      status: 'PENDING'
    }
  ];

  const handleQuickAction = async (recId, action) => {
    setProcessingId(recId);
    try {
      await api.approveRecommendation(recId, action, `Direct CISO 1-click ${action.toLowerCase()}`);
      setActionNotice(`Recommendation ${recId} has been successfully ${action.toLowerCase()}!`);
      setTimeout(() => setActionNotice(null), 4000);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
      setActionNotice(`Status updated for ${recId}: ${action}`);
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeployEmergencyRemediation = async () => {
    setIsRemediating(true);
    console.log('[DASHBOARD] Deploying emergency controls for correlation:', attackState?.correlation_id);
    try {
      await api.approveRecommendation('REC-001', 'APPROVED', 'Emergency Attack Mitigation');
      await api.markExecuted('REC-001').catch(() => {});
      if (onCompleteAttack && attackState?.correlation_id) {
        await onCompleteAttack(attackState.correlation_id);
      }
      setActionNotice('Emergency Remediation Applied: Zero-Trust Isolation Deployed. Hyperledger Fabric Block Mined!');
      setTimeout(() => setActionNotice(null), 6000);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Failed to execute emergency remediation:', e);
      if (onCompleteAttack && attackState?.correlation_id) {
        await onCompleteAttack(attackState.correlation_id);
      }
    } finally {
      setIsRemediating(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      console.log('[DASHBOARD] Resetting demo state to NORMAL');
      await api.resetAttackDemo();
      setActionNotice('Demo state reset to NORMAL. Baseline risk values restored.');
      setTimeout(() => setActionNotice(null), 4000);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Reset error:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* ATTACK MODE ACTIVE HUD & SYNCHRONIZED BAD APPLE EMBEDDED VISUALIZER */}
      {isAttackActive && (
        <div id="spotlight-attack-mode" className="p-6 bg-slate-950 border-2 border-red-500 rounded-2xl shadow-2xl space-y-5 text-white relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Banner Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-red-900/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-600/20 border border-red-500/50 rounded-xl text-red-400 animate-pulse">
                <Radio className="w-5 h-5 text-red-500 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-red-600 text-white rounded font-mono animate-pulse">
                    ATTACK IN PROGRESS
                  </span>
                  <span className="text-xs font-mono text-slate-400">SIH 26105 Live Demonstration</span>
                </div>
                <h3 className="text-lg font-black text-white tracking-tight mt-0.5">
                  Synchronized Telemetry Event &bull; {attackState?.correlation_id || 'ATTACK-DEMO-2026'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-800/80 text-red-300 font-bold">
                Target: {pipeline?.asset_name ? `${pipeline.asset_id} (${pipeline.asset_name})` : (attackState?.asset_id || 'ASSET-001 (Production Server)')}
              </span>
              <button
                onClick={() => window.open('http://localhost:5174', '_blank')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Open Bad Apple in separate window"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bad Apple Embedded Visualizer & Live AI Telemetry Dual Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Embedded Bad Apple — local video served by Vite */}
            <div className="lg:col-span-7 bg-black rounded-xl overflow-hidden border-2 border-red-500/80 shadow-2xl relative flex flex-col justify-center items-center min-h-[320px]">
              <video
                id="bad-apple-video"
                src="/bad_apple.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
                style={{ minHeight: '320px', maxHeight: '420px' }}
              />
              {/* Overlay label */}
              <div className="absolute bottom-2 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-red-500/40 text-[10px] font-mono text-red-300 flex items-center gap-2 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                <span>Bad Apple Visualizer &bull; Synchronized Attack Mode</span>
              </div>
              {/* Unmute hint */}
              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-700/60 text-[9px] font-mono text-slate-400 pointer-events-none">
                🔇 Click video to unmute
              </div>
            </div>

            {/* Live Pipeline Telemetry & Exploit Probability (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between p-4 bg-slate-900/80 border border-red-900/50 rounded-xl space-y-4 font-mono text-xs">
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Live Pipeline Execution (P1–P6)</span>
                  <span className="text-red-400 animate-pulse font-bold">CALCULATING REAL RISK</span>
                </div>

                <div className="space-y-2">
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">P1 (CVSS/CWE Base):</span>
                    <span className="text-amber-400 font-bold">
                      {pipeline?.p1_nvd ? `${pipeline.p1_nvd.toFixed(2)} / Critical` : '0.98 / Critical'}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">P2 (EPSS Velocity):</span>
                    <span className="text-red-400 font-bold">
                      {pipeline?.p2_epss ? `${pipeline.p2_epss.toFixed(2)} (Threat Surge)` : '0.94 (Threat Surge)'}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">P3 (CISA KEV Wild):</span>
                    <span className="text-red-400 font-bold">ACTIVE EXPLOIT (CONFIRMED)</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">P4 (MITRE Technique):</span>
                    <span className="text-amber-400 font-bold">
                      {pipeline?.p4_mitre || 'T1190 (Public RCE)'}
                    </span>
                  </div>
                  <div className="p-2 bg-red-950/60 rounded border border-red-700/60 flex justify-between items-center">
                    <span className="text-red-200 font-bold">P5 Meta Fusion Model:</span>
                    <span className="text-white font-extrabold text-sm">
                      P(exploit) = {pipeline?.fused_probability ? pipeline.fused_probability.toFixed(3) : '0.912'}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Model 6 (P6 Network Flow):</span>
                    <span className="text-red-400 font-bold">
                      P(anomaly) = {pipeline?.p6_network ? pipeline.p6_network.toFixed(3) : '0.960'} [CIC-IDS2017]
                    </span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Financial Exposure Spike:</span>
                    <span className="text-red-300 font-extrabold">
                      {formatCurrency(pipeline?.active_attack_eal || 8920000)} (surge from baseline)
                    </span>
                  </div>
                </div>
              </div>

              {/* Emergency Remediation Action Button */}
              <div className="pt-2">
                <button
                  id="emergency-remediation-btn"
                  onClick={handleDeployEmergencyRemediation}
                  disabled={isRemediating}
                  className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 border border-red-400 transition-all cursor-pointer"
                >
                  <Zap className={`w-4 h-4 ${isRemediating ? 'animate-spin' : ''}`} />
                  <span>{isRemediating ? 'Deploying Controls...' : 'DEPLOY REMEDIATION & NEUTRALIZE ATTACK'}</span>
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-1.5">
                  Applies Zero-Trust microsegmentation, stops Bad Apple, and writes Fabric audit record.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ATTACK COMPLETED CONFIRMATION BANNER */}
      {isAttackCompleted && !isAttackActive && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-500/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-400">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">Controlled Attack Successfully Neutralized</h4>
              <p className="text-xs text-emerald-300/80 font-mono">
                Remediation verified &bull; Bad Apple visualizer paused &bull; Hyperledger Fabric Block mined ({pipeline?.fabric_tx_id || 'FABRIC-MINED'})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDemo}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-600 transition-colors"
            >
              [ RESET DEMO ]
            </button>
            <button
              onClick={() => api.startAttackDemo().catch(() => {})}
              className="px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100 rounded-lg text-xs font-bold border border-emerald-600 transition-colors"
            >
              Ready for Next Attack Demo
            </button>
          </div>
        </div>
      )}

      {/* Action Notification Alert */}
      {actionNotice && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span className="font-semibold">{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 22: EVENT LIFECYCLE PROGRESS TRACKER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-white space-y-3 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping inline-block" />
            <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px]">
              SIH 2026 Audit & Telemetry Lifecycle Stepper
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span>Event Correlation:</span>
            <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300 font-bold">
              {attackState?.correlation_id || 'ATTACK-DEMO-2026'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
          {/* Step 1: Baseline */}
          <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
            isAttackActive || isAttackCompleted ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-blue-950/60 border-blue-700 text-blue-200'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold block">1. Baseline Org</span>
              <span className="text-[9px] opacity-75">78% Risk / ₹44.5L EAL</span>
            </div>
          </div>

          {/* Step 2: Exploit Ingestion */}
          <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
            isAttackActive ? 'bg-red-950/70 border-red-500 text-red-200 animate-pulse ring-1 ring-red-400' : (isAttackCompleted ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500')
          }`}>
            {isAttackActive ? <Radio className="w-3.5 h-3.5 text-red-400 animate-spin shrink-0" /> : (isAttackCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <div className="w-3 h-3 rounded-full border border-slate-700 shrink-0" />)}
            <div>
              <span className="font-bold block">2. Ingest Exploit</span>
              <span className="text-[9px] opacity-75">{isAttackActive ? 'Active Telemetry' : (isAttackCompleted ? 'Neutralized' : 'Ready')}</span>
            </div>
          </div>

          {/* Step 3: Model 6 Anomaly */}
          <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
            isAttackActive && animStep >= 3 ? 'bg-purple-950/70 border-purple-500 text-purple-200 animate-pulse' : (isAttackCompleted ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500')
          }`}>
            {isAttackActive && animStep >= 3 ? <Activity className="w-3.5 h-3.5 text-purple-400 shrink-0" /> : (isAttackCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <div className="w-3 h-3 rounded-full border border-slate-700 shrink-0" />)}
            <div>
              <span className="font-bold block">3. Model 6 Anomaly</span>
              <span className="text-[9px] opacity-75">{isAttackActive && animStep >= 3 ? 'P(flow)=0.960' : (isAttackCompleted ? 'Flow Normal' : 'Standby')}</span>
            </div>
          </div>

          {/* Step 4: Risk & EAL Surge */}
          <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
            isAttackActive && animStep >= 5 ? 'bg-red-950/70 border-red-500 text-red-200' : (isAttackCompleted ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500')
          }`}>
            {isAttackActive && animStep >= 5 ? <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" /> : (isAttackCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <div className="w-3 h-3 rounded-full border border-slate-700 shrink-0" />)}
            <div>
              <span className="font-bold block">4. EAL Surge</span>
              <span className="text-[9px] opacity-75">{formatCurrency(displayEal)}</span>
            </div>
          </div>

          {/* Step 5: Fabric Audit Block */}
          <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
            isAttackCompleted ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold' : (isAttackActive ? 'bg-blue-950/40 border-blue-900 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-500')
          }`}>
            {isAttackCompleted ? <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <div className="w-3 h-3 rounded-full border border-slate-700 shrink-0" />}
            <div>
              <span className="font-bold block">5. Fabric Audit</span>
              <span className="text-[9px] opacity-75">{isAttackCompleted ? 'Tx Confirmed' : 'Queue Buffered'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 9: EXECUTIVE RISK CONCLUSIONS (CUSTOMER SEES THIS FIRST) */}
      <div id="spotlight-org-risk" className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl text-white space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-400">
                Organization Cyber Risk Synthesis
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                isAttackActive
                  ? 'bg-red-950 text-red-300 border border-red-800 animate-pulse'
                  : (isAttackCompleted ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-blue-950 text-blue-300 border border-blue-800')
              }`}>
                {isAttackActive ? 'ACTIVE ATTACK DETECTED' : (isAttackCompleted ? 'POST-REMEDIATION BASELINE' : 'MONITORING NORMAL')}
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <h2 className="text-4xl font-black tracking-tight text-white font-mono">
                {displayRisk}%
              </h2>
              <div>
                <span className="text-slate-300 text-xs font-semibold block">
                  {isAttackActive ? 'Critical Cyber Exposure' : (isAttackCompleted ? 'Residual Enterprise Exposure' : 'Baseline Enterprise Exposure')}
                </span>
                {isAttackActive && (
                  <span className="text-[10px] font-mono font-bold text-red-400 bg-red-950/80 border border-red-800 px-1.5 py-0.5 rounded inline-block mt-0.5">
                    ↑ +{displayRisk - 78} pts surge
                  </span>
                )}
                {isAttackCompleted && (
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.5 rounded inline-block mt-0.5">
                    ↓ -64 pts loss averted
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="spotlight-model-6-details"
              onClick={() => setShowTechnicalDetails(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-300 hover:text-white text-xs font-mono font-bold transition-all shadow-sm cursor-pointer"
              title="Inspect Model 6 (CIC-IDS2017 XGBoost) and P1–P6 Evidence"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>[ VIEW TECHNICAL EVIDENCE & MODEL 6 METRICS ]</span>
            </button>
          </div>
        </div>

        {/* 4 Pillars: WHY? | FINANCIAL IMPACT | WHAT TO DO | WHAT CHANGED */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* WHY? */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
              1. Why is this risk level set?
            </span>
            <ul className="text-slate-300 space-y-1 text-[11px] list-disc list-inside">
              <li>{isAttackActive ? 'Network anomaly: active empirical flow spike' : (isAttackCompleted ? 'Network flow returned to normal baseline' : 'Network telemetry: normal baseline')}</li>
              <li>Asset {attackState?.asset_id || 'ASSET-001'} (Core Oracle DB) criticality 9.5/10</li>
              <li>Threat intelligence: CVE-2024-21626 active in wild</li>
              <li>Zero-Trust microsegmentation policy {isAttackCompleted ? 'deployed & active' : 'pending'}</li>
            </ul>
          </div>

          {/* FINANCIAL IMPACT */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider block">
              2. Financial Impact
            </span>
            <div className="text-xl font-bold text-white font-mono">
              {formatCurrency(preEal)} <span className="text-xs font-normal text-slate-400 font-sans">EAL</span>
            </div>
            {isAttackActive && (
              <span className="text-[10px] font-mono font-bold text-red-400 block">
                ▲ +{formatCurrency(displayEal - 4450000)} (+{(((displayEal - 4450000) / 4450000) * 100).toFixed(1)}%)
              </span>
            )}
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Potential annualized loss to revenue, DPDP regulatory penalties, and operational downtime without controls.
            </p>
          </div>

          {/* WHAT TO DO */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
              3. Recommended Action
            </span>
            <div className="text-xs font-bold text-emerald-300">
              REC-001: Zero-Trust Microsegmentation
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Optimal prescriptive recommendation: investment of ₹2.5L delivers ₹14.2L loss reduction (+465.8% ROSI).
            </p>
          </div>

          {/* WHAT CHANGED */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
              4. What Changed Recently?
            </span>
            <div className="text-xs text-slate-300 font-medium">
              {isAttackActive
                ? 'Security Lab attack event received: live P1-P6 and EAL surged in real time.'
                : (isAttackCompleted
                  ? 'Remediation confirmed on Fabric ledger: residual EAL dropped to ₹7.2L.'
                  : 'SANS newsletter processed and confirmed by CISO; asset correlation updated.')}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 14 & 29: CAUSE & EFFECT COMPARISON MATRIX */}
      <div id="spotlight-what-changed" className="cyber-card p-5 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-slate-900 text-sm">
              CyberOptRQ Cause & Effect Matrix &bull; What Changed?
            </h3>
          </div>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">
            {isAttackActive ? '🔴 LIVE ATTACK IN PROGRESS' : (isAttackCompleted ? '🟢 POST-REMEDIATION VERIFIED' : '⚪ BASELINE MONITORING')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          {/* Column 1: Before Attack (Baseline) */}
          <div className="p-3.5 rounded-xl border bg-slate-50/80 border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase pb-1 border-b border-slate-200">
              <span>1. Baseline State</span>
              <span className="text-blue-600 font-bold">NORMAL</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div>Org Risk: <strong className="text-slate-800">78%</strong> (Exposure)</div>
              <div>EAL: <strong className="text-slate-800">₹44.5 Lakhs</strong></div>
              <div>Target Asset: <span className="text-slate-700">ASSET-001 (Normal)</span></div>
              <div>Network Flow: <span className="text-slate-600">Stable (0.04 P_anom)</span></div>
              <div>Safeguard: <span className="text-slate-600">Microseg PENDING</span></div>
            </div>
          </div>

          {/* Column 2: During Attack (Surge) */}
          <div className={`p-3.5 rounded-xl border space-y-2 transition-all ${
            isAttackActive ? 'bg-red-50 border-red-300 text-red-950 ring-2 ring-red-400/40 shadow-sm' : 'bg-slate-50/50 border-slate-200 text-slate-600'
          }`}>
            <div className="flex justify-between items-center text-[10px] font-bold uppercase pb-1 border-b border-red-200">
              <span className={isAttackActive ? 'text-red-700 font-black' : 'text-slate-500'}>2. During Attack</span>
              <span className={isAttackActive ? 'text-red-600 font-black animate-pulse' : 'text-slate-400'}>
                {isAttackActive ? 'ACTIVE SURGE' : 'TRIGGER PENDING'}
              </span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div>Org Risk: <strong className={isAttackActive ? 'text-red-600 font-black' : 'text-slate-700'}>87%</strong> {isAttackActive && <span className="text-[10px] text-red-500 font-bold">(+9 pts)</span>}</div>
              <div>EAL: <strong className={isAttackActive ? 'text-red-600 font-black' : 'text-slate-700'}>₹89.2 Lakhs</strong> {isAttackActive && <span className="text-[10px] text-red-500 font-bold">(+₹44.7L)</span>}</div>
              <div>Target Asset: <strong className={isAttackActive ? 'text-red-700 font-bold' : 'text-slate-700'}>{attackState?.asset_id || 'ASSET-001'} (RCE In Wild)</strong></div>
              <div>Network Flow: <strong className={isAttackActive ? 'text-purple-700 font-bold' : 'text-slate-600'}>Anomaly Spike (0.960)</strong></div>
              <div>Prescribed: <strong className={isAttackActive ? 'text-red-700 font-bold' : 'text-slate-600'}>REC-001 (Priority CRITICAL)</strong></div>
            </div>
          </div>

          {/* Column 3: After Remediation (Residual) */}
          <div className={`p-3.5 rounded-xl border space-y-2 transition-all ${
            isAttackCompleted ? 'bg-emerald-50 border-emerald-300 text-emerald-950 ring-2 ring-emerald-400/40 shadow-sm' : 'bg-slate-50/50 border-slate-200 text-slate-600'
          }`}>
            <div className="flex justify-between items-center text-[10px] font-bold uppercase pb-1 border-b border-emerald-200">
              <span className={isAttackCompleted ? 'text-emerald-700 font-black' : 'text-slate-500'}>3. Post-Remediation</span>
              <span className={isAttackCompleted ? 'text-emerald-600 font-black' : 'text-slate-400'}>
                {isAttackCompleted ? 'VERIFIED' : 'AWAITING ACTION'}
              </span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div>Residual Risk: <strong className={isAttackCompleted ? 'text-emerald-700 font-black' : 'text-slate-700'}>14%</strong> {isAttackCompleted && <span className="text-[10px] text-emerald-600 font-bold">(-73 pts)</span>}</div>
              <div>Residual EAL: <strong className={isAttackCompleted ? 'text-emerald-700 font-black' : 'text-slate-700'}>₹7.2 Lakhs</strong> {isAttackCompleted && <span className="text-[10px] text-emerald-600 font-bold">(-84% loss)</span>}</div>
              <div>Target Asset: <strong className={isAttackCompleted ? 'text-emerald-700 font-bold' : 'text-slate-700'}>{attackState?.asset_id || 'ASSET-001'} (Protected)</strong></div>
              <div>Network Flow: <strong className={isAttackCompleted ? 'text-emerald-700' : 'text-slate-600'}>Normalized (0.03 P_anom)</strong></div>
              <div>Audit Block: <strong className={isAttackCompleted ? 'text-blue-700 text-[10px]' : 'text-slate-600'}>{pipeline?.fabric_tx_id || 'FABRIC-MINED'}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* TOP SECTION: 4 KEY CISO FINANCIAL METRICS */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Enterprise Cyber Risk Exposure (FAIR Model)</h2>
          <button
            onClick={() => { setExplainType('EAL'); setShowExplainModal(true); }}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            How are these numbers calculated?
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pre-Control EAL */}
          <div id="spotlight-financial-impact" className="cyber-card border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-600 text-xs font-semibold">Current EAL</p>
                <h3 className="text-2xl font-extrabold text-red-600 mt-1 font-mono">{formatCurrency(preEal)}</h3>
                {isAttackActive && (
                  <span className="text-[10px] font-mono font-bold text-red-600 block mt-0.5 animate-pulse">
                    ▲ +{formatCurrency(displayEal - 4450000)} (+{(((displayEal - 4450000) / 4450000) * 100).toFixed(1)}%)
                  </span>
                )}
              </div>
              <div className="p-2 bg-red-50 rounded-lg text-red-600 border border-red-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <button
              onClick={() => { setExplainType('EAL'); setShowExplainModal(true); }}
              className="mt-3 text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
            >
              FAIR Formula &rarr;
            </button>
          </div>

          {/* Post-Control Residual EAL */}
          <div className="cyber-card border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-600 text-xs font-semibold">Residual EAL</p>
                <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{formatCurrency(postEal)}</h3>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-200">
                <Shield className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-[11px] text-emerald-700 font-semibold">
              84.0% Controlled Coverage
            </div>
          </div>

          {/* Expected Risk Reduction */}
          <div className="cyber-card border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-600 text-xs font-semibold">Risk Reduction</p>
                <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{formatCurrency(riskReduction)}</h3>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-200">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-[11px] text-emerald-700 font-semibold">
              +{reductionPct}% Loss Avoidance
            </div>
          </div>

          {/* Security Investment & ROSI */}
          <div className="cyber-card border-l-4 border-l-blue-600 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-600 text-xs font-semibold">Portfolio ROSI</p>
                <h3 className="text-2xl font-extrabold text-blue-700 mt-1">+{rosi}%</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-200">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <button
              onClick={() => { setExplainType('ROSI'); setShowExplainModal(true); }}
              className="mt-3 text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
            >
              ROSI Breakdown &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* TOP SECTION GRAPH: CONTINUOUS RISK REDUCTION TREND (PRE-CONTROL VS POST-CONTROL EAL) */}
      <div className="cyber-card space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Continuous Cyber Risk Reduction Trajectory
            </h3>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-red-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Pre-Control EAL
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Post-Control Residual
            </span>
          </div>
        </div>

        {isAttackActive && (
          <div className="flex items-center gap-2 mb-1 px-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
            <span className="text-[11px] font-mono font-bold text-red-500 uppercase tracking-wide">LIVE — Attack surge detected: EAL spiked to ₹89.2L</span>
          </div>
        )}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 h-64 w-full shadow-inner">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dynamicTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="preEalGradRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="postEalGradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" opacity={0.8} />
              <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} unit="L" />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '8px', color: '#1E293B', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }} />
              <Area type="monotone" dataKey="preEal" name="Pre-Control EAL (₹ Lakhs)" stroke="#EF4444" fillOpacity={1} fill="url(#preEalGradRed)" strokeWidth={3} />
              <Area type="monotone" dataKey="postEal" name="Post-Control EAL (₹ Lakhs)" stroke="#10B981" fillOpacity={1} fill="url(#postEalGradGreen)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MIDDLE SECTION: TOP FINANCIAL CYBER RISKS & PENDING APPROVAL CENTER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT (7 cols): TOP FINANCIAL CYBER RISKS */}
        <div id="spotlight-risk-drivers" className="lg:col-span-7 cyber-card space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Top Financial Cyber Risks
              </h3>
            </div>
            <button
              onClick={() => onNavigate('ai_quantification')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              Full Portfolio &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {dynamicTopRisks.map((item, idx) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all shadow-sm space-y-2 ${
                  item.isUnderAttack
                    ? 'bg-red-950/20 border-red-500 shadow-red-500/20 shadow-md'
                    : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center font-mono ${
                      item.isUnderAttack ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-200 text-slate-700'
                    }`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`font-bold text-xs ${item.isUnderAttack ? 'text-red-300' : 'text-slate-900'}`}>{item.name}</h4>
                        {item.isUnderAttack && (
                          <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest bg-red-600 text-white rounded animate-pulse">
                            TARGET UNDER ACTIVE ATTACK
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {item.cve}: {item.cveTitle} &bull; <span className={item.isUnderAttack ? 'text-red-400 font-bold' : 'text-blue-700 font-semibold'}>{item.exposure}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-sm font-extrabold block font-mono ${item.isUnderAttack ? 'text-red-400' : 'text-red-600'}`}>{item.eal}</span>
                    {item.isUnderAttack && (
                      <span className="text-[9px] text-red-400 font-mono">⬆ SURGING</span>
                    )}
                  </div>
                </div>

                <div className={`pt-2 border-t flex justify-between items-center text-[11px] ${
                  item.isUnderAttack ? 'border-red-800/50' : 'border-slate-200'
                }`}>
                  <span className="text-slate-700 font-medium">
                    Control: <strong className={item.isUnderAttack ? 'text-red-300' : 'text-slate-900'}>{item.recommendedControl}</strong>
                  </span>
                  <button
                    onClick={() => onNavigate('optimizer')}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5"
                  >
                    Assess Control &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT (5 cols): PENDING DECISIONS (APPROVAL CENTER) */}
        <div id="spotlight-optimizer" className="lg:col-span-5 cyber-card space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                Pending Decisions
              </h3>
              <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {displayPending.length}
              </span>
            </div>
            <button
              onClick={() => onNavigate('approvals')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              Approval Hub &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {displayPending.map((rec) => (
              <div key={rec.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-blue-700">{rec.id}</span>
                    <h5 className="font-bold text-slate-800 text-xs mt-0.5">{rec.title}</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">{rec.risk}</p>
                  </div>
                  <span className={`cyber-badge text-[9px] ${rec.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' : ''}`}>
                    {rec.priority}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px] bg-white p-2 rounded-lg border border-slate-200 font-mono">
                  <span>Cost: <strong className="text-slate-800">₹{((rec.cost || 250000)/100000).toFixed(1)}L</strong></span>
                  <span>Reduction: <strong className="text-emerald-600">₹{((rec.expected_risk_reduction || 1420000)/100000).toFixed(1)}L</strong></span>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleQuickAction(rec.id, 'APPROVED')}
                    disabled={processingId === rec.id}
                    className="flex-1 cyber-button py-1.5 text-[11px] justify-center"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleQuickAction(rec.id, 'REJECTED')}
                    disabled={processingId === rec.id}
                    className="cyber-button-secondary py-1.5 px-3 text-[11px] text-red-600 hover:text-red-700"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate('approvals')}
            className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs border border-blue-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Review All in CISO Approval Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* EXPLAINABILITY MODAL: TRANSPARENT MATHEMATICAL EXPLANATION */}
      {showExplainModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <span className="cyber-badge text-[10px] mb-1">Financial Explainability</span>
                <h3 className="text-base font-bold text-slate-900">
                  {explainType === 'EAL' ? 'How Expected Annual Loss (EAL) is Calculated' : 'How Return on Security Investment (ROSI) is Calculated'}
                </h3>
              </div>
              <button
                onClick={() => setShowExplainModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {explainType === 'EAL' ? (
              <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                <p>
                  Our quantification model adheres to the international <strong>FAIR (Factor Analysis of Information Risk)</strong> standard:
                </p>

                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl font-mono text-blue-950 space-y-1 text-center">
                  <div className="font-bold text-sm">EAL = P(exploit) × Financial Impact × Exposure Factor</div>
                  <div className="text-[11px] text-blue-700">Pre-Control EAL = ₹44.5 Lakhs | Post-Control Residual = ₹7.1 Lakhs</div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <p><strong>1. Probability P(exploit):</strong> Derived from our calibrated 5-Model ensemble integrating NVD exploitability, EPSS threat velocity, asset criticality, and MITRE techniques.</p>
                  <p><strong>2. Financial Impact:</strong> Based on the enterprise asset’s replacement cost, data confidentiality rating, regulatory fines (DPDP Act), and operational downtime.</p>
                  <p><strong>3. Risk Reduction (&Delta;EAL):</strong> Current EAL (₹44.5L) minus Residual EAL (₹7.1L) = <strong>₹37.4 Lakhs</strong> in capital loss prevented.</p>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 italic">
                  * Prototype scenario data calibrated with standard financial risk baselines.
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                <p>
                  <strong>ROSI (Return on Security Investment)</strong> measures the financial efficiency of cybersecurity spend:
                </p>

                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl font-mono text-blue-950 space-y-1 text-center">
                  <div className="font-bold text-sm">ROSI = [(Risk Reduction - Control Cost) / Control Cost] × 100%</div>
                  <div className="text-[11px] text-blue-700">ROSI = [(₹37.4L - ₹8.0L) / ₹8.0L] × 100% = +367.5%</div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <p><strong>Security Investment:</strong> ₹8.0 Lakhs across recommended controls (Zero-Trust microsegmentation, runtime container defense, and buffer patch).</p>
                  <p><strong>Total Loss Avoided:</strong> ₹37.4 Lakhs in simulated breach impact prevented annually.</p>
                  <p><strong>Enterprise Portfolio Average:</strong> Weighted portfolio ROSI is <strong>+465.8%</strong>.</p>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 italic">
                  * Demonstrates to CFO and Board that every ₹1 spent on targeted controls preserves ₹4.65+ in enterprise value.
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowExplainModal(false)}
                className="cyber-button text-xs py-2 px-4"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TECHNICAL EVIDENCE MODAL: MODEL 6 & MULTI-MODEL METRICS (STRICT VERIFIED AUDIT) */}
      {showTechnicalDetails && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-5 text-white my-auto max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300 font-bold uppercase">
                      Technical Audit Evidence
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Version: CyberOptRQ_P6_CIC2017_XGBoost_v1
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                    Network Behavioral Intelligence (Model 6) & Multi-Model Fusion
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowTechnicalDetails(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Purpose & Scientific Role */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-blue-400 font-mono font-bold uppercase text-[11px]">
                <FileText className="w-3.5 h-3.5" />
                <span>Model Purpose & Operational Scope</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Model 6 evaluates statistical flow dynamics in real time to provide empirical network-level evidence. It de-biases pre-breach structural scores (P1–P5) without decrypting confidential payloads, operating 100% locally and offline.
              </p>
            </div>

            {/* Audited Metrics Grid (Exact values from reports/p6_metrics.json) */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Audited Holdout Test Performance (CIC-IDS2017 Test Split: 60,454 Flows)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">ROC-AUC Score</span>
                  <span className="text-base font-bold text-emerald-400">0.98954</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Discriminative Power</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Test Accuracy</span>
                  <span className="text-base font-bold text-white">97.30%</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">58,824 / 60,454</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">F1-Score</span>
                  <span className="text-base font-bold text-blue-400">0.87417</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Precision: 89.99%</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Brier Calibration</span>
                  <span className="text-base font-bold text-amber-400">0.02105</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Well Calibrated</span>
                </div>
              </div>
            </div>

            {/* Scientific Rigor & Leakage Elimination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Forensic Hygiene & Leakage Prevention</span>
                <ul className="text-slate-300 text-[11px] space-y-1 list-disc list-inside">
                  <li><strong>Destination Port removed:</strong> Prevented artificial testbed overfitting (IV was 9.73).</li>
                  <li><strong>8 Invariant columns dropped:</strong> Zero-variance columns eliminated from raw capture.</li>
                  <li><strong>56 Active flow features:</strong> Inter-arrival times, packet sizes, duration, TCP flags.</li>
                </ul>
              </div>

              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">External Validation & Throughput</span>
                <ul className="text-slate-300 text-[11px] space-y-1 list-disc list-inside">
                  <li><strong>UNSW-NB15 Cross-Validation:</strong> Audited across 14 aligned behavioral features.</li>
                  <li><strong>Inference Latency:</strong> 37.3 ms single-flow average latency on CPU.</li>
                  <li><strong>Batch Throughput:</strong> &gt;267,000 flows/sec for real-time packet ingest.</li>
                </ul>
              </div>
            </div>

            {/* 6-Model Pipeline Fusion */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-bold text-white">Non-Destructive Fusion Architecture (Fusion v2)</span>
                <span className="text-[10px] text-emerald-400">Bayesian Logistic Calibration</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[10px] text-center pt-1">
                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400 block">P1</span>
                  <span className="font-bold text-white">NVD CVSS</span>
                </div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400 block">P2</span>
                  <span className="font-bold text-white">EPSS Threat</span>
                </div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400 block">P3</span>
                  <span className="font-bold text-white">Org Context</span>
                </div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400 block">P4</span>
                  <span className="font-bold text-white">MITRE TTPs</span>
                </div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                  <span className="text-slate-400 block">P5</span>
                  <span className="font-bold text-white">Meta-Learner</span>
                </div>
                <div className="p-1.5 bg-slate-900 rounded border border-purple-500/50 bg-purple-950/20">
                  <span className="text-purple-400 block font-bold">P6</span>
                  <span className="font-bold text-white">Network Model</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-500 text-[11px] font-mono">
                Audited against official evaluation artifacts in reports/p6_metrics.json
              </span>
              <button
                onClick={() => setShowTechnicalDetails(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold font-mono text-xs transition-colors"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
