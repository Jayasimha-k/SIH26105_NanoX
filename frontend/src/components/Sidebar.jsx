import React from 'react';
import {
  LayoutDashboard, Database, Server, DollarSign, Zap,
  ShieldCheck, Wrench, RefreshCcw, Lock, Award
} from 'lucide-react';

const allNavItems = [
  { id: 'dashboard', label: 'Executive Overview', icon: LayoutDashboard, roles: ['CISO'] },
  { id: 'threat_intel', label: 'Threat Intelligence & CVEs', icon: Database, roles: ['SOC'] },
  { id: 'asset_inventory', label: 'Enterprise Asset Portfolio', icon: Server, roles: ['SOC', 'Security', 'IT'] },
  { id: 'ai_quantification', label: 'AI Risk & EAL Quantification', icon: DollarSign, roles: ['CISO', 'Security', 'SOC'] },
  { id: 'optimizer', label: 'Security Investment Optimizer', icon: Zap, roles: ['CISO', 'Security'] },
  { id: 'approvals', label: 'CISO Decision & Approval Hub', icon: ShieldCheck, roles: ['CISO'] },
  { id: 'execution', label: 'Remediation & Execution Queue', icon: Wrench, roles: ['IT'] },
  { id: 'recalculate', label: 'Continuous Risk Recalculation', icon: RefreshCcw, roles: ['SOC', 'Security', 'IT'] },
  { id: 'audit', label: 'Decentralized Blockchain Ledger', icon: Lock, roles: ['CISO', 'Security', 'IT', 'SOC'] },
  { id: 'business_value', label: 'Business Value & Compliance', icon: Award, roles: ['CISO'] },
];

export default function Sidebar({ activeTab, setActiveTab, currentRole = 'CISO' }) {
  // Strictly filter navigation items so each role sees ONLY their dedicated modules
  const roleNavItems = allNavItems.filter((item) => item.roles.includes(currentRole));

  return (
    <aside className="w-64 bg-[#0A0914] border-r border-[#44174E] p-4 flex flex-col justify-between sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="space-y-1">
        <div className="px-3 py-2 mb-3 bg-[#141124] rounded-xl border border-[#44174E] flex items-center justify-between shadow-inner">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#ED9E5B]">Role Dedicated Menu</p>
          <span className="cyber-badge-peach text-[9px] px-2 py-0.5 font-bold">{currentRole}</span>
        </div>

        {roleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#A34054] to-[#8A3345] text-[#E9BCB9] border border-[#ED9E5B]/40 shadow-lg font-bold'
                  : 'text-[#E9BCB9]/80 hover:text-[#E9BCB9] hover:bg-[#141124]'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#ED9E5B]' : 'text-[#ED9E5B]/70'}`} />
                <span className="truncate">{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-[#0D0B18] rounded-xl border border-[#44174E] text-[11px] text-[#E9BCB9] space-y-1 shadow-md">
        <div className="flex items-center gap-1.5 font-bold text-[#ED9E5B]">
          <span className="w-2 h-2 rounded-full bg-[#ED9E5B] animate-pulse" />
          <span>Team Nano X Engine Active</span>
        </div>
        <p className="text-[10px] text-[#E9BCB9]/70">FastAPI + PuLP + WebSockets</p>
      </div>
    </aside>
  );
}
