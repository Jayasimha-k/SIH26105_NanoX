import React, { useState } from 'react';
import { Cpu, ArrowRight, Play, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';

export default function AIPredictionsView({ assets, vulnerabilities }) {
  const [selectedAsset, setSelectedAsset] = useState(assets[0]?.id || 'ASSET-002');
  const [selectedVuln, setSelectedVuln] = useState(vulnerabilities[0]?.id || 'CVE-2024-21626');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleRunInference = async () => {
    setLoading(true);
    try {
      const res = await api.predictRisk(selectedAsset, selectedVuln);
      setResult(res);
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
            <Cpu className="w-6 h-6 text-purple-400" />
            Plug-and-Play ML Orchestration Pipeline
          </h2>
          <p className="text-slate-400 text-xs mt-1">4 Base Models (Parallel Feature Extraction) &rarr; Stacker Meta-Model &rarr; Calibrated Risk Output</p>
        </div>
        <button onClick={handleRunInference} disabled={loading} className="cyber-button">
          <Play className="w-4 h-4 fill-current" />
          {loading ? 'Running ML Pipeline...' : 'Run Pipeline Inference'}
        </button>
      </div>

      {/* Target Selector Bar */}
      <div className="cyber-card grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Target Enterprise Asset</label>
          <select
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {assets.map((a) => (
              <option key={a.id} value={a.id}>{a.id} - {a.name} (Value: ₹{(a.financial_value/100000).toFixed(1)}L)</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Target Vulnerability Intelligence</label>
          <select
            value={selectedVuln}
            onChange={(e) => setSelectedVuln(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {vulnerabilities.map((v) => (
              <option key={v.id} value={v.id}>{v.cve_id} - {v.title} (EPSS: {(v.epss_score*100).toFixed(0)}%)</option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive Visual Pipeline Diagram */}
      <div className="cyber-card space-y-6">
        <h3 className="font-bold text-slate-200 text-sm">Active 2-Stage Stacking Architecture</h3>

        {/* Stage 1: Base Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="cyber-badge bg-blue-950 text-blue-400 border border-blue-800 text-[10px]">Model 1</span>
            <h4 className="font-semibold text-xs text-slate-200">Exploitability Model</h4>
            <p className="text-[11px] text-slate-400">EPSS & CISA KEV Vector</p>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 text-xs">Prediction:</span>
              <span className="text-sm font-bold text-blue-400">
                {result ? (result.base_model_predictions.model_1 * 100).toFixed(1) + '%' : '88.0%'}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="cyber-badge bg-purple-950 text-purple-400 border border-purple-800 text-[10px]">Model 2</span>
            <h4 className="font-semibold text-xs text-slate-200">Threat Intel Model</h4>
            <p className="text-[11px] text-slate-400">Dark Web Chatter Vector</p>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 text-xs">Prediction:</span>
              <span className="text-sm font-bold text-purple-400">
                {result ? (result.base_model_predictions.model_2 * 100).toFixed(1) + '%' : '78.5%'}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="cyber-badge bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">Model 3</span>
            <h4 className="font-semibold text-xs text-slate-200">Asset Reachability</h4>
            <p className="text-[11px] text-slate-400">Exposure Posture Vector</p>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 text-xs">Prediction:</span>
              <span className="text-sm font-bold text-emerald-400">
                {result ? (result.base_model_predictions.model_3 * 100).toFixed(1) + '%' : '91.2%'}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="cyber-badge bg-amber-950 text-amber-400 border border-amber-800 text-[10px]">Model 4</span>
            <h4 className="font-semibold text-xs text-slate-200">Blast Radius Model</h4>
            <p className="text-[11px] text-slate-400">Lateral Chaining Vector</p>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 text-xs">Prediction:</span>
              <span className="text-sm font-bold text-amber-400">
                {result ? (result.base_model_predictions.model_4 * 100).toFixed(1) + '%' : '82.0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Stage 2 Convergence Box */}
        <div className="p-5 bg-gradient-to-r from-purple-950/40 via-cyan-950/40 to-slate-950/40 rounded-xl border border-cyan-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <span className="cyber-badge bg-cyan-900 text-cyan-300 mb-1">STAGE 2 META-MODEL STACKER</span>
            <h3 className="text-lg font-bold text-slate-100">Final Exploitation Probability P(exploit)</h3>
            <p className="text-xs text-slate-400">Synthesized probability passed directly to Quantitative Risk Engine</p>
          </div>

          <div className="text-center md:text-right bg-slate-900/80 px-6 py-3 rounded-lg border border-cyan-700">
            <span className="text-3xl font-extrabold text-cyan-400">
              {result ? (result.exploitation_probability * 100).toFixed(1) + '%' : '85.2%'}
            </span>
            <span className="block text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Calibrated Probability</span>
          </div>
        </div>

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block">Calculated Breach Impact:</span>
              <span className="text-base font-bold text-emerald-400">₹{(result.financial_impact / 100000).toFixed(1)} Lakhs</span>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block">Pre-Control Expected Loss (EAL):</span>
              <span className="text-base font-bold text-red-400">₹{(result.eal_pre_control / 100000).toFixed(1)} Lakhs</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
