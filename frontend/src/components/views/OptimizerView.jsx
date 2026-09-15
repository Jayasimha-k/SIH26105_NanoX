import React, { useState } from 'react';
import { Sliders, Zap, CheckCircle2, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

export default function OptimizerView({ controls }) {
  const [budget, setBudget] = useState(1000000); // Default ₹10 Lakhs
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
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            PuLP / OR-Tools Security Investment Optimizer
          </h2>
          <p className="text-slate-400 text-xs mt-1">0-1 Integer Linear Program (ILP) Solver | Maximize Risk Reduction under Budget & Dependency Constraints</p>
        </div>
        <span className="cyber-badge bg-amber-950 text-amber-400 border border-amber-800">COIN-OR CBC Solver</span>
      </div>

      {/* Interactive Budget Threshold Card */}
      <div className="cyber-card space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-slate-300">
            Available Security Budget Ceiling: <span className="text-emerald-400 font-bold text-sm">₹{(budget / 100000).toFixed(1)} Lakhs</span>
          </label>
          <button onClick={handleRunOptimization} disabled={loading} className="cyber-button">
            <Sliders className="w-4 h-4" />
            {loading ? 'Solving ILP Knapsack...' : 'Solve PuLP Optimization'}
          </button>
        </div>

        <input
          type="range"
          min="100000"
          max="2000000"
          step="50000"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />

        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
          <span>Min: ₹1.0 Lakh</span>
          <span>Target Example: ₹10.0 Lakhs</span>
          <span>Max: ₹20.0 Lakhs</span>
        </div>
      </div>

      {/* Optimization Results View */}
      {optResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="cyber-card border-l-4 border-l-cyan-500">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Total Investment Cost</span>
              <h3 className="text-xl font-bold text-cyan-400 mt-1">₹{(optResult.total_cost / 100000).toFixed(2)}L</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Budget Utilized: {((optResult.total_cost / budget) * 100).toFixed(1)}%</p>
            </div>

            <div className="cyber-card border-l-4 border-l-red-500">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Post-Control Residual EAL</span>
              <h3 className="text-xl font-bold text-red-400 mt-1">₹{(optResult.post_eal / 100000).toFixed(2)}L</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Down from ₹{(optResult.pre_eal / 100000).toFixed(1)}L</p>
            </div>

            <div className="cyber-card border-l-4 border-l-emerald-500">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Total Loss Reduction</span>
              <h3 className="text-xl font-bold text-emerald-400 mt-1">₹{(optResult.risk_reduction / 100000).toFixed(2)}L</h3>
              <p className="text-[11px] text-emerald-400 mt-0.5">Expected Breach Loss Saved</p>
            </div>

            <div className="cyber-card border-l-4 border-l-purple-500">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Optimal ROSI</span>
              <h3 className="text-xl font-bold text-purple-400 mt-1">+{optResult.rosi}%</h3>
              <p className="text-[11px] text-purple-400 mt-0.5">Solver execution: {optResult.execution_time_ms}ms</p>
            </div>
          </div>

          <div className="cyber-card space-y-3">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Optimal Selected Control Combination ({optResult.selected_controls.length} Controls)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {optResult.selected_controls.map((ctrl) => (
                <div key={ctrl.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-200 text-xs">{ctrl.name}</span>
                    <span className="text-emerald-400 font-bold text-xs">₹{(ctrl.cost / 100000).toFixed(1)}L</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Category: {ctrl.category} | Effectiveness Factor: {(ctrl.effectiveness * 100).toFixed(0)}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
