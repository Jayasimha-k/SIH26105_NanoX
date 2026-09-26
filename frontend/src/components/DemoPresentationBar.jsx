import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  ShieldAlert,
  Activity,
  DollarSign,
  TrendingDown,
  Lock,
  Layers,
  CheckCircle2,
  ChevronRight,
  Flame,
  Radio,
  SlidersHorizontal,
  Clock
} from 'lucide-react';
import { api } from '../services/api';

export const DEMO_STAGES = [
  { id: 'baseline', label: '1. Baseline Risk', min: '0-7m', icon: Activity, tab: 'dashboard' },
  { id: 'attack', label: '2. Launch Attack', min: '7-11m', icon: Flame, tab: 'security_testing' },
  { id: 'detection', label: '3. Model 6 Detection', min: '11-15m', icon: Radio, tab: 'dashboard' },
  { id: 'risk_surge', label: '4. Risk Surge (96%)', min: '15-18m', icon: ShieldAlert, tab: 'dashboard' },
  { id: 'financial', label: '5. Financial Impact', min: '18-21m', icon: DollarSign, tab: 'dashboard' },
  { id: 'optimization', label: '6. Optimization', min: '21-25m', icon: SlidersHorizontal, tab: 'dashboard' },
  { id: 'remediation', label: '7. Remediation', min: '25-27m', icon: Lock, tab: 'execution' },
  { id: 'reassessment', label: '8. Reassessment', min: '27-29m', icon: TrendingDown, tab: 'dashboard' },
  { id: 'audit', label: '9. Fabric Audit', min: '29-30m', icon: Layers, tab: 'audit' }
];

export default function DemoPresentationBar({
  currentStage = 'baseline',
  onSelectStage,
  onResetDemo,
  isAttackActive = false,
  isResetting = false
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-slate-950 border-b border-blue-900/40 text-slate-300 px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg z-20">
      {/* Left: Mode Title & Offline Notice */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-white tracking-wider">
            SIH 2026 DEMO NARRATIVE
          </span>
          <span className="text-[10px] bg-blue-950 border border-blue-800 text-blue-300 px-2 py-0.5 rounded font-mono font-semibold">
            OFFLINE SIH DEMO MODE
          </span>
        </div>
      </div>

      {/* Middle: 9 Interactive Stage Pills */}
      <div className="flex items-center gap-1 overflow-x-auto max-w-full py-1 scrollbar-none font-mono text-xs">
        {DEMO_STAGES.map((s, idx) => {
          const isActive = currentStage === s.id;
          const StageIcon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => onSelectStage(s)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/60 font-bold border border-blue-400'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
              title={`Stage ${idx + 1}: ${s.label} (${s.min})`}
            >
              <StageIcon className="w-3 h-3 text-slate-300" />
              <span>{s.label}</span>
              <span className="text-[9px] text-slate-400 opacity-70">[{s.min}]</span>
            </button>
          );
        })}
      </div>

      {/* Right: RESET DEMO Button */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          id="btn-reset-demo"
          onClick={onResetDemo}
          disabled={isResetting}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all shadow-sm ${
            isResetting
              ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
              : 'bg-red-950/80 hover:bg-red-900 text-red-200 border-red-700 hover:border-red-500 active:scale-95'
          }`}
          title="Restore baseline risk, idle attack state, and clear temporary demo telemetry"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'RESETTING...' : '[ RESET DEMO ]'}</span>
        </button>
      </div>
    </div>
  );
}
