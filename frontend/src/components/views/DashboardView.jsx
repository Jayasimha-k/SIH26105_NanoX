import React from 'react';
import { Shield, AlertTriangle, TrendingUp, DollarSign, Cpu, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const mockTrendData = [
  { month: 'Jan', preEal: 28.5, postEal: 14.2 },
  { month: 'Feb', preEal: 31.0, postEal: 12.8 },
  { month: 'Mar', preEal: 35.4, postEal: 11.5 },
  { month: 'Apr', preEal: 42.1, postEal: 9.8 },
  { month: 'May', preEal: 39.8, postEal: 8.4 },
  { month: 'Jun', preEal: 44.5, postEal: 7.2 },
];

export default function DashboardView({ overview, onNavigate }) {
  const formatCurrency = (val) => `₹${(val / 100000).toFixed(1)}L`;

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="cyber-card border-l-4 border-l-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Pre-Control EAL Risk</p>
              <h3 className="text-2xl font-bold text-red-400 mt-1">{overview ? formatCurrency(overview.total_pre_control_eal) : '₹44.5L'}</h3>
              <p className="text-xs text-slate-400 mt-1">Expected Annual Financial Loss</p>
            </div>
            <div className="p-2.5 bg-red-500/10 rounded-lg text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="cyber-card border-l-4 border-l-cyan-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Post-Control Residual EAL</p>
              <h3 className="text-2xl font-bold text-cyan-400 mt-1">{overview ? formatCurrency(overview.total_post_control_eal) : '₹7.2L'}</h3>
              <p className="text-xs text-slate-400 mt-1">Residual Exposure After Controls</p>
            </div>
            <div className="p-2.5 bg-cyan-500/10 rounded-lg text-cyan-400">
              <Shield className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="cyber-card border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Expected Risk Reduction</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{overview ? formatCurrency(overview.total_risk_reduction) : '₹37.3L'}</h3>
              <p className="text-xs text-emerald-400 mt-1">83.8% Total Loss Avoidance</p>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="cyber-card border-l-4 border-l-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Enterprise ROSI</p>
              <h3 className="text-2xl font-bold text-purple-400 mt-1">{overview ? `${overview.enterprise_rosi}%` : '+465.8%'}</h3>
              <p className="text-xs text-purple-400 mt-1">Return on Security Investment</p>
            </div>
            <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="cyber-card lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Continuous Cyber Risk Quantification (EAL Trajectory)
            </h3>
            <span className="cyber-badge bg-cyan-950 text-cyan-400 border border-cyan-800">Real-Time ML Pipeline</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="preEalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="postEalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} unit="L" />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="preEal" name="Pre-Control EAL (₹ Lakhs)" stroke="#EF4444" fillOpacity={1} fill="url(#preEalGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="postEal" name="Post-Control EAL (₹ Lakhs)" stroke="#00F0FF" fillOpacity={1} fill="url(#postEalGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plug & Play ML Architecture Badge */}
        <div className="cyber-card space-y-4">
          <h3 className="font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            Plug-and-Play ML Status
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-300">Base Model 1 (Exploitability)</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Ready</span>
              </div>
              <p className="text-slate-400">XGBoost Classifier v1.2.0 (ROC-AUC 0.943)</p>
            </div>

            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-300">Base Model 2 (Threat Intel)</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Ready</span>
              </div>
              <p className="text-slate-400">LightGBM Classifier v1.1.4 (ROC-AUC 0.925)</p>
            </div>

            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-300">Base Model 3 (Asset Reachability)</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Ready</span>
              </div>
              <p className="text-slate-400">Random Forest Regressor v2.0.1 (ROC-AUC 0.958)</p>
            </div>

            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-300">Base Model 4 (Blast Radius)</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Ready</span>
              </div>
              <p className="text-slate-400">Deep Neural Network v1.0.8 (ROC-AUC 0.918)</p>
            </div>

            <div className="p-3 bg-cyan-950/40 rounded-lg border border-cyan-800 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-cyan-300">Meta Model (Ensemble Stacker)</span>
                <span className="text-cyan-400 font-bold">Converged</span>
              </div>
              <p className="text-cyan-200">Logistic Stacker v2.1.0 (ROC-AUC 0.976)</p>
            </div>
          </div>

          <button onClick={() => onNavigate('ml')} className="w-full cyber-button-secondary text-xs">
            Inspect ML Adapter Architecture &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
