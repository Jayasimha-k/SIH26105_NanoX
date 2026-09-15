import React from 'react';
import {
  LayoutDashboard, ShieldAlert, Server, Cpu, DollarSign,
  Shield, Sliders, Zap, Award, CheckCircle2, Activity,
  Wrench, Lock, LineChart, FolderTree
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
  { id: 'vulnerabilities', label: 'Vulnerability Intelligence', icon: ShieldAlert },
  { id: 'assets', label: 'Asset Exposure Inventory', icon: Server },
  { id: 'predictions', label: 'Plug-and-Play AI Predictions', icon: Cpu },
  { id: 'financial', label: 'Financial Risk & EAL', icon: DollarSign },
  { id: 'controls', label: 'Security Controls Catalog', icon: Shield },
  { id: 'optimizer', label: 'PuLP Budget Optimizer', icon: Zap },
  { id: 'whatif', label: 'What-If Sensitivity Analysis', icon: Sliders },
  { id: 'recommendations', label: 'Prioritized Recommendations', icon: Award },
  { id: 'approvals', label: 'CISO Approval Workflow', icon: CheckCircle2 },
  { id: 'realtime', label: 'Real-Time Activity Stream', icon: Activity },
  { id: 'execution', label: 'Implementation Tracking', icon: Wrench },
  { id: 'audit', label: 'Blockchain Audit Ledger', icon: Lock },
  { id: 'performance', label: 'Model Performance Metrics', icon: LineChart },
  { id: 'config', label: 'Plug & Play Architecture', icon: FolderTree },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-64 bg-[#0E131F] border-r border-slate-800 p-4 flex flex-col justify-between sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">Platform Modules</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/80 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-400">
        <span className="text-emerald-400 font-bold block mb-0.5">● Engine Operational</span>
        <span>FastAPI + PuLP + Ledger Active</span>
      </div>
    </aside>
  );
}
