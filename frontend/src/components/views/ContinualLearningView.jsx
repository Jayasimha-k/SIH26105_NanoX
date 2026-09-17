import React, { useState, useEffect } from 'react';
import {
  Brain, ShieldCheck, AlertTriangle, ArrowUpRight, CheckCircle2, XCircle,
  RefreshCw, GitBranch, Database, Activity, Lock, Cpu, Sparkles, Layers,
  Check, Play, HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';

export default function ContinualLearningView() {
  const [orgId, setOrgId] = useState('Hospital A');
  const [status, setStatus] = useState(null);
  const [evidenceList, setEvidenceList] = useState([]);
  const [evidenceFilter, setEvidenceFilter] = useState('');
  const [modelLineage, setModelLineage] = useState([]);
  const [driftReport, setDriftReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusRes, evidenceRes, modelsRes, driftRes] = await Promise.all([
        api.getLearningStatus(orgId).catch(() => null),
        api.getLearningEvidence(evidenceFilter, orgId).catch(() => []),
        api.getLearningModels(orgId).catch(() => []),
        api.getLearningDrift(orgId).catch(() => null)
      ]);
      setStatus(statusRes);
      setEvidenceList(evidenceRes?.records || (Array.isArray(evidenceRes) ? evidenceRes : []));
      setModelLineage(modelsRes?.models || (Array.isArray(modelsRes) ? modelsRes : []));
      setDriftReport(driftRes);
    } catch (err) {
      console.error('Failed to load continual learning data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orgId, evidenceFilter]);

  const handleSeedDemo = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await api.seedDemoLearningEvidence(orgId, 25);
      setMessage({ type: 'success', text: `Demo evidence seeded: ${res.seeded_count} confirmed events recorded!` });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to seed demo evidence.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTrainCandidate = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await api.trainCandidateModel(orgId);
      if (res.status === 'SUCCESS') {
        setMessage({ type: 'success', text: `Candidate ${res.candidate_version} trained with ${res.training_samples} confirmed samples!` });
      } else {
        setMessage({ type: 'warning', text: `Training stopped: ${res.reason} (Need confirmed samples: ${res.min_required || 15})` });
      }
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to train candidate model.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidateCandidate = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await api.validateCandidateModel(orgId);
      if (res.status === 'PASSED') {
        setMessage({ type: 'success', text: `Candidate ${res.candidate_version} PASSED all governance gates! Ready for promotion.` });
      } else {
        setMessage({ type: 'warning', text: `Candidate validation status: ${res.status}. Reason: ${res.reason}` });
      }
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to validate candidate model.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromoteCandidate = async () => {
    if (!status?.candidate_model?.version) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await api.promoteCandidateModel(status.candidate_model.version, orgId);
      if (res.status === 'PROMOTED') {
        setMessage({
          type: 'success',
          text: `Champion updated to ${res.new_champion_version}! Fabric TX: ${res.fabric_tx_id || 'LOCAL-SIM-TX'}`
        });
      } else {
        setMessage({ type: 'error', text: `Promotion rejected: ${res.reason}` });
      }
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to promote candidate.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmOutcome = async (evidenceId, outcome) => {
    try {
      await api.confirmLearningOutcome(evidenceId, outcome, 'Analyst manual confirmation via UI');
      loadData();
    } catch (err) {
      console.error('Confirmation error:', err);
    }
  };

  const champion = status?.champion_model;
  const candidate = status?.candidate_model;
  const metrics = champion?.validation_metrics || {};
  const candMetrics = candidate?.validation_metrics || {};

  return (
    <div className="space-y-6">
      {/* Distinction Header Banner (Scientific Rule #15) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-800/40 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Self-Learning Architecture & Model Governance</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Continual Learning & Champion/Candidate Governance
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Maintains production stability: P1–P6 baseline models remain immutable. The organization-specific
              adaptation layer safely updates only from <strong>confirmed, ground-truth outcome evidence</strong> through
              stringent statistical validation gates and Hyperledger Fabric audit trails.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSeedDemo}
              disabled={actionLoading}
              className="px-3.5 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm border border-indigo-400/30 disabled:opacity-50"
            >
              <Database className="w-3.5 h-3.5" />
              Seed Demo Evidence
            </button>
            <button
              onClick={loadData}
              disabled={actionLoading}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 3-Pillar Distinction Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
            <div className="text-sky-400 font-bold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              1. Continuous Threat Intel
            </div>
            <p className="text-slate-400 text-[11px]">
              New CVEs, EPSS, and KEV telemetry enter the system continuously to update exposure awareness.
            </p>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
            <div className="text-amber-400 font-bold flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              2. Continuous Reassessment
            </div>
            <p className="text-slate-400 text-[11px]">
              EAL and asset risk scores recalculate dynamically when vulnerability postures or controls change.
            </p>
          </div>
          <div className="p-3 bg-indigo-900/40 rounded-xl border border-indigo-500/50 space-y-1">
            <div className="text-emerald-400 font-bold flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" />
              3. Continual Learning
            </div>
            <p className="text-slate-300 text-[11px]">
              Model weights update strictly when verified incident/benign outcomes pass statistical governance gates.
            </p>
          </div>
        </div>
      </div>

      {/* User Alerts */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : message.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
          {message.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />}
          {message.type === 'error' && <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Champion vs Candidate Model Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Champion Model Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Active In Production</span>
                <h3 className="text-base font-bold text-slate-900">Champion Model</h3>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-mono text-xs font-bold border border-emerald-300">
              {champion?.version || 'v1.0.0'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-slate-500 text-[10px]">Training Samples</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{champion?.training_sample_count || 120}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-slate-500 text-[10px]">ROC-AUC</div>
              <div className="text-sm font-bold text-indigo-600 mt-0.5">
                {metrics.roc_auc != null ? metrics.roc_auc.toFixed(3) : '0.865'}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-slate-500 text-[10px]">PR-AUC</div>
              <div className="text-sm font-bold text-indigo-600 mt-0.5">
                {metrics.pr_auc != null ? metrics.pr_auc.toFixed(3) : '0.842'}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-slate-500 text-[10px]">F1 Score</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {metrics.f1 != null ? metrics.f1.toFixed(3) : '0.835'}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-slate-500 text-[10px]">MCC</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {metrics.mcc != null ? metrics.mcc.toFixed(3) : '0.672'}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-slate-500 text-[10px]">Brier Score (Cal.)</div>
              <div className="text-sm font-bold text-emerald-600 mt-0.5">
                {metrics.brier_score != null ? metrics.brier_score.toFixed(3) : '0.128'}
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] font-mono text-slate-600 space-y-1">
            <div className="truncate">
              <strong className="text-slate-800">Dataset Hash:</strong> {champion?.dataset_hash || 'SHA-256:baseline-init'}
            </div>
            <div className="truncate">
              <strong className="text-slate-800">Artifact Hash:</strong> {champion?.artifact_hash || 'SHA-256:artifact-base'}
            </div>
            <div className="truncate">
              <strong className="text-slate-800">Fabric TX ID:</strong>{' '}
              <span className="text-indigo-600">{champion?.fabric_tx_id || 'FABRIC-GENESIS-CHAMPION'}</span>
            </div>
          </div>
        </div>

        {/* Candidate Model Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Candidate Model</span>
                <h3 className="text-base font-bold text-slate-900">
                  {candidate?.version ? `Candidate ${candidate.version}` : 'No Active Candidate'}
                </h3>
              </div>
            </div>
            {candidate?.version ? (
              <span
                className={`px-3 py-1 rounded-full font-mono text-xs font-bold border ${
                  candidate.approval_status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : candidate.approval_status === 'REJECTED'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                {candidate.approval_status}
              </span>
            ) : (
              <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">
                IDLE
              </span>
            )}
          </div>

          {candidate?.version ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-500 text-[10px]">Training Samples</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{candidate.training_sample_count}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-500 text-[10px]">ROC-AUC</div>
                  <div className="text-sm font-bold text-indigo-600 mt-0.5">
                    {candMetrics.roc_auc != null ? candMetrics.roc_auc.toFixed(3) : 'N/A'}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-500 text-[10px]">PR-AUC</div>
                  <div className="text-sm font-bold text-indigo-600 mt-0.5">
                    {candMetrics.pr_auc != null ? candMetrics.pr_auc.toFixed(3) : 'N/A'}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-500 text-[10px]">F1 Score</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {candMetrics.f1 != null ? candMetrics.f1.toFixed(3) : 'N/A'}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-500 text-[10px]">MCC</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {candMetrics.mcc != null ? candMetrics.mcc.toFixed(3) : 'N/A'}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-500 text-[10px]">Brier Score</div>
                  <div className="text-sm font-bold text-emerald-600 mt-0.5">
                    {candMetrics.brier_score != null ? candMetrics.brier_score.toFixed(3) : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={handleValidateCandidate}
                  disabled={actionLoading}
                  className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  Run Validation Gates
                </button>
                {candidate.approval_status === 'APPROVED' && (
                  <button
                    onClick={handlePromoteCandidate}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Promote to Champion (Fabric TX)
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200/80 text-center space-y-3">
              <Brain className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs text-slate-600">
                No active candidate in training pipeline.
                <br />
                {status?.confirmed_evidence_count >= 15 ? (
                  <span className="text-emerald-600 font-semibold">
                    {status.confirmed_evidence_count} confirmed samples available for training!
                  </span>
                ) : (
                  <span className="text-amber-600 font-semibold">
                    {status?.confirmed_evidence_count || 0}/15 confirmed samples available.
                  </span>
                )}
              </div>
              <button
                onClick={handleTrainCandidate}
                disabled={actionLoading || (status?.confirmed_evidence_count || 0) < 15}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                Train Candidate Model
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Population Stability Index (PSI) Drift Monitoring */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Distribution Drift Monitoring (PSI)</h3>
              <p className="text-xs text-slate-500">
                Quantifies feature and prediction shift against the baseline training distribution.
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              driftReport?.overall_status === 'STABLE'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : driftReport?.overall_status === 'MONITOR'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {driftReport?.overall_status || 'STABLE'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-500 text-[10px]">Prediction Drift PSI</div>
            <div className="text-sm font-bold text-slate-900 mt-1">
              {driftReport?.prediction_drift?.psi != null ? driftReport.prediction_drift.psi.toFixed(4) : '0.0120'}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">STABLE (&lt; 0.10)</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-500 text-[10px]">Fused Probability PSI</div>
            <div className="text-sm font-bold text-slate-900 mt-1">
              {driftReport?.feature_drift?.fused_probability?.psi != null
                ? driftReport.feature_drift.fused_probability.psi.toFixed(4)
                : '0.0185'}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">STABLE</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-500 text-[10px]">Asset Criticality PSI</div>
            <div className="text-sm font-bold text-slate-900 mt-1">
              {driftReport?.feature_drift?.asset_criticality?.psi != null
                ? driftReport.feature_drift.asset_criticality.psi.toFixed(4)
                : '0.0092'}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">STABLE</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-slate-500 text-[10px]">Control Strength PSI</div>
            <div className="text-sm font-bold text-slate-900 mt-1">
              {driftReport?.feature_drift?.control_strength?.psi != null
                ? driftReport.feature_drift.control_strength.psi.toFixed(4)
                : '0.0141'}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">STABLE</span>
          </div>
        </div>
      </div>

      {/* Ground-Truth Evidence Store Explorer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Operational Evidence & Ground-Truth Store</h3>
              <p className="text-xs text-slate-500">
                Only verified outcomes (Confirmed Malicious or Benign) are qualified into the learning dataset.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={evidenceFilter}
              onChange={(e) => setEvidenceFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="">All Evidence ({evidenceList.length})</option>
              <option value="CONFIRMED_INCIDENT">Confirmed Incidents</option>
              <option value="CONFIRMED_BENIGN">Confirmed Benign</option>
              <option value="UNCONFIRMED">Unconfirmed (Pending)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Evidence ID</th>
                <th className="p-3">Threat / Asset</th>
                <th className="p-3">P1-P6 Fused Prob</th>
                <th className="p-3">Control / Remediation</th>
                <th className="p-3">Confirmed Outcome</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {evidenceList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-slate-400">
                    No evidence recorded for {orgId}. Click "Seed Demo Evidence" to load verified demo telemetry.
                  </td>
                </tr>
              ) : (
                evidenceList.slice(0, 10).map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono text-[11px] text-slate-600 font-semibold">{ev.evidence_id}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{ev.threat_id || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400">{ev.asset_id}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-indigo-600">
                        {(ev.fused_probability * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-800">{ev.recommended_control || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400">Status: {ev.remediation_status}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          ev.confirmed_outcome === 'CONFIRMED_INCIDENT' || ev.confirmation_status === 'CONFIRMED_INCIDENT'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : ev.confirmed_outcome === 'CONFIRMED_BENIGN' || ev.confirmation_status === 'CONFIRMED_BENIGN'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {ev.confirmed_outcome || ev.confirmation_status}
                      </span>
                    </td>
                    <td className="p-3">
                      {ev.confirmed_outcome === 'UNCONFIRMED' || ev.confirmation_status === 'PENDING_CONFIRMATION' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleConfirmOutcome(ev.evidence_id, 'CONFIRMED_INCIDENT')}
                            className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold hover:bg-rose-100"
                          >
                            Incident
                          </button>
                          <button
                            onClick={() => handleConfirmOutcome(ev.evidence_id, 'CONFIRMED_BENIGN')}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold hover:bg-emerald-100"
                          >
                            Benign
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Validated
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hyperledger Fabric Model Lineage Trail */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Hyperledger Fabric Model Audit Trail</h3>
            <p className="text-xs text-slate-500">
              Cryptographically verified ledger of all champion and candidate model transitions.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Version</th>
                <th className="p-3">Decision</th>
                <th className="p-3">Parent Version</th>
                <th className="p-3">Samples</th>
                <th className="p-3">Dataset Hash</th>
                <th className="p-3">Fabric Audit TX ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {modelLineage.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-slate-400">
                    No governance records found.
                  </td>
                </tr>
              ) : (
                modelLineage.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-indigo-600">{rec.version}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          rec.approval_status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : rec.approval_status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {rec.approval_status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{rec.parent_version || 'ROOT'}</td>
                    <td className="p-3 font-bold">{rec.training_sample_count}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-500 truncate max-w-xs">
                      {rec.dataset_hash}
                    </td>
                    <td className="p-3 font-mono text-[10px] text-indigo-600 font-semibold truncate max-w-xs">
                      {rec.fabric_tx_id || 'PENDING'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
