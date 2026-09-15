import React from 'react';
import { Shield, UserCheck, Activity, Bell } from 'lucide-react';

export default function Header({ currentRole, setCurrentRole, wsStatus }) {
  return (
    <header className="h-16 bg-[#111827]/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-tr from-cyan-600 to-purple-600 rounded-lg shadow-lg shadow-cyan-500/20">
          <Shield className="w-5 h-5 text-slate-950 font-bold" />
        </div>
        <div>
          <h1 className="font-extrabold text-slate-100 tracking-wide text-sm flex items-center gap-2">
            CyberOpt-RQ
            <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded font-mono font-normal">v1.0.0</span>
          </h1>
          <p className="text-[11px] text-slate-400">AI Cyber Risk Quantification & Investment Optimizer</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* WebSocket Realtime Status */}
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
          <span className={`w-2 h-2 rounded-full ${wsStatus === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-slate-300 font-mono text-[11px]">WS: {wsStatus}</span>
        </div>

        {/* RBAC Role Switcher Dropdown */}
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <UserCheck className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-400 text-xs font-semibold">Active Role:</span>
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value)}
            className="bg-transparent text-cyan-400 font-bold text-xs focus:outline-none cursor-pointer"
          >
            <option value="CISO" className="bg-slate-900 text-slate-200">CISO (Chief Information Security Officer)</option>
            <option value="SOC" className="bg-slate-900 text-slate-200">SOC Analyst (Security Operations)</option>
            <option value="IT" className="bg-slate-900 text-slate-200">IT Remediation Team</option>
          </select>
        </div>
      </div>
    </header>
  );
}
