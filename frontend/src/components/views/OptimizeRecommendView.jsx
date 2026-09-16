import React, { useState } from 'react';
import { Sliders, Zap, Award } from 'lucide-react';
import { api } from '../../services/api';

export default function OptimizeRecommendView({ recommendations, onNavigate }) {
  const [budget, setBudget] = useState(1000000);
  const [loading, setLoading] = useState(false);
  const [optResult, setOptResult] = useState(null);

  const handleRunOptimization = async () => {
    setLoading(true);
    try {
      const res = await api.runOptimization(budget);
      setOptResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <span className="cyber-badge mb-1">PuLP Optimization Engine</span>
          <h2 className="text-xl font-bold text-[#E9BCB9] flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#ED9E5B]" />
            Budget-Constrained Security Investment Optimization
          </h2>
          <p className="text-[#E9BCB9]/70 text-xs mt-1">
            0-1 Integer Linear Program (PuLP / OR-Tools Solver) selects the best control combination for maximum expected risk reduction (Delta EAL) within budget
          </p>
        </div>
        <button onClick={() => onNavigate('approvals')} className="cyber-button">
          Open CISO Approval Center &rarr;
        </button>
      </div>

      {/* Interactive Budget Threshold Card */}
      <div className="cyber-card space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-[#E9BCB9]">
            Available Security Investment Budget: <span className="text-[#ED9E5B] font-bold text-sm">₹{(budget / 100000).toFixed(1)} Lakhs</span>
          </label>
          <button onClick={handleRunOptimization} disabled={loading} className="cyber-button">
            <Sliders className="w-4 h-4" />
            {loading ? 'Solving PuLP Optimization...' : 'Run PuLP Budget Optimization'}
          </button>
        </div>

        <input
          type="range"
          min="100000"
          max="2000000"
          step="50000"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full h-2 bg-[#0D0B18] rounded-lg appearance-none cursor-pointer accent-[#A34054]"
        />

        <div className="flex justify-between text-[11px] text-[#E9BCB9]/70 font-mono">
          <span>Min: ₹1.0 Lakh</span>
          <span>Target Example: ₹10.0 Lakhs</span>
          <span>Max: ₹20.0 Lakhs</span>
        </div>
      </div>

      {/* Optimization Solver Output */}
      {optResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="cyber-card border-l-4 border-l-[#E9BCB9]">
              <span className="text-[#E9BCB9]/80 text-[10px] uppercase font-bold">Total Investment Cost</span>
              <h3 className="text-xl font-bold text-[#E9BCB9] mt-1">₹{(optResult.total_cost / 100000).toFixed(2)}L</h3>
              <p className="text-[11px] text-[#E9BCB9]/70 mt-0.5">Budget Utilized: {((optResult.total_cost / budget) * 100).toFixed(1)}%</p>
            </div>

            <div className="cyber-card border-l-4 border-l-emerald-500">
              <span className="text-emerald-400 text-[10px] uppercase font-bold">Post-Control Residual EAL</span>
              <h3 className="text-xl font-bold text-emerald-400 mt-1">₹{(optResult.post_eal / 100000).toFixed(2)}L</h3>
              <p className="text-[11px] text-[#E9BCB9]/70 mt-0.5">Down from <span className="text-red-400">₹{(optResult.pre_eal / 100000).toFixed(1)}L</span></p>
            </div>

            <div className="cyber-card border-l-4 border-l-emerald-500">
              <span className="text-emerald-400 text-[10px] uppercase font-bold">Total Loss Reduction</span>
              <h3 className="text-xl font-bold text-emerald-400 mt-1">₹{(optResult.risk_reduction / 100000).toFixed(2)}L</h3>
              <p className="text-[11px] text-emerald-400/80 mt-0.5">{optResult.risk_reduction_pct}% Loss Avoided</p>
            </div>

            <div className="cyber-card border-l-4 border-l-emerald-500">
              <span className="text-[#E9BCB9]/80 text-[10px] uppercase font-bold">Optimal ROSI</span>
              <h3 className="text-xl font-bold text-emerald-400 mt-1">+{optResult.rosi}%</h3>
              <p className="text-[11px] text-[#E9BCB9]/70 mt-0.5">Solver execution: {optResult.execution_time_ms}ms</p>
            </div>
          </div>
        </div>
      )}

      {/* Prioritized Security Investment Recommendations */}
      <div className="cyber-card space-y-4">
        <h3 className="font-bold text-[#E9BCB9] text-sm flex items-center gap-2">
          <Award className="w-5 h-5 text-[#ED9E5B]" />
          Recommended Security Control Options (Ranked by Risk Reduction & ROSI)
        </h3>

        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div key={rec.id} className="p-4 bg-[#0D0B18] rounded-xl border border-[#44174E] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#ED9E5B]">{rec.id}</span>
                  <span className={`cyber-badge text-[10px] ${rec.priority === 'CRITICAL' ? 'border-red-500/60 text-red-400' : 'text-[#E9BCB9]'}`}>
                    {rec.priority}
                  </span>
                  <span className="cyber-badge text-[#E9BCB9]">{rec.status}</span>
                </div>
                <h4 className="font-bold text-[#E9BCB9] text-sm mt-1">{rec.title}</h4>
                <p className="text-xs text-[#E9BCB9]/70">{rec.description}</p>
              </div>

              <div className="flex items-center gap-6 text-xs bg-[#141124] px-4 py-2.5 rounded-lg border border-[#44174E]">
                <div>
                  <span className="text-[#E9BCB9]/70 block text-[10px]">Investment Cost</span>
                  <span className="font-bold text-[#E9BCB9]">₹{(rec.cost / 100000).toFixed(1)}L</span>
                </div>
                <div>
                  <span className="text-[#E9BCB9]/70 block text-[10px]">Risk Reduction</span>
                  <span className="font-bold text-emerald-400">₹{(rec.expected_risk_reduction / 100000).toFixed(1)}L</span>
                </div>
                <div>
                  <span className="text-[#E9BCB9]/70 block text-[10px]">ROSI</span>
                  <span className="font-bold text-emerald-400">+{rec.rosi}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
