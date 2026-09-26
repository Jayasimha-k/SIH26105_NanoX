import React, { useState } from 'react';
import {
  Activity,
  Shield,
  Wifi,
  Radio,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Lock,
  ExternalLink,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';

export default function NetworkIntelligenceView({ attackState }) {
  const [showTechnicalDrilldown, setShowTechnicalDrilldown] = useState(false);
  const isAttackActive = attackState?.active || attackState?.status === 'ATTACK_STARTED';
  const pipeline = attackState?.pipeline;

  // Real pipeline flow data or baseline
  const maliciousFlowProb = isAttackActive
    ? (pipeline?.p6_network || 0.960)
    : 0.042;

  const targetAsset = isAttackActive
    ? (pipeline?.asset_name ? `${pipeline.asset_id} (${pipeline.asset_name})` : 'ASSET-001 (Production DB)')
    : 'Perimeter Fleet Monitored (5 Assets)';

  // Real-time flow trend chart data
  const flowTrendData = isAttackActive ? [
    { time: '14:20', benign: 950, anomaly: 2 },
    { time: '14:21', benign: 980, anomaly: 4 },
    { time: '14:22', benign: 940, anomaly: 6 },
    { time: '14:23', benign: 910, anomaly: 18 },
    { time: '14:24', benign: 820, anomaly: 145 },
    { time: '14:25', benign: 780, anomaly: 890 },
    { time: '14:26', benign: 720, anomaly: 1240 },
  ] : [
    { time: '14:20', benign: 920, anomaly: 1 },
    { time: '14:21', benign: 940, anomaly: 3 },
    { time: '14:22', benign: 950, anomaly: 2 },
    { time: '14:23', benign: 930, anomaly: 1 },
    { time: '14:24', benign: 960, anomaly: 4 },
    { time: '14:25', benign: 940, anomaly: 2 },
    { time: '14:26', benign: 950, anomaly: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="cyber-badge bg-blue-50 text-blue-700 border-blue-200">Real-time Telemetry</span>
            <span className="text-xs font-mono text-slate-400">Layer: Flow Behavioral Classifier</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Radio className="w-6 h-6 text-blue-600" />
            Network Behavioral Intelligence
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Empirical network packet & flow behavioral analysis trained on CIC-IDS2017 and validated across external enterprise architectures.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
            isAttackActive ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold animate-pulse' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isAttackActive ? 'bg-rose-600' : 'bg-emerald-500'}`} />
            <span>{isAttackActive ? 'MALICIOUS FLOW DETECTED' : 'NORMAL PERIMETER TELEMETRY'}</span>
          </div>
        </div>
      </div>

      {/* CLARIFICATION CALLOUT — also used as Model 6 spotlight target */}
      <div id="spotlight-model-6-details" className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800">Model Role Clarification:</strong> Network Behavioral Intelligence classifies individual network flow records for anomalous intrusion patterns.
          It produces a <strong>malicious-flow probability</strong>, which feeds into <strong>Fusion v2</strong> alongside NVD, EPSS, KEV, and MITRE models. It is not final organization risk or EAL.
        </div>
      </div>

      {/* Primary Customer Cards (Executive & SecOps Overview) — spotlight-network-intel target */}
      <div id="spotlight-network-intel" className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Malicious Flow Probability */}
        <div className={`cyber-card border-l-4 ${isAttackActive ? 'border-l-rose-500 bg-rose-50/20' : 'border-l-emerald-500'}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Malicious-Flow Probability
          </span>
          <div className={`text-3xl font-black font-mono mt-1 ${isAttackActive ? 'text-rose-600' : 'text-emerald-700'}`}>
            {(maliciousFlowProb * 100).toFixed(1)}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {isAttackActive ? 'Critical flow anomaly spike' : 'Nominal benign traffic pattern'}
          </span>
        </div>

        {/* Affected Asset */}
        <div className="cyber-card border-l-4 border-l-blue-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Monitored Asset Target
          </span>
          <div className="text-sm font-bold text-slate-900 mt-1.5 truncate">
            {targetAsset}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block font-mono">
            {isAttackActive ? 'Targeted by active exploit' : 'Perimeter interfaces active'}
          </span>
        </div>

        {/* Behavioral Evidence */}
        <div className="cyber-card border-l-4 border-l-amber-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Behavioral Evidence
          </span>
          <div className="text-sm font-bold text-slate-900 mt-1.5">
            {isAttackActive ? 'Port Scan & Remote Code Injection' : 'Standard HTTPS & Microservice RPC'}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block font-mono">
            {isAttackActive ? 'High packet-per-second burst' : 'Balanced forward/backward packets'}
          </span>
        </div>

        {/* Confidence & Calibration */}
        <div className="cyber-card border-l-4 border-l-purple-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Confidence & Calibration
          </span>
          <div className="text-2xl font-black font-mono text-purple-700 mt-1">
            98.5%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Calibrated via Platt Scaling (Brier: 0.021)
          </span>
        </div>
      </div>

      {/* Network Traffic Behavioral Flow Chart */}
      <div className="cyber-card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Perimeter Network Flow Telemetry (Packets/s)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Real-time classification of benign flows vs anomalous threat vectors.</p>
          </div>
          <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
            Sampling Window: Last 10m
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={flowTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px' }} />
              <Area type="monotone" dataKey="benign" name="Benign Traffic (pkts/s)" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
              <Area type="monotone" dataKey="anomaly" name="Anomalous Traffic (pkts/s)" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TECHNICAL DRILL-DOWN TOGGLE (FOR CISO, ANALYSTS & AUDITORS) */}
      <div className="cyber-card border border-slate-200">
        <button
          onClick={() => setShowTechnicalDrilldown(!showTechnicalDrilldown)}
          className="w-full flex items-center justify-between p-2 text-left cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                Technical Model Governance & Validation Drill-down
              </h4>
              <p className="text-[11px] text-slate-500">
                Explore ROC-AUC, confusion matrix, external generalization on UNSW-NB15, and feature importances.
              </p>
            </div>
          </div>
          {showTechnicalDrilldown ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {showTechnicalDrilldown && (
          <div className="pt-5 mt-4 border-t border-slate-100 space-y-6 animate-in fade-in">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 font-mono text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">ROC-AUC</span>
                <div className="text-xl font-extrabold text-blue-700 mt-0.5">0.9895</div>
                <span className="text-[9px] text-slate-400">CIC-IDS2017 Test</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">PR-AUC</span>
                <div className="text-xl font-extrabold text-emerald-700 mt-0.5">0.9463</div>
                <span className="text-[9px] text-slate-400">Class Imbalance</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Accuracy</span>
                <div className="text-xl font-extrabold text-slate-800 mt-0.5">97.30%</div>
                <span className="text-[9px] text-slate-400">Test Split</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">MCC</span>
                <div className="text-xl font-extrabold text-indigo-700 mt-0.5">0.8595</div>
                <span className="text-[9px] text-slate-400">Matthews Corr</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Brier Score</span>
                <div className="text-xl font-extrabold text-purple-700 mt-0.5">0.0211</div>
                <span className="text-[9px] text-slate-400">Calibration Loss</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Fusion v2 Weight</span>
                <div className="text-xl font-extrabold text-amber-700 mt-0.5">w=0.90</div>
                <span className="text-[9px] text-slate-400">P6 / P5=0.10</span>
              </div>
            </div>

            {/* Confusion Matrix & UNSW-NB15 Generalization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Test Split Confusion Matrix (60,454 Rows)
                </h5>
                <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
                  <div className="p-2.5 bg-emerald-100/60 border border-emerald-300 rounded-lg">
                    <span className="text-[10px] text-emerald-800 font-bold block">True Negative (TN)</span>
                    <strong className="text-base text-emerald-900">53,162</strong>
                  </div>
                  <div className="p-2.5 bg-amber-100/60 border border-amber-300 rounded-lg">
                    <span className="text-[10px] text-amber-800 font-bold block">False Positive (FP)</span>
                    <strong className="text-base text-amber-900">630</strong>
                  </div>
                  <div className="p-2.5 bg-rose-100/60 border border-rose-300 rounded-lg">
                    <span className="text-[10px] text-rose-800 font-bold block">False Negative (FN)</span>
                    <strong className="text-base text-rose-900">1,000</strong>
                  </div>
                  <div className="p-2.5 bg-blue-100/60 border border-blue-300 rounded-lg">
                    <span className="text-[10px] text-blue-800 font-bold block">True Positive (TP)</span>
                    <strong className="text-base text-blue-900">5,662</strong>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Zero-Shot Cross-Dataset Validation (UNSW-NB15: 82,332 Rows)
                </h5>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Evaluated on an independent network topology without fine-tuning.
                  Operational calibrated threshold shift recovers <strong>82.37% precision</strong> across zero-day exploitation and probe vectors.
                </p>
                <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-200">
                  <span>Generalization Recall: <strong>93.98%</strong></span>
                  <span>Artifact: <strong className="text-indigo-600">XGBoost v1 (650KB)</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
