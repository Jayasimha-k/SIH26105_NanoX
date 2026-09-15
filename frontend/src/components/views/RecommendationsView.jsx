import React from 'react';
import { Award, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

export default function RecommendationsView({ recommendations, onNavigate }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-6 h-6 text-cyan-400" />
            AI-Prioritized Security Recommendations
          </h2>
          <p className="text-slate-400 text-xs mt-1">Ranked by Expected Risk Reduction ($\Delta EAL$) and Return on Security Investment ($ROSI$)</p>
        </div>
        <button onClick={() => onNavigate('approvals')} className="cyber-button">
          Open CISO Approval Center &rarr;
        </button>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div key={rec.id} className="cyber-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-cyan-400">{rec.id}</span>
                <span className={`cyber-badge text-[10px] ${rec.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-amber-500/20 text-amber-400'}`}>
                  {rec.priority}
                </span>
                <span className="cyber-badge bg-slate-800 text-slate-300">{rec.status}</span>
              </div>
              <h3 className="font-bold text-slate-100 text-sm">{rec.title}</h3>
              <p className="text-xs text-slate-400">{rec.description}</p>
            </div>

            <div className="flex items-center gap-6 text-xs bg-slate-900/80 px-4 py-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">Expected Loss Avoided</span>
                <span className="font-bold text-emerald-400 text-sm">₹{(rec.expected_risk_reduction / 100000).toFixed(1)}L</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Investment Cost</span>
                <span className="font-bold text-cyan-400 text-sm">₹{(rec.cost / 100000).toFixed(1)}L</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ROSI</span>
                <span className="font-bold text-purple-400 text-sm">+{rec.rosi}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
