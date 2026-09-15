import React from 'react';
import { Shield, DollarSign, Clock, CheckCircle } from 'lucide-react';

export default function ControlsView({ controls }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-400" />
            Security Controls Catalog
          </h2>
          <p className="text-slate-400 text-xs mt-1">Control costs, risk reduction factors (&gamma;), and prerequisite dependencies</p>
        </div>
        <span className="cyber-badge bg-cyan-950 text-cyan-400 border border-cyan-800">5 Available Controls</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {controls.map((c) => (
          <div key={c.id} className="cyber-card space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono text-cyan-400">{c.code} ({c.id})</span>
                <h3 className="font-bold text-slate-100 text-sm mt-0.5">{c.name}</h3>
              </div>
              <span className="cyber-badge bg-slate-800 text-slate-300">{c.category}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Implementation Cost</span>
                <span className="font-bold text-emerald-400 text-sm">₹{(c.cost / 100000).toFixed(1)} Lakhs</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Effectiveness</span>
                <span className="font-bold text-cyan-400 text-sm">{(c.effectiveness * 100).toFixed(0)}% Reduction</span>
              </div>
            </div>

            <div className="space-y-2 text-xs border-t border-slate-800 pt-3 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Implementation SLA:</span>
                <span className="font-mono text-slate-200">{c.implementation_time_days} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <span className={`cyber-badge text-[10px] ${c.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  {c.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
