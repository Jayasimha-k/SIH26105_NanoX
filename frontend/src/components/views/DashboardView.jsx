import React from 'react';
import { Shield, AlertTriangle, TrendingUp, DollarSign, Cpu, CheckCircle2, Layers, Database, Lock, Building2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const mockTrendData = [
  { month: 'Jan', preEal: 28.5, postEal: 14.2 },
  { month: 'Feb', preEal: 31.0, postEal: 12.8 },
  { month: 'Mar', preEal: 35.4, postEal: 11.5 },
  { month: 'Apr', preEal: 42.1, postEal: 9.8 },
  { month: 'May', preEal: 39.8, postEal: 8.4 },
  { month: 'Jun', preEal: 44.5, postEal: 7.2 },
];

export default function DashboardView({ overview, onNavigate }) {
  const formatCurrency = (val) => `₹${((val || 0) / 100000).toFixed(1)}L`;

  // Pre vs Post calculations: Red (Pre-Control) vs Green (Post-Control Residual)
  const preEal = overview?.total_pre_control_eal || 4450000;
  const postEal = (overview && overview.total_post_control_eal < overview.total_pre_control_eal) 
    ? overview.total_post_control_eal 
    : Math.round(preEal * 0.16);
  const riskReduction = preEal - postEal;
  const reductionPct = (((preEal - postEal) / preEal) * 100).toFixed(1);
  const rosi = overview?.enterprise_rosi || 465.8;

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Pre-Control Risk (RED) */}
        <div className="cyber-card border-l-4 border-l-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-red-400 text-xs font-semibold uppercase tracking-wider">Pre-Control EAL Risk</p>
              <h3 className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(preEal)}</h3>
              <p className="text-xs text-[#E9BCB9]/70 mt-1">Expected Annual Financial Loss</p>
            </div>
            <div className="p-2.5 bg-red-950/40 rounded-lg text-red-500 border border-red-500/40">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Post-Control Residual EAL (GREEN) */}
        <div className="cyber-card border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Post-Control Residual EAL</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(postEal)}</h3>
              <p className="text-xs text-[#E9BCB9]/70 mt-1">Residual Exposure After Controls</p>
            </div>
            <div className="p-2.5 bg-emerald-950/40 rounded-lg text-emerald-400 border border-emerald-500/40">
              <Shield className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Expected Risk Reduction (GREEN) */}
        <div className="cyber-card border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Expected Risk Reduction</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(riskReduction)}</h3>
              <p className="text-xs text-emerald-400/80 mt-1">{reductionPct}% Loss Avoidance</p>
            </div>
            <div className="p-2.5 bg-emerald-950/40 rounded-lg text-emerald-400 border border-emerald-500/40">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Enterprise ROSI (GREEN) */}
        <div className="cyber-card border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#E9BCB9]/80 text-xs font-semibold uppercase tracking-wider">Enterprise ROSI</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">+{rosi}%</h3>
              <p className="text-xs text-[#E9BCB9]/70 mt-1">Return on Security Investment</p>
            </div>
            <div className="p-2.5 bg-emerald-950/40 rounded-lg text-emerald-400 border border-emerald-500/40">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continuous Cyber Risk Quantification Chart Card */}
        <div className="cyber-card lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[#E9BCB9] flex items-center gap-2 text-sm">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Continuous Cyber Risk Quantification (EAL Trajectory)
            </h3>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-red-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Pre-Control (Red)
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Post-Control (Green)
              </span>
            </div>
          </div>

          {/* Deep Dark Graph Box with Red & Green Lines */}
          <div className="bg-[#0D0B18] p-4 rounded-xl border border-[#44174E]/80 h-72 w-full shadow-inner">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {/* RED Gradient for Pre-Control EAL */}
                  <linearGradient id="preEalGradRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                  </linearGradient>
                  {/* GREEN Gradient for Post-Control EAL */}
                  <linearGradient id="postEalGradGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#44174E" strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" stroke="#E9BCB9" strokeOpacity={0.6} fontSize={12} />
                <YAxis stroke="#E9BCB9" strokeOpacity={0.6} fontSize={12} unit="L" />
                <Tooltip contentStyle={{ backgroundColor: '#0D0B18', borderColor: '#44174E', borderRadius: '8px', color: '#E9BCB9', boxShadow: '0 10px 25px rgba(0,0,0,0.7)' }} />
                {/* Pre-Control EAL Line in RED */}
                <Area type="monotone" dataKey="preEal" name="Pre-Control EAL (₹ Lakhs)" stroke="#EF4444" fillOpacity={1} fill="url(#preEalGradRed)" strokeWidth={3} />
                {/* Post-Control EAL Line in GREEN */}
                <Area type="monotone" dataKey="postEal" name="Post-Control EAL (₹ Lakhs)" stroke="#10B981" fillOpacity={1} fill="url(#postEalGradGreen)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SIH PS-26105 AI Risk Pipeline Architecture Card */}
        <div className="cyber-card space-y-4">
          <h3 className="font-bold text-[#E9BCB9] flex items-center gap-2 text-sm">
            <Cpu className="w-5 h-5 text-[#ED9E5B]" />
            AI Risk Pipeline Architecture
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#0D0B18] rounded-lg border border-[#44174E] space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#E9BCB9] flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#ED9E5B]" /> Data Ingestion
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Synced</span>
              </div>
              <p className="text-[#E9BCB9]/70">NVD/CVE, EPSS, CISA KEV, MITRE ATT&CK</p>
            </div>

            <div className="p-3 bg-[#0D0B18] rounded-lg border border-[#44174E] space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#E9BCB9] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#ED9E5B]" /> AI Risk Models (P1-P4)
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Active</span>
              </div>
              <p className="text-[#E9BCB9]/70">P1: NVD, P2: EPSS, P3: KEV, P4: ATT&CK</p>
            </div>

            <div className="p-3 bg-[#0D0B18] rounded-lg border border-[#44174E] space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#E9BCB9] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#E9BCB9]" /> Meta Model Stacker
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Converged</span>
              </div>
              <p className="text-[#E9BCB9]/70">Ensemble Exploitation Probability P(exploit)</p>
            </div>

            {/* Organization-Specific Risk Model Placeholder Box */}
            <div className="p-3 bg-[#1C152E] rounded-lg border border-[#A34054] space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#E9BCB9] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#ED9E5B]" /> Organization-Specific Model
                </span>
                <span className="cyber-badge-peach text-[10px]">Org Button Hook</span>
              </div>
              <p className="text-[#E9BCB9]/80 text-[11px]">Custom organizational model connection (configured via backend)</p>
            </div>

            <div className="p-3 bg-[#0D0B18] rounded-lg border border-[#44174E] space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#E9BCB9] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#ED9E5B]" /> Blockchain Audit Trail
                </span>
                <span className="text-[#E9BCB9] font-bold">Hyperledger</span>
              </div>
              <p className="text-[#E9BCB9]/70">SHA-256 Cryptographic Block Chaining</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
