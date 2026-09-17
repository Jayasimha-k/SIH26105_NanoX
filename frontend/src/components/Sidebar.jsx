import React from 'react';
import {
  LayoutDashboard, Database, Server, DollarSign, Zap,
  ShieldCheck, Wrench, RefreshCcw, Lock, Award, Eye,
  AlertOctagon, CheckSquare, Layers, FileText, Brain
} from 'lucide-react';

const roleMenus = {
  CISO: [
    { id: 'dashboard', label: 'Executive Risk Overview', icon: LayoutDashboard },
    { id: 'threat_intel', label: 'Threat Intelligence', icon: Database },
    { id: 'ai_quantification', label: 'Financial Risk (FAIR EAL)', icon: DollarSign },
    { id: 'continual_learning', label: 'Continual Learning (Governance)', icon: Brain },
    { id: 'optimizer', label: 'Investment Optimization', icon: Zap },
    { id: 'approvals', label: 'Approval Center', icon: ShieldCheck },
    { id: 'audit', label: 'Audit & Compliance', icon: Lock }
  ],
  SOC: [
    { id: 'threat_intel', label: 'Threat Intelligence', icon: Database },
    { id: 'vulnerabilities', label: 'Active Vulnerabilities', icon: AlertOctagon },
    { id: 'asset_inventory', label: 'Asset Exposure', icon: Server },
    { id: 'ai_risk', label: 'AI Risk Assessment', icon: Eye },
    { id: 'continual_learning', label: 'Evidence & Learning', icon: Brain },
    { id: 'incidents', label: 'Incident & Loss Log', icon: FileText }
  ],
  Security: [
    { id: 'ai_quantification', label: 'Risk Assessment', icon: Eye },
    { id: 'asset_inventory', label: 'Asset Risk Portfolio', icon: Server },
    { id: 'continual_learning', label: 'Continual Learning & Drift', icon: Brain },
    { id: 'optimizer', label: 'Control Optimization', icon: Zap },
    { id: 'recalculate', label: 'What-If Analysis', icon: RefreshCcw },
    { id: 'recommendations', label: 'Prioritized Recommendations', icon: Award },
    { id: 'model_evidence', label: 'Model Evidence (5 Models)', icon: Layers }
  ],
  IT: [
    { id: 'execution', label: 'My Remediation Queue', icon: Wrench },
    { id: 'approved_controls', label: 'Approved Controls', icon: CheckSquare },
    { id: 'tracking', label: 'Implementation Tracking', icon: RefreshCcw },
    { id: 'recalculate', label: 'Verification & Recalculation', icon: ShieldCheck }
  ]
};

export default function Sidebar({ activeTab, setActiveTab, currentRole = 'CISO' }) {
  const currentNavItems = roleMenus[currentRole] || roleMenus.CISO;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col justify-between sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="space-y-1">
        <div className="px-3 py-2 mb-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            {currentRole === 'CISO' && 'CISO Workspace'}
            {currentRole === 'SOC' && 'SOC Operations'}
            {currentRole === 'Security' && 'Security Lead'}
            {currentRole === 'IT' && 'IT Remediation'}
          </span>
          <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{currentRole}</span>
        </div>

        {currentNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm font-bold'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>Decision Engine</span>
        </div>
        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">v1.0</span>
      </div>
    </aside>
  );
}
