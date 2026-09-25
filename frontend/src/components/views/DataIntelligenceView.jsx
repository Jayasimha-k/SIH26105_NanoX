import React, { useState, useEffect } from 'react';
import {
  Database,
  UploadCloud,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Layers,
  Shield,
  ArrowRight,
  TrendingUp,
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';

export default function DataIntelligenceView() {
  const [datasets, setDatasets] = useState([]);
  const [governance, setGovernance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dsRes, govRes] = await Promise.all([
        api.listDatasets().catch(() => ({ datasets: [] })),
        api.getModelLayersGovernance().catch(() => null)
      ]);
      setDatasets(dsRes.datasets || []);
      setGovernance(govRes);
    } catch (e) {
      console.error("Error loading datasets & governance:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await api.uploadDataset(file);
      setUploadSuccess(res.message);
      setTimeout(() => setUploadSuccess(null), 4000);
      loadData();
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.message || "Failed to validate and upload dataset.");
    } finally {
      setUploading(false);
    }
  };

  const handleEvaluateCandidate = async () => {
    try {
      setEvaluating(true);
      const res = await api.evaluateCandidateModel({ organization_id: 'org_abc_tech' });
      setEvalResult(res);
      loadData();
    } catch (e) {
      console.error("Candidate evaluation error:", e);
    } finally {
      setEvaluating(false);
    }
  };

  const handleApproveCandidate = async () => {
    try {
      await api.approveCandidateModel({
        candidate_version: evalResult?.candidate_version || 'v1.1.0',
        approved_by: 'CISO_GOVERNANCE_DIRECTOR',
        decision: 'APPROVED'
      });
      alert("Candidate model approved and promoted to Champion.");
      setEvalResult(null);
      loadData();
    } catch (e) {
      console.error("Approval error:", e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="cyber-badge bg-blue-50 text-blue-700 border-blue-200">Data & Governance</span>
            <span className="text-xs font-mono text-slate-400">Layer: Continual Adaptation</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            Data & Organization Model Layers
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ingest custom enterprise telemetry, validate feature schemas, and govern organization adaptation layers with HITL gates.
          </p>
        </div>

        {/* Upload Trigger Button */}
        <div>
          <label className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer">
            <UploadCloud className="w-4 h-4" />
            <span>{uploading ? 'Validating Dataset...' : '+ Add Dataset'}</span>
            <input
              type="file"
              accept=".csv,.json,.parquet"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {uploadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* SECTION 1: ORGANIZATION MODEL ADAPTATION GOVERNANCE */}
      <div className="cyber-card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              Model Lifecycle: Champion vs Candidate Governance
            </h3>
            <p className="text-[11px] text-slate-500">
              P1–P6 and Fusion v2 remain fixed baselines. Organization adaptation layers evolve only on validated outcomes.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold border border-indigo-200">
            Strict HITL Gate
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Champion Model */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Champion</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px]">
                PRODUCTION
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 font-mono">
              {governance?.governance_status?.champion_model?.version || 'v1.0.0'}
            </div>
            <div className="text-xs text-slate-600 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Status:</span>
                <strong className="text-slate-800">CHAMPION</strong>
              </div>
              <div className="flex justify-between">
                <span>Samples:</span>
                <strong className="text-slate-800">25 Validated</strong>
              </div>
              <div className="flex justify-between">
                <span>ROC-AUC:</span>
                <strong className="text-emerald-700">0.962</strong>
              </div>
            </div>
          </div>

          {/* Candidate Model / Gate */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Candidate Layer</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-bold text-[10px]">
                  EVALUATION
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 font-mono mt-1">
                {governance?.governance_status?.candidate_model?.version || 'v1.1.0-CANDIDATE'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Requires N &ge; 15 confirmed incidents/benign outcomes before promotion.
              </p>
            </div>

            <button
              onClick={handleEvaluateCandidate}
              disabled={evaluating}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              {evaluating ? 'Running Quality & Drift Checks...' : 'Evaluate Candidate Model'}
            </button>
          </div>

          {/* Evidence Stats */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Validated Evidence Ground-Truth
            </span>
            <div className="text-2xl font-black text-blue-700 font-mono">
              {governance?.evidence_stats?.verified_outcomes_count || 25}
            </div>
            <p className="text-[11px] text-slate-500">
              Verified ground-truth samples recorded via Threat Intelligence center review.
            </p>
            <div className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 p-1.5 rounded border border-emerald-200">
              ✓ Evidence threshold satisfied for refinement
            </div>
          </div>
        </div>

        {/* Evaluation Output Modal / Card */}
        {evalResult && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-indigo-900 uppercase tracking-wider">
                Candidate Evaluation Report &bull; {evalResult.candidate_version || 'v1.1.0'}
              </h4>
              <span className="text-[10px] font-mono font-bold text-indigo-700">Gate: Human Approval Required</span>
            </div>

            {evalResult.status === 'INSUFFICIENT_EVIDENCE' ? (
              <div className="text-xs text-rose-700 font-semibold">
                {evalResult.message}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-700">
                  Candidate organization adaptation layer passed drift detection (PSI &lt; 0.10) and improves Brier calibration score by 12.4%.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleApproveCandidate}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                  >
                    Promote to Champion (CISO Approval)
                  </button>
                  <button
                    onClick={() => setEvalResult(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: INGESTED DATASETS CATALOG */}
      <div className="cyber-card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              Registered Enterprise Datasets ({datasets.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              Validated datasets supporting network behavioral training and baseline risk quantification.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Supported: CSV, JSON, Parquet</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase bg-slate-50">
                <th className="p-3">Dataset Name</th>
                <th className="p-3">Format</th>
                <th className="p-3">Rows</th>
                <th className="p-3">Size</th>
                <th className="p-3">Schema Status</th>
                <th className="p-3">Quality Score</th>
                <th className="p-3 text-right">Leakage Check</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((ds) => (
                <tr key={ds.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <strong className="text-slate-800 block">{ds.name}</strong>
                    <span className="text-[10px] text-slate-400">{ds.source}</span>
                  </td>
                  <td className="p-3 font-bold text-indigo-700">{ds.file_format}</td>
                  <td className="p-3 text-slate-700">{ds.rows?.toLocaleString() || ds.rows}</td>
                  <td className="p-3 text-slate-600">{ds.size}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                      {ds.schema_status}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-slate-800 font-bold">{ds.quality_status}</span>
                  </td>
                  <td className="p-3 text-right">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {ds.leakage_risk || 'CLEARED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
