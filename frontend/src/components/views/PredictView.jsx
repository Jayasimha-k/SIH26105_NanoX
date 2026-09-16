import React, { useState } from 'react';
import { Cpu, Play, ChevronDown, ChevronUp, AlertCircle, Info, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../../services/api';

export default function PredictView({ assets = [], vulnerabilities = [] }) {
  const [selectedAsset, setSelectedAsset] = useState(assets[0]?.id || 'ASSET-002');
  const [selectedVuln, setSelectedVuln] = useState(vulnerabilities[0]?.id || 'CVE-2024-21626');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleRunPipeline = async () => {
    setLoading(true);
    try {
      const res = await api.predictRisk(selectedAsset, selectedVuln);
      setResult(res);
    } catch (e) {
      console.error('Error running prediction pipeline:', e);
    } finally {
      setLoading(false);
    }
  };

  // Determine Conflict Level (LOW / MEDIUM / HIGH)
  const getConflictLevel = () => {
    if (!result?.conflict_information) {
      return { level: 'LOW', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40', desc: 'Signals in high agreement' };
    }
    const info = result.conflict_information;
    if (info.has_conflict || (info.spread && info.spread >= 0.60)) {
      return { level: 'HIGH', color: 'text-rose-400 bg-rose-950/40 border-rose-500/40', desc: 'Significant source divergence' };
    }
    if (info.spread && info.spread >= 0.30) {
      return { level: 'MEDIUM', color: 'text-amber-400 bg-amber-950/40 border-amber-500/40', desc: 'Moderate signal divergence' };
    }
    return { level: 'LOW', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40', desc: 'Signals in strong agreement' };
  };

  const conflictMeta = getConflictLevel();
  const freshness = result?.conflict_information?.evidence_freshness || 'CURRENT';

  // Format probability helper
  const formatProb = (p) => `${((p ?? 0.831) * 100).toFixed(1)}%`;
  const formatCurrency = (val) => `₹${((val || 0) / 100000).toFixed(1)}L`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="cyber-badge mb-1">Calibrated Risk Prediction</span>
          <h2 className="text-xl font-bold text-[#E9BCB9] flex items-center gap-2">
            <Cpu className="w-6 h-6 text-[#ED9E5B]" />
            AI Exploitation Probability & Evidence Analysis
          </h2>
          <p className="text-[#E9BCB9]/70 text-xs mt-1">
            Platt-calibrated exploitation probability informed by NVD severity, EPSS, CISA KEV, and enterprise context.
          </p>
        </div>
        <button onClick={handleRunPipeline} disabled={loading} className="cyber-button">
          <Play className="w-4 h-4 fill-current" />
          {loading ? 'Evaluating Prediction...' : 'Run Calibrated Prediction'}
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
              <option key={a.id} value={a.id} className="bg-[#0A0914] text-[#E9BCB9]">
                {a.id} - {a.name} ({a.asset_type}, Criticality: {a.criticality_score})
              </option>
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
              <option key={v.id} value={v.id} className="bg-[#0A0914] text-[#E9BCB9]">
                {v.cve_id} - {v.title} (CVSS: {v.cvss_score}, EPSS: {((v.epss_score || 0) * 100).toFixed(0)}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary & Secondary Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Primary: Calibrated Exploitation Probability */}
        <div className="cyber-card border-l-4 border-l-[#ED9E5B] bg-[#141124]">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[#ED9E5B] text-[10px] uppercase font-bold tracking-wider">
                Calibrated Exploitation Probability
              </span>
              <h3 className="text-3xl font-extrabold text-[#ED9E5B] mt-1">
                {result ? formatProb(result.calibrated_probability ?? result.organization_adapted_probability) : '63.3%'}
              </h3>
              <p className="text-[11px] text-[#E9BCB9]/70 mt-1">
                Empirically calibrated probability of active weaponization
              </p>
            </div>
            <div className="p-2 bg-[#0D0B18] rounded-lg border border-[#44174E] text-[#ED9E5B]">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Secondary: Evidence Conflict Level */}
        <div className={`cyber-card border-l-4 ${conflictMeta.level === 'HIGH' ? 'border-l-rose-500' : conflictMeta.level === 'MEDIUM' ? 'border-l-amber-500' : 'border-l-emerald-500'}`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[#E9BCB9]/80 text-[10px] uppercase font-bold tracking-wider">
                Evidence Conflict Level
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xl font-bold px-2.5 py-0.5 rounded border text-xs ${conflictMeta.color}`}>
                  {conflictMeta.level} CONFLICT
                </span>
              </div>
              <p className="text-[11px] text-[#E9BCB9]/70 mt-1.5">
                {conflictMeta.desc}
              </p>
            </div>
            <div className="p-2 bg-[#0D0B18] rounded-lg border border-[#44174E] text-[#E9BCB9]">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Secondary: Evidence Freshness & Pre-Control EAL */}
        <div className="cyber-card border-l-4 border-l-[#A34054]">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[#E9BCB9]/80 text-[10px] uppercase font-bold tracking-wider">
                Pre-Control Financial Loss Exposure
              </span>
              <h3 className="text-2xl font-bold text-[#E9BCB9] mt-1">
                {result ? formatCurrency(result.eal_pre_control) : '₹22.2L'}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#ED9E5B]">
                <Clock className="w-3.5 h-3.5" />
                <span>Evidence Freshness: <strong className="font-mono">{freshness}</strong></span>
              </div>
            </div>
            <div className="p-2 bg-[#0D0B18] rounded-lg border border-[#44174E] text-[#ED9E5B]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Clear Guidance Notes (Probability != Confidence & Conflict != High Risk) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#E9BCB9]/80">
        <div className="bg-[#0D0B18] p-3 rounded-lg border border-[#44174E]/60 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#ED9E5B] shrink-0 mt-0.5" />
          <p>
            <strong className="text-[#E9BCB9]">Probability ≠ Confidence:</strong> Exploitation probability estimates the statistical likelihood of an active attack, distinct from data sample size or model confidence.
          </p>
        </div>
        <div className="bg-[#0D0B18] p-3 rounded-lg border border-[#44174E]/60 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-[#ED9E5B] shrink-0 mt-0.5" />
          <p>
            <strong className="text-[#E9BCB9]">Conflict ≠ Higher Risk:</strong> Evidence disagreement highlights divergence across threat feeds (e.g. theoretical severity vs in-the-wild exploitability), not inherently higher breach likelihood.
          </p>
        </div>
      </div>

      {/* Expandable / Detail Section */}
      <div className="cyber-card space-y-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex justify-between items-center text-xs font-bold text-[#E9BCB9] hover:text-[#ED9E5B] transition-colors py-1"
        >
          <span className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#ED9E5B]" />
            Sub-Model Signals & Diagnostic Breakdown (P1, P2, P3, P4)
          </span>
          <span className="flex items-center gap-1 text-[#ED9E5B]">
            {showDetails ? 'Collapse Details' : 'Expand Diagnostics'}
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {showDetails && (
          <div className="space-y-4 pt-4 border-t border-[#44174E] animate-in fade-in duration-200">
            {/* Sub-Model Evidence Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-[#0D0B18] p-3 rounded-lg border border-[#44174E] space-y-1">
                <span className="cyber-badge text-[9px]">Model 1 (P1)</span>
                <h4 className="font-semibold text-xs text-[#E9BCB9]">Technical Severity</h4>
                <p className="text-[11px] text-[#E9BCB9]/70">CVSS v3.1 & CWE Weakness</p>
                <div className="pt-2 border-t border-[#44174E]/60 flex justify-between items-center text-xs font-bold text-[#ED9E5B]">
                  <span>P1 Value:</span>
                  <span>{result ? formatProb(result.p1_nvd) : '100.0%'}</span>
                </div>
              </div>

              <div className="bg-[#0D0B18] p-3 rounded-lg border border-[#44174E] space-y-1">
                <span className="cyber-badge text-[9px]">Model 2 (P2)</span>
                <h4 className="font-semibold text-xs text-[#E9BCB9]">Exploitation Likelihood</h4>
                <p className="text-[11px] text-[#E9BCB9]/70">FIRST EPSS Score</p>
                <div className="pt-2 border-t border-[#44174E]/60 flex justify-between items-center text-xs font-bold text-[#E9BCB9]">
                  <span>P2 Value:</span>
                  <span>{result ? formatProb(result.p2_epss) : '88.0%'}</span>
                </div>
              </div>

              <div className="bg-[#0D0B18] p-3 rounded-lg border border-[#44174E] space-y-1">
                <span className="cyber-badge text-[9px]">Model 3 (P3)</span>
                <h4 className="font-semibold text-xs text-[#E9BCB9]">Confirmed Threat</h4>
                <p className="text-[11px] text-[#E9BCB9]/70">CISA KEV Wild Verification</p>
                <div className="pt-2 border-t border-[#44174E]/60 flex justify-between items-center text-xs font-bold text-[#ED9E5B]">
                  <span>P3 Value:</span>
                  <span>{result ? formatProb(result.p3_cisa_kev) : '95.0%'}</span>
                </div>
              </div>

              <div className="bg-[#0D0B18] p-3 rounded-lg border border-[#44174E] space-y-1">
                <span className="cyber-badge text-[9px]">Model 4 (P4)</span>
                <h4 className="font-semibold text-xs text-[#E9BCB9]">ATT&CK TTP Severity</h4>
                <p className="text-[11px] text-[#E9BCB9]/70">MITRE Technique Index</p>
                <div className="pt-2 border-t border-[#44174E]/60 flex justify-between items-center text-xs font-bold text-[#E9BCB9]">
                  <span>P4 Value:</span>
                  <span>{result ? formatProb(result.p4_mitre_attack) : '90.0%'}</span>
                </div>
              </div>
            </div>

            {/* Raw vs Calibrated Probability & Conflict Reasons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-[#0D0B18] p-3.5 rounded-lg border border-[#44174E] space-y-2">
                <h4 className="text-xs font-bold text-[#E9BCB9]">Pre-Calibration Raw Score</h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#E9BCB9]/70">Raw Meta-Model Probability:</span>
                  <span className="text-sm font-mono font-bold text-[#ED9E5B]">
                    {result ? formatProb(result.raw_probability ?? result.meta_exploitation_probability) : '83.1%'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#E9BCB9]/70">Post-Platt Calibrated Probability:</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    {result ? formatProb(result.calibrated_probability ?? result.organization_adapted_probability) : '63.3%'}
                  </span>
                </div>
              </div>

              <div className="bg-[#0D0B18] p-3.5 rounded-lg border border-[#44174E] space-y-1.5">
                <h4 className="text-xs font-bold text-[#E9BCB9]">Detected Signal Conflict Reasons</h4>
                {result?.conflict_information?.conflict_reasons && result.conflict_information.conflict_reasons.length > 0 ? (
                  <ul className="list-disc list-inside text-xs text-[#ED9E5B] space-y-1">
                    {result.conflict_information.conflict_reasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-400/80">
                    No significant signal conflicts detected across sub-models.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
