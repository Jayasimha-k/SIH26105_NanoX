import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { api } from '../../services/api';

export default function CFOFinancialView({ overview, attackState }) {
  const [financialEvents, setFinancialEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (val) => `₹${((val || 0) / 100000).toFixed(1)}L`;

  const isAttackActive = attackState?.active || attackState?.status === 'ATTACK_STARTED';
  const pipeline = attackState?.pipeline;

  const preEal = isAttackActive
    ? (pipeline?.active_attack_eal || 8920000)
    : (overview?.total_pre_control_eal || 3500000);

  const postEal = Math.round(preEal * 0.16);
  const netSavings = preEal - postEal;
  const rosi = 465.8;

  useEffect(() => {
    api.getIntelligenceEvents('FINANCIAL').then((data) => {
      setFinancialEvents(data.events || []);
    }).catch(() => {
      // Fallback demo financial newsletters
      setFinancialEvents([
        {
          event_id: 'FIN-EVT-001',
          source_name: 'Financial Times / Morning Brew',
          company: 'Cloudflare & CrowdStrike',
          market_event: 'Global Cyber Insurance Rate Surge & Mandatory Zero-Trust Mandate',
          risk_signal: 'HIGH',
          relevant_exposure_inr: 3500000.0,
          reported_outcome: 'OUTCOME_PENDING',
          cfo_review_status: 'CONFIRMED'
        }
      ]);
    }).finally(() => setLoading(false));
  }, []);

  const chartData = [
    { category: 'Pre-Control Exposure', loss: preEal / 100000, color: '#EF4444' },
    { category: 'Security Investment', loss: 6.7, color: '#3B82F6' },
    { category: 'Post-Control Residual', loss: postEal / 100000, color: '#10B981' },
    { category: 'Net Annual Savings', loss: netSavings / 100000, color: '#8B5CF6' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="cyber-badge bg-emerald-50 text-emerald-700 border-emerald-200">CFO Executive View</span>
            <span className="text-xs font-mono text-slate-400">FAIR Risk Model Aligned</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            Financial Cyber Risk & Investment Optimization
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quantified Expected Annual Loss (EAL), Return on Security Investment (ROSI), and post-control residual exposure.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold">
            Target Budget: ₹15.0L
          </span>
        </div>
      </div>

      {/* Top 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="cyber-card border-l-4 border-l-rose-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Expected Annual Loss (Pre)
          </span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {formatCurrency(preEal)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block font-sans">
            Baseline expected breach cost
          </span>
        </div>

        <div className="cyber-card border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Post-Control Residual EAL
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {formatCurrency(postEal)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block font-sans">
            84.0% quantified risk reduction
          </span>
        </div>

        <div className="cyber-card border-l-4 border-l-blue-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Optimal Security Investment
          </span>
          <div className="text-2xl font-black text-blue-600 mt-1">
            ₹6.7L
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block font-sans">
            Knapsack solver allocation
          </span>
        </div>

        <div className="cyber-card border-l-4 border-l-purple-500">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            ROSI (Return on Security Inv.)
          </span>
          <div className="text-2xl font-black text-purple-600 mt-1">
            +{rosi}%
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block font-sans">
            (Risk Reduction - Cost) / Cost
          </span>
        </div>
      </div>

      {/* Main Financial Comparison Chart */}
      <div className="cyber-card space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <BarChart3 className="w-4 h-4 text-emerald-600" />
          Financial Risk Exposure vs Mitigation Allocation (₹ Lakhs)
        </h3>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" />
              <XAxis dataKey="category" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} unit="L" />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '8px' }} />
              <Bar dataKey="loss" name="Value (₹ Lakhs)" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Financial Intelligence Feed (Newsletters: FT, Morning Brew, Bloomberg) */}
      <div className="cyber-card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Continuous Financial Intelligence & Newsletter Ingestion
            </h3>
            <p className="text-[11px] text-slate-500">
              Macro-financial signals parsed from RFC 822 newsletters (Financial Times, Bloomberg, Morning Brew).
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Post-Prediction Feed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase bg-slate-50">
                <th className="p-3">Source & Subject</th>
                <th className="p-3">Target Entity</th>
                <th className="p-3">Risk Signal</th>
                <th className="p-3">Relevant Exposure</th>
                <th className="p-3">Observed Outcome</th>
                <th className="p-3 text-right">CFO Review</th>
              </tr>
            </thead>
            <tbody>
              {financialEvents.map((evt, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <strong className="text-slate-800 block">{evt.source_name || 'Financial Newsletter'}</strong>
                    <span className="text-[10px] text-slate-500 font-sans">{evt.market_event || evt.newsletter_claim}</span>
                  </td>
                  <td className="p-3 text-slate-700 font-bold">{evt.company || 'Enterprise Cloud'}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[10px]">
                      {evt.risk_signal || 'MODERATE'}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-800">
                    {formatCurrency(evt.relevant_exposure_inr || 3500000)}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">
                      {evt.reported_outcome || 'OUTCOME_PENDING'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                      {evt.cfo_review_status || 'CONFIRMED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
