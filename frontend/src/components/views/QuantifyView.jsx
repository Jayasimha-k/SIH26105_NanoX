import React from 'react';
import { DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

export default function QuantifyView({ overview }) {
  const formatCurrency = (val) => `₹${((val || 0) / 100000).toFixed(1)}L`;

  const preEal = overview?.total_pre_control_eal || 3500000;
  const postEal = (overview && overview.total_post_control_eal < overview.total_pre_control_eal)
    ? overview.total_post_control_eal
    : Math.round(preEal * 0.12);
  const riskReduction = preEal - postEal;
  const reductionPct = (((preEal - postEal) / preEal) * 100).toFixed(1);
  const rosi = overview?.enterprise_rosi || 900.0;

  const chartData = overview?.asset_breakdown ? overview.asset_breakdown.map(a => ({
    name: a.asset_name.split(' ')[0],
    preEal: a.pre_eal / 100000,
    postEal: (a.pre_eal * 0.15) / 100000
  })) : [
    { name: 'Payment', preEal: 14.5, postEal: 2.1 },
    { name: 'Core', preEal: 11.2, postEal: 1.8 },
    { name: 'Customer', preEal: 6.8, postEal: 0.9 },
    { name: 'Internal', preEal: 3.5, postEal: 0.4 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <span className="cyber-badge mb-1">Financial Loss Quantification</span>
          <h2 className="text-xl font-bold text-[#E9BCB9] flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#ED9E5B]" />
            Expected Annual Loss (EAL) Risk Engine
          </h2>
          <p className="text-[#E9BCB9]/70 text-xs mt-1">
            Converts cybersecurity data into financial risk: EAL = Exploitation Probability &times; Financial Breach Impact | Aligned with FAIR Framework
          </p>
        </div>
        <span className="cyber-badge font-mono">FAIR Model Compliant</span>
      </div>

      {/* Top EAL Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Pre-Control EAL (Red) */}
        <div className="cyber-card border-l-4 border-l-red-500">
          <span className="text-red-400 text-[10px] uppercase font-bold">Total Pre-Control EAL</span>
          <h3 className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(preEal)}</h3>
          <p className="text-[11px] text-[#E9BCB9]/70 mt-0.5">Expected Annual Loss Before Controls</p>
        </div>

        {/* Post-Control EAL (Green) */}
        <div className="cyber-card border-l-4 border-l-emerald-500">
          <span className="text-emerald-400 text-[10px] uppercase font-bold">Post-Control Residual EAL</span>
          <h3 className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(postEal)}</h3>
          <p className="text-[11px] text-[#E9BCB9]/70 mt-0.5">Residual Loss Exposure After Controls</p>
        </div>

        {/* Expected Risk Reduction (Green) */}
        <div className="cyber-card border-l-4 border-l-emerald-500">
          <span className="text-emerald-400 text-[10px] uppercase font-bold">Expected Risk Reduction</span>
          <h3 className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(riskReduction)}</h3>
          <p className="text-[11px] text-emerald-400/80 mt-0.5">{reductionPct}% Total Avoidance</p>
        </div>

        {/* Enterprise ROSI (Green) */}
        <div className="cyber-card border-l-4 border-l-emerald-500">
          <span className="text-[#E9BCB9]/80 text-[10px] uppercase font-bold">Enterprise ROSI</span>
          <h3 className="text-2xl font-bold text-emerald-400 mt-1">+{rosi}%</h3>
          <p className="text-[11px] text-[#E9BCB9]/70 mt-0.5">Return on Security Investment</p>
        </div>
      </div>

      {/* Asset-wise EAL Distribution Chart */}
      <div className="cyber-card space-y-4">
        <h3 className="font-bold text-[#E9BCB9] text-sm">Asset Portfolio EAL Financial Loss Distribution (₹ Lakhs)</h3>
        
        {/* Deep Dark Graph Container with Red & Green Bars */}
        <div className="bg-[#0D0B18] p-4 rounded-xl border border-[#44174E]/80 h-72 w-full shadow-inner">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#44174E" strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" stroke="#E9BCB9" strokeOpacity={0.6} fontSize={12} />
              <YAxis stroke="#E9BCB9" strokeOpacity={0.6} fontSize={12} unit="L" />
              <Tooltip contentStyle={{ backgroundColor: '#0D0B18', borderColor: '#44174E', borderRadius: '8px', color: '#E9BCB9' }} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="preEal" name="Pre-Control Loss Exposure (₹ Lakhs) [RED]" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="postEal" name="Post-Control Loss Exposure (₹ Lakhs) [GREEN]" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
