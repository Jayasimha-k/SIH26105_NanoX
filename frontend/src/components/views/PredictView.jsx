import React, { useState } from 'react';
import { Cpu, Play, Building2 } from 'lucide-react';
import { api } from '../../services/api';

export default function PredictView({ assets, vulnerabilities }) {
  const [selectedAsset, setSelectedAsset] = useState(assets[0]?.id || 'ASSET-002');
  const [selectedVuln, setSelectedVuln] = useState(vulnerabilities[0]?.id || 'CVE-2024-21626');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleRunPipeline = async () => {
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
          <span className="cyber-badge mb-1">AI Risk Ensemble Model</span>
          <h2 className="text-xl font-bold text-[#E9BCB9] flex items-center gap-2">
            <Cpu className="w-6 h-6 text-[#ED9E5B]" />
            AI Risk & Exploitation Probability Prediction
          </h2>
          <p className="text-[#E9BCB9]/70 text-xs mt-1">
            Individual Models (P1: NVD, P2: EPSS, P3: CISA KEV, P4: MITRE ATT&CK) &rarr; Meta Model Stacker &rarr; Organization-Specific Model
          </p>
        </div>
        <button onClick={handleRunPipeline} disabled={loading} className="cyber-button">
          <Play className="w-4 h-4 fill-current" />
          {loading ? 'Running AI Pipeline...' : 'Predict Exploitation Risk'}
        </button>
      </div>

      {/* Target Asset & Vulnerability Selection */}
      <div className="cyber-card grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#E9BCB9] mb-1">Target Asset Inventory</label>
          <select
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="w-full bg-[#0D0B18] border border-[#44174E] rounded-lg px-3 py-2 text-xs text-[#E9BCB9] focus:outline-none focus:border-[#A34054]"
          >
            {assets.map((a) => (
              <option key={a.id} value={a.id} className="bg-[#0A0914] text-[#E9BCB9]">{a.id} - {a.name} ({a.asset_type}, Criticality: {a.criticality_score})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#E9BCB9] mb-1">Target Vulnerability Intelligence</label>
          <select
            value={selectedVuln}
            onChange={(e) => setSelectedVuln(e.target.value)}
            className="w-full bg-[#0D0B18] border border-[#44174E] rounded-lg px-3 py-2 text-xs text-[#E9BCB9] focus:outline-none focus:border-[#A34054]"
          >
            {vulnerabilities.map((v) => (
              <option key={v.id} value={v.id} className="bg-[#0A0914] text-[#E9BCB9]">{v.cve_id} - {v.title} (CVSS: {v.cvss_score}, EPSS: {(v.epss_score*100).toFixed(0)}%)</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4-Model Ensemble Pipeline Visual Architecture */}
      <div className="cyber-card space-y-6">
        <h3 className="font-bold text-[#E9BCB9] text-sm">Individual Risk Models (P1, P2, P3, P4) Execution</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0D0B18] p-4 rounded-xl border border-[#44174E] space-y-2">
            <span className="cyber-badge text-[10px]">Model 1 (P1)</span>
            <h4 className="font-semibold text-xs text-[#E9BCB9]">NVD / CVSS / CWE Severity</h4>
            <p className="text-[11px] text-[#E9BCB9]/70">CVSS v3.1 Base Metrics & CWE Vector</p>
            <div className="pt-2 border-t border-[#44174E] flex justify-between items-center">
              <span className="text-[#E9BCB9]/70 text-xs">P1 Value:</span>
              <span className="text-sm font-bold text-[#ED9E5B]">
                {result ? (result.p1_nvd * 100).toFixed(1) + '%' : '100.0%'}
              </span>
            </div>
          </div>

          <div className="bg-[#0D0B18] p-4 rounded-xl border border-[#44174E] space-y-2">
            <span className="cyber-badge text-[10px]">Model 2 (P2)</span>
            <h4 className="font-semibold text-xs text-[#E9BCB9]">EPSS Exploitation Score</h4>
            <p className="text-[11px] text-[#E9BCB9]/70">FIRST EPSS Probability Vector</p>
            <div className="pt-2 border-t border-[#44174E] flex justify-between items-center">
              <span className="text-[#E9BCB9]/70 text-xs">P2 Value:</span>
              <span className="text-sm font-bold text-[#E9BCB9]">
                {result ? (result.p2_epss * 100).toFixed(1) + '%' : '88.0%'}
              </span>
            </div>
          </div>

          <div className="bg-[#0D0B18] p-4 rounded-xl border border-[#44174E] space-y-2">
            <span className="cyber-badge text-[10px]">Model 3 (P3)</span>
            <h4 className="font-semibold text-xs text-[#E9BCB9]">CISA KEV Exploitation</h4>
            <p className="text-[11px] text-[#E9BCB9]/70">Active Wild Exploitation Flag</p>
            <div className="pt-2 border-t border-[#44174E] flex justify-between items-center">
              <span className="text-[#E9BCB9]/70 text-xs">P3 Value:</span>
              <span className="text-sm font-bold text-[#ED9E5B]">
                {result ? (result.p3_cisa_kev * 100).toFixed(1) + '%' : '95.0%'}
              </span>
            </div>
          </div>

          <div className="bg-[#0D0B18] p-4 rounded-xl border border-[#44174E] space-y-2">
            <span className="cyber-badge text-[10px]">Model 4 (P4)</span>
            <h4 className="font-semibold text-xs text-[#E9BCB9]">MITRE ATT&CK TTP Impact</h4>
            <p className="text-[11px] text-[#E9BCB9]/70">Attack Technique Severity Index</p>
            <div className="pt-2 border-t border-[#44174E] flex justify-between items-center">
              <span className="text-[#E9BCB9]/70 text-xs">P4 Value:</span>
              <span className="text-sm font-bold text-[#E9BCB9]">
                {result ? (result.p4_mitre_attack * 100).toFixed(1) + '%' : '90.0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Synthesis, Meta Model & Org Model Integration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#44174E]">
          <div className="p-4 bg-[#0D0B18] rounded-xl border border-[#44174E] space-y-1">
            <span className="cyber-badge text-[10px]">META MODEL ENSEMBLE</span>
            <span className="text-2xl font-extrabold text-[#ED9E5B] block mt-1">
              {result ? (result.meta_exploitation_probability * 100).toFixed(1) + '%' : '92.8%'}
            </span>
            <p className="text-xs text-[#E9BCB9]/70">Synthesized baseline exploitation probability</p>
          </div>

          {/* User Request 7: Organization Button after META model */}
          <div className="p-4 bg-[#1C152E] rounded-xl border border-[#A34054] space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="cyber-badge-peach text-[10px]">ORGANIZATION MODEL</span>
                <span className="text-[10px] text-[#ED9E5B] font-mono">Hook Ready</span>
              </div>
              <p className="text-xs font-semibold text-[#E9BCB9] mt-2 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#ED9E5B]" /> Custom Org Model
              </p>
              <p className="text-[11px] text-[#E9BCB9]/70 mt-1">Connect your organization-specific ML model weights & telemetry here</p>
            </div>
            <button className="cyber-button-secondary w-full text-xs py-1.5 mt-2 opacity-90 cursor-pointer hover:border-[#ED9E5B]">
              + Connect Org Model
            </button>
          </div>

          <div className="p-4 bg-[#0D0B18] rounded-xl border border-[#A34054]/60 space-y-1">
            <span className="cyber-badge text-[10px]">ORGANIZATION-SPECIFIC ADAPTATION</span>
            <span className="text-2xl font-extrabold text-[#E9BCB9] block mt-1">
              {result ? (result.organization_adapted_probability * 100).toFixed(1) + '%' : '100.0%'}
            </span>
            <p className="text-xs text-[#E9BCB9]/80">Customized using asset exposure, criticality & incident history</p>
          </div>
        </div>
      </div>
    </div>
  );
}
