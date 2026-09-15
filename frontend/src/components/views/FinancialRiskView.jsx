import React from 'react';
import { DollarSign, PieChart as PieIcon, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function FinancialRiskView({ overview, assets }) {
  const chartData = assets.map(a => ({
    name: a.name.split(' ')[0],
    preEal: (a.financial_value * 0.35) / 100000,
    postEal: (a.financial_value * 0.05) / 100000,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            Financial Cyber Risk & Expected Annual Loss (EAL)
          </h2>
          <p className="text-slate-400 text-xs mt-1">EAL = P(Exploitation) &times; Financial Breach Impact | Quantitative Loss Distributions</p>
        </div>
        <span className="cyber-badge bg-emerald-950 text-emerald-400 border border-emerald-800">Fair Framework Aligned</span>
      </div>

      <div className="cyber-card">
        <h3 className="font-bold text-slate-200 text-sm mb-4">Asset-wise EAL Risk Exposure (₹ Lakhs)</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} unit="L" />
              <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="preEal" name="Pre-Control Loss Exposure" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="postEal" name="Post-Control Residual Loss" fill="#00F0FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
