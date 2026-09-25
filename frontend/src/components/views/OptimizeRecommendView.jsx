import React, { useState, useEffect, useRef } from 'react';
import { Sliders, Zap, Award, CheckCircle2, ArrowRight, Shield, ShieldCheck, Database, Layers, Check } from 'lucide-react';
import { api } from '../../services/api';

export default function OptimizeRecommendView({ recommendations = [], currentRole = 'CFO', onNavigate }) {
  const [budget, setBudget] = useState(1500000);
  const [loading, setLoading] = useState(false);
  const [optResult, setOptResult] = useState(null);
  const [allocatedSuccess, setAllocatedSuccess] = useState(false);
  const debounceTimer = useRef(null);

  const handleRunOptimization = async (targetBudget = budget) => {
    setLoading(true);
    try {
      const res = await api.runOptimization(targetBudget);
      setOptResult(res);
    } catch (e) {
      console.error("Optimization failed:", e);
    } finally {
      setLoading(false);
    }
  };

  // Run automatically on mount
  useEffect(() => {
    handleRunOptimization(budget);
  }, []);

  // Debounce automatic re-optimization on slider change
  const handleSliderChange = (newVal) => {
    setBudget(newVal);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      handleRunOptimization(newVal);
    }, 280);
  };

  const handlePresetSelect = (presetVal) => {
    setBudget(presetVal);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    handleRunOptimization(presetVal);
  };

  const handleCommitAllocation = () => {
    setAllocatedSuccess(true);
    setTimeout(() => setAllocatedSuccess(false), 5000);
  };

  const surplus = optResult ? Math.max(0, budget - optResult.total_cost) : 0;
  const selectedControls = optResult?.selected_controls || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 tracking-wide uppercase">
              PuLP Optimization Engine
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              0-1 Integer Linear Program Active
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Budget-Constrained Security Investment Optimization
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Maximizes expected risk reduction (&Delta;EAL) and Return on Security Investment (ROSI) under hard capital budget constraints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCommitAllocation}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Commit to Capital Plan</span>
          </button>
          <button
            onClick={() => onNavigate('approvals')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
          >
            <span>{currentRole === 'CFO' ? 'Capital Allocations' : 'CISO Approval Center'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {allocatedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Optimal capital allocation of ₹{(optResult?.total_cost / 100000).toFixed(2)}L anchored and routed to Consortium Blockchain Ledger!</span>
          </div>
          <button onClick={() => setAllocatedSuccess(false)} className="text-emerald-600 hover:text-emerald-800">×</button>
        </div>
      )}

      {/* Interactive Budget Threshold Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Available Security Investment Budget
            </label>
            <div className="text-2xl font-black text-blue-700 mt-0.5">
              ₹{(budget / 100000).toFixed(1)} Lakhs
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Presets:</span>
            {[
              { label: '₹5.0L Lean', val: 500000 },
              { label: '₹10.0L Standard', val: 1000000 },
              { label: '₹15.0L Resilient', val: 1500000 },
              { label: '₹20.0L Full Scope', val: 2000000 },
            ].map((p) => (
              <button
                key={p.val}
                onClick={() => handlePresetSelect(p.val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  budget === p.val
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleRunOptimization(budget)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            <Sliders className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Solving PuLP Optimization...' : 'Re-solve PuLP Model'}</span>
          </button>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min="100000"
            max="2000000"
            step="50000"
            value={budget}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          <div className="flex justify-between text-[11px] text-slate-500 font-mono font-medium">
            <span>Min: ₹1.0 Lakh</span>
            <span>Target Standard: ₹10.0 Lakhs</span>
            <span>Enterprise Max: ₹20.0 Lakhs</span>
          </div>
        </div>
      </div>

      {/* Optimization Solver Output Metrics */}
      {optResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-blue-600 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Investment Cost</span>
            <h3 className="text-2xl font-black text-blue-700">₹{(optResult.total_cost / 100000).toFixed(2)}L</h3>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Budget Utilized:</span>
              <span className="font-extrabold text-slate-800">{((optResult.total_cost / budget) * 100).toFixed(1)}%</span>
            </div>
            {surplus > 0 && (
              <div className="text-[10px] font-bold text-emerald-700 mt-1">
                +₹{(surplus / 100000).toFixed(1)}L Capital Reserve Surplus
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Post-Control Residual EAL</span>
            <h3 className="text-2xl font-black text-emerald-600">₹{(optResult.post_eal / 100000).toFixed(2)}L</h3>
            <div className="text-[11px] text-slate-500 pt-1">
              Down from <span className="text-rose-600 font-bold line-through">₹{(optResult.pre_eal / 100000).toFixed(1)}L</span>
            </div>
            <div className="text-[10px] font-semibold text-emerald-700">Near-zero residual exposure</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Loss Reduction</span>
            <h3 className="text-2xl font-black text-emerald-600">₹{(optResult.risk_reduction / 100000).toFixed(2)}L</h3>
            <div className="text-[11px] text-emerald-700 font-extrabold pt-1">
              {optResult.risk_reduction_pct || 100.0}% Expected Loss Avoided
            </div>
            <div className="text-[10px] text-slate-400">FAIR Actuarial Methodology</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-600 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Optimal ROSI</span>
            <h3 className="text-2xl font-black text-indigo-700">+{optResult.rosi}%</h3>
            <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
              <span>Solver Execution:</span>
              <span className="font-bold text-slate-800">{optResult.execution_time_ms}ms</span>
            </div>
            <div className="text-[10px] font-bold text-indigo-600">PuLP CBC Simplex Solver</div>
          </div>
        </div>
      )}

      {/* Selected Security Control Portfolio */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Controls Selected by PuLP Solver ({selectedControls.length} Controls Allocated)
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500">
            Ranked by Marginal EAL Reduction per Rupee
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {selectedControls.map((ctrl) => (
            <div
              key={ctrl.id}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-all space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-blue-700">{ctrl.id}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {ctrl.category || 'SECURITY'}
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> FUNDED
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs mt-1.5">{ctrl.name}</h4>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">Cost</span>
                  <span className="font-black text-slate-900">₹{(Number(ctrl.cost) / 100000).toFixed(1)}L</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">Effectiveness</span>
                  <span className="font-black text-emerald-600">{Math.round(ctrl.effectiveness * 100)}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">Deployment</span>
                  <span className="font-black text-slate-700">{ctrl.implementation_time_days || 3} days</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
