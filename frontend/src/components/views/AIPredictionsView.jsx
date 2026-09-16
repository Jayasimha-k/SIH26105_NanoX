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
            AI Exploitation Risk Prediction Pipeline
          </h2>
          <p className="text-slate-400 text-xs mt-1">4 Base Models (P1-P4 Parallel Feature Extraction) &rarr; Stacker Meta-Model &rarr; Calibrated Risk Output</p>
        </div>
        <button onClick={handleRunInference} disabled={loading} className="cyber-button">
          <Play className="w-4 h-4 fill-current" />
          {loading ? 'Running AI Pipeline...' : 'Run Pipeline Inference'}
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
    </div>
  );
}
