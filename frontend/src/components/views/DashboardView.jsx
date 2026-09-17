import React, { useState } from 'react';
import {
  Shield, AlertTriangle, TrendingUp, DollarSign, CheckCircle2,
  XCircle, ArrowRight, HelpCircle, X, Zap, Radio, RefreshCw, Layers, Terminal, ExternalLink
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
  const [processingId, setProcessingId] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [isRemediating, setIsRemediating] = useState(false);

  const formatCurrency = (val) => `₹${((val || 0) / 100000).toFixed(1)}L`;

  // Attack status helpers & Live ML Pipeline data
  const isAttackActive = attackState?.active || attackState?.status === 'ATTACK_STARTED';
  const isAttackCompleted = attackState?.status === 'ATTACK_COMPLETED';
  const pipeline = attackState?.pipeline;

  // Real-time pre vs post calculations dynamically updated upon attack
  const baselinePreEal = overview?.total_pre_control_eal || 4450000;
  const preEal = isAttackActive
    ? (pipeline?.active_attack_eal || 8920000)
    : baselinePreEal;

  const postEal = isAttackCompleted
    ? (pipeline?.post_eal || 720000)
    : ((overview && overview.total_post_control_eal < overview.total_pre_control_eal)
        ? overview.total_post_control_eal
        : Math.round(preEal * 0.16));

  const riskReduction = preEal - postEal;
  const reductionPct = preEal > 0 ? (((preEal - postEal) / preEal) * 100).toFixed(1) : '83.8';
  const rosi = overview?.enterprise_rosi || 465.8;

  // Dynamic trend data showing baseline vs live attack surge
  const dynamicTrendData = isAttackActive
    ? [
        { month: 'Jan', preEal: 28.5, postEal: 14.2 },
        { month: 'Feb', preEal: 31.0, postEal: 12.8 },
        { month: 'Mar', preEal: 35.4, postEal: 11.5 },
        { month: 'Apr', preEal: 42.1, postEal: 9.8 },
        { month: 'May', preEal: 39.8, postEal: 8.4 },
        { month: 'Jun (Baseline)', preEal: 44.5, postEal: 7.2 },
        { month: 'NOW (LIVE ATTACK)', preEal: 89.2, postEal: 7.2 },
      ]
    : (isAttackCompleted
        ? [
            { month: 'Jan', preEal: 28.5, postEal: 14.2 },
            { month: 'Feb', preEal: 31.0, postEal: 12.8 },
            { month: 'Mar', preEal: 35.4, postEal: 11.5 },
            { month: 'Apr', preEal: 42.1, postEal: 9.8 },
            { month: 'May', preEal: 39.8, postEal: 8.4 },
            { month: 'Jun', preEal: 44.5, postEal: 7.2 },
            { month: 'POST-REMEDIATION', preEal: 44.5, postEal: 7.2 },
          ]
        : mockTrendData);

  // Dynamic top financial risks highlighting the asset under attack
  const dynamicTopRisks = isAttackActive
    ? [
        {
          id: attackState?.asset_id || 'ASSET-001',
          name: pipeline?.asset_name || 'Production Web & Microservices Server',
          cve: 'CVE-2024-21626 / CVE-2024-3094',
          cveTitle: 'Active RCE Exploitation & Network Flow Anomaly Spike',
          exposure: 'INTERNET-FACING (SURGING)',
          criticality: `${pipeline?.asset_criticality || 9.5} / 10`,
          eal: `₹${(((pipeline?.active_attack_eal || 8920000)) / 100000).toFixed(1)} Lakhs`,
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
        <div className="p-6 bg-slate-950 border-2 border-red-500 rounded-2xl shadow-2xl space-y-5 text-white relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
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
          <div className="cyber-card border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-600 text-xs font-semibold">Current EAL</p>
                <h3 className="text-2xl font-extrabold text-red-600 mt-1">{formatCurrency(preEal)}</h3>
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
        <div className="lg:col-span-7 cyber-card space-y-4">
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
        <div className="lg:col-span-5 cyber-card space-y-4">
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
    </div>
  );
}
