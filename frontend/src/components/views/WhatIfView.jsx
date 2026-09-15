import React, { useState } from 'react';
import { Sliders, RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

export default function WhatIfView({ controls }) {
  const [activeControlIds, setActiveControlIds] = useState(controls.map(c => c.id));
  const [threatMultiplier, setThreatMultiplier] = useState(1.0);
  const [budget, setBudget] = useState(1000000);
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleControl = (id) => {
    if (activeControlIds.includes(id)) {
      setActiveControlIds(activeControlIds.filter(c => c !== id));
    } else {
      setActiveControlIds([...activeControlIds, id]);
    }
  };

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await api.simulateWhatIf(budget, activeControlIds, threatMultiplier);
      setSimResult(res);
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
            <Sliders className="w-6 h-6 text-cyan-400" />
            What-If Sensitivity Scenario Simulator
          </h2>
          <p className="text-slate-400 text-xs mt-1">Simulate threat severity surges, budget constraints, and active control selection matrix</p>
        </div>
        <button onClick={handleSimulate} disabled={loading} className="cyber-button">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Run Simulation Scenario
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Configuration matrix */}
        <div className="cyber-card space-y-4 lg:col-span-1">
          <h3 className="font-bold text-slate-200 text-sm">Simulation Parameters</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Threat Surge Multiplier: <span className="text-cyan-400 font-bold">{threatMultiplier}x</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={threatMultiplier}
              onChange={(e) => setThreatMultiplier(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Active Security Controls Matrix</label>
            {controls.map((c) => (
              <label key={c.id} className="flex items-center gap-2.5 p-2 bg-slate-900 rounded border border-slate-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={activeControlIds.includes(c.id)}
                  onChange={() => toggleControl(c.id)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-slate-200">{c.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Simulation Output Card */}
        <div className="cyber-card lg:col-span-2 space-y-6">
          <h3 className="font-bold text-slate-200 text-sm">Projected Risk & Financial Impact</h3>

          {simResult ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-xs block">Simulated Pre-Control EAL</span>
                <span className="text-2xl font-bold text-red-400">₹{(simResult.simulated_pre_eal / 100000).toFixed(2)}L</span>
              </div>
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-xs block">Simulated Post-Control Residual EAL</span>
                <span className="text-2xl font-bold text-cyan-400">₹{(simResult.simulated_post_eal / 100000).toFixed(2)}L</span>
              </div>
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-xs block">Simulated Risk Avoidance</span>
                <span className="text-2xl font-bold text-emerald-400">₹{(simResult.simulated_risk_reduction / 100000).toFixed(2)}L</span>
              </div>
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-xs block">Simulated ROSI</span>
                <span className="text-2xl font-bold text-purple-400">+{simResult.simulated_rosi}%</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-900/50 rounded-xl border border-slate-800">
              Click 'Run Simulation Scenario' to generate what-if projections based on active parameter sliders.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
