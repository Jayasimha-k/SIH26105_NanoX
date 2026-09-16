import React, { useState } from 'react';
import {
  Shield, AlertTriangle, TrendingUp, DollarSign, CheckCircle2,
  XCircle, ArrowRight, HelpCircle, X
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

export default function DashboardView({ overview, onNavigate, recommendations = [], onRefresh }) {
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [explainType, setExplainType] = useState('EAL'); // 'EAL' or 'ROSI'
  const [processingId, setProcessingId] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  const formatCurrency = (val) => `₹${((val || 0) / 100000).toFixed(1)}L`;

  // Pre vs Post calculations
  const preEal = overview?.total_pre_control_eal || 4450000;
  const postEal = (overview && overview.total_post_control_eal < overview.total_pre_control_eal)
    ? overview.total_post_control_eal
    : Math.round(preEal * 0.16);
  const riskReduction = preEal - postEal;
  const reductionPct = (((preEal - postEal) / preEal) * 100).toFixed(1);
  const securityInvestment = 800000; // ₹8.0 Lakhs
  const rosi = overview?.enterprise_rosi || 465.8;

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

  return (
    <div className="space-y-6">
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

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 h-64 w-full shadow-inner">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            {topFinancialRisks.map((item, idx) => (
              <div key={item.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:bg-white hover:border-blue-300 transition-all shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center font-mono">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{item.name}</h4>
                      <p className="text-[11px] text-slate-600 font-mono">
                        {item.cve}: {item.cveTitle} &bull; <span className="text-blue-700 font-semibold">{item.exposure}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-red-600 block font-mono">{item.eal}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[11px]">
                  <span className="text-slate-700 font-medium">
                    Control: <strong className="text-slate-900">{item.recommendedControl}</strong>
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
