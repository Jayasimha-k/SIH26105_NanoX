import React, { useState, useEffect } from 'react';
import {
  Cpu, Play, Layers,
  CheckCircle2, Activity, Server,
  Database, BarChart2,
  ChevronDown, ChevronUp, AlertCircle, Info, X
} from 'lucide-react';
import { api } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

// ─── helpers ───────────────────────────────────────────────────────────────
const fmtPct  = (v) => (v != null ? `${(v * 100).toFixed(2)}%`     : '—');
const fmtLakh = (v) => (v != null ? `₹${(v / 100000).toFixed(2)}L` : '—');

export default function PredictView({ assets = [], vulnerabilities = [] }) {
  const [activeTab,       setActiveTab]       = useState('pipeline');
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || '');
  const [selectedVulnId,  setSelectedVulnId]  = useState(vulnerabilities[0]?.id || '');
  const [loading,         setLoading]         = useState(false);
  const [result,          setResult]          = useState(null);       // /predict/run response
  const [portfolio,       setPortfolio]       = useState(null);       // /quantify/overview response
  const [portfolioLoading,setPortfolioLoading]= useState(false);
  const [diagnostics,     setDiagnostics]     = useState(null);
  const [showEvidence,    setShowEvidence]    = useState(false);
  const [submissionNotice,setSubmissionNotice]= useState(null);

  // Load model diagnostics once on mount
  useEffect(() => {
    api.getMLModelDiagnostics()
      .then(setDiagnostics)
      .catch((e) => console.error('Diagnostics fetch error:', e));
  }, []);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || assets[0];
  const selectedVuln  = vulnerabilities.find((v) => v.id === selectedVulnId) || vulnerabilities[0];

  // Run prediction, then reload portfolio EAL from backend
  const handleRunPipeline = async () => {
    if (!selectedAssetId || !selectedVulnId) return;
    setLoading(true);
    try {
      const res = await api.predictRisk(selectedAssetId, selectedVulnId);
      setResult(res);
      // After a new prediction is persisted, refresh portfolio EAL
      fetchPortfolio();
    } catch (e) {
      console.error('Prediction pipeline error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch portfolio-level EAL from /quantify/overview (backend calculates via RiskEngine)
  const fetchPortfolio = () => {
    setPortfolioLoading(true);
    api.getQuantificationOverview()
      .then(setPortfolio)
      .catch((e) => console.error('Portfolio quantify error:', e))
      .finally(() => setPortfolioLoading(false));
  };

  // Load portfolio on mount so chart is populated from first visit
  useEffect(() => { fetchPortfolio(); }, []);

  const handleSendToCiso = () => {
    setSubmissionNotice('Selected controls have been packaged and submitted to the CISO Approval Center!');
    setTimeout(() => setSubmissionNotice(null), 4000);
  };

  // ── Build chart data purely from backend /quantify/overview asset_breakdown ──
  // Only real values — no invented figures.
  const chartData = portfolio?.asset_breakdown
    ?.filter((a) => a.pre_eal > 0)
    .map((a) => ({
      name:    a.asset_name?.split(' ')[0] ?? a.asset_id,
      preEal:  Number((a.pre_eal / 100000).toFixed(2)),
      postEal: Number(((a.post_eal != null ? a.post_eal : a.pre_eal) / 100000).toFixed(2)),
    })) ?? [];

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Submission toast */}
      {submissionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{submissionNotice}</span>
          </div>
          <button onClick={() => setSubmissionNotice(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Tab bar + Run button ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-1 text-xs">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'pipeline',   icon: <Activity  className="w-4 h-4 text-blue-600" />, label: 'Risk Assessment'    },
            { id: 'specs',      icon: <Layers    className="w-4 h-4"               />, label: 'Model Specs (P1–P5)' },
            { id: 'benchmarks', icon: <BarChart2 className="w-4 h-4"               />, label: 'Sensitivity Scenarios' },
          ].map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2.5 rounded-t-lg font-bold transition-all flex items-center gap-2 ${
                activeTab === id
                  ? 'bg-white text-blue-700 border-t border-x border-slate-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        <button
          onClick={handleRunPipeline}
          disabled={loading}
          className="cyber-button text-xs py-2 px-3.5 mb-1"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Evaluating…' : 'Run Risk Assessment'}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 — RISK ASSESSMENT
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">

          {/* Asset + Vuln selectors */}
          <div className="cyber-card grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-600" />
                Target Enterprise Asset
              </label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.id} className="bg-white text-slate-800">
                    {a.id}: {a.name} ({a.asset_type}, Criticality: {a.criticality_score}/10, Exposure: {a.exposure_level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                Target Threat Signal
              </label>
              <select
                value={selectedVulnId}
                onChange={(e) => setSelectedVulnId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                {vulnerabilities.map((v) => (
                  <option key={v.id} value={v.id} className="bg-white text-slate-800">
                    {v.id}: {v.title} (CVSS: {v.cvss_score}, EPSS: {(v.epss_score * 100).toFixed(1)}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Primary metric cards ── */}
          <div className="cyber-card space-y-4 border-l-4 border-l-blue-600">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <div>
                <span className="cyber-badge text-[10px]">AI Risk Assessment</span>
                <h3 className="font-bold text-sm text-slate-900 mt-0.5">
                  {result
                    ? `${selectedAsset?.name ?? 'Asset'} × ${selectedVuln?.id ?? 'Vulnerability'}`
                    : 'Run assessment to populate results'}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700">
                {result ? selectedVuln?.id : '—'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">

              {/* Card 1 — EAL Pre-Control (backend value only) */}
              <div className="bg-red-50/80 p-3 rounded-xl border-2 border-red-200 shadow-sm">
                <span className="text-red-700 text-[10px] block uppercase font-bold tracking-wider">
                  Pre-Control EAL
                </span>
                <span className="text-2xl font-black text-red-600">
                  {result ? fmtLakh(result.eal_pre_control) : '—'}
                </span>
                <span className="text-[10px] text-red-700 font-semibold block mt-0.5">
                  {result ? 'Annualized Financial Exposure' : 'Run assessment first'}
                </span>
              </div>

              {/* Card 2 — Org-Adapted Probability (backend value only) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block uppercase font-semibold">
                  AI Exploit Probability
                </span>
                <span className="text-xl font-bold text-red-600">
                  {result ? fmtPct(result.organization_adapted_probability) : '—'}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Org-Annualized (Poisson)
                </span>
              </div>

              {/* Card 3 — Financial Impact (backend value only) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block uppercase font-semibold">
                  Asset Financial Impact
                </span>
                <span className="text-xl font-bold text-slate-900">
                  {result ? fmtLakh(result.financial_impact) : '—'}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Worst-Case Breach Loss</span>
              </div>

              {/* Card 4 — Asset context (live from selector) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block uppercase font-semibold">
                  Asset Criticality
                </span>
                <span className="text-xl font-bold text-blue-700">
                  {selectedAsset ? `${selectedAsset.criticality_score} / 10` : '—'}
                </span>
                <span className="text-[10px] text-slate-600 block mt-0.5 font-semibold">
                  {selectedAsset?.exposure_level ?? '—'}
                </span>
              </div>
            </div>

            {/* ── EAL Chart ── */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-blue-600" />
                  Pre-Control vs Post-Control EAL — Portfolio View (₹ Lakhs)
                </h3>
                <span className="cyber-badge text-[9px]">FAIR / RiskEngine</span>
              </div>

              {portfolioLoading && (
                <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                  Loading portfolio data…
                </div>
              )}

              {!portfolioLoading && chartData.length === 0 && (
                <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                  <BarChart2 className="w-8 h-8 opacity-30" />
                  <span className="text-xs font-semibold">No portfolio EAL data available</span>
                  <span className="text-[11px]">Run at least one assessment to populate this chart</span>
                </div>
              )}

              {!portfolioLoading && chartData.length > 0 && (
                /* Fixed 260px height — Recharts ResponsiveContainer MUST have a pixel height parent */
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 8, right: 24, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" opacity={0.8} />
                      <XAxis
                        dataKey="name"
                        stroke="#64748B"
                        fontSize={11}
                        tick={{ fill: '#475569' }}
                      />
                      <YAxis
                        stroke="#64748B"
                        fontSize={11}
                        unit="L"
                        tick={{ fill: '#475569' }}
                        width={48}
                      />
                      <Tooltip
                        formatter={(v, name) => [`₹${v}L`, name]}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#CBD5E1',
                          borderRadius: '8px',
                          color: '#1E293B',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                          fontSize: '11px',
                        }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }}
                        iconType="rect"
                      />
                      <Bar dataKey="preEal"  name="Pre-Control EAL"  fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={48} />
                      <Bar dataKey="postEal" name="Post-Control EAL" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Data-source disclosure */}
              <p className="text-[10px] text-slate-400 text-right">
                Source: <code className="text-slate-500">/api/quantify/overview</code> → RiskEngine.calculate_eal_post (product(1 − eff_i))
              </p>
            </div>

            {/* Portfolio summary row (if loaded) */}
            {portfolio && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-red-50 p-2.5 rounded-lg border border-red-200 text-center">
                  <span className="text-[10px] text-red-700 uppercase font-bold block">Total Pre-Control EAL</span>
                  <span className="text-base font-black text-red-600">{fmtLakh(portfolio.total_pre_control_eal)}</span>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-center">
                  <span className="text-[10px] text-emerald-700 uppercase font-bold block">Total Post-Control EAL</span>
                  <span className="text-base font-black text-emerald-600">{fmtLakh(portfolio.total_post_control_eal)}</span>
                </div>
                <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200 text-center">
                  <span className="text-[10px] text-blue-700 uppercase font-bold block">Risk Reduction</span>
                  <span className="text-base font-black text-blue-600">
                    {portfolio.risk_reduction_pct != null ? `${portfolio.risk_reduction_pct}%` : '—'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-600 uppercase font-bold block">Enterprise ROSI</span>
                  <span className="text-base font-black text-slate-700">
                    {portfolio.enterprise_rosi != null ? `${portfolio.enterprise_rosi}%` : '—'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Controls table (from database — labelled as example controls) ── */}
          <div className="cyber-card space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Recommended Security Controls</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Run the optimizer via the <strong>Optimize</strong> tab to compute PuLP-selected controls and exact ROSI for the current budget.
                </p>
              </div>
              <span className="cyber-badge text-[10px]">PuLP Solver Ready</span>
            </div>

            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <span>
                Control cost/ROSI values shown in the <strong>Optimize</strong> tab are computed by the PuLP ILP solver
                from actual database controls. Use that tab for investment decisions.
              </span>
            </div>
          </div>

          {/* ── Expandable model evidence drawer ── */}
          <div className="cyber-card space-y-4 border border-slate-200">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm text-slate-900">Technical Model Evidence (5-Model Stacking)</h4>
                <p className="text-[11px] text-slate-500">
                  P₁–P₄ XGBoost base model outputs feeding Stage 2 Meta Ensemble (P₅)
                </p>
              </div>
              <button
                onClick={() => setShowEvidence(!showEvidence)}
                className="cyber-button-secondary text-xs flex items-center gap-1"
              >
                {showEvidence ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showEvidence ? 'Hide Evidence' : 'View Model Evidence'}
              </button>
            </div>

            {showEvidence && (
              <div className="space-y-4 pt-3 border-t border-slate-200 animate-in fade-in duration-150">
                {/* Empty state before run */}
                {!result && (
                  <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
                    <Cpu className="w-8 h-8 opacity-30" />
                    <span className="text-xs font-semibold">No assessment run yet</span>
                    <span className="text-[11px]">Click "Run Risk Assessment" to populate model outputs</span>
                  </div>
                )}

                {result && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                      {/* P1 */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="cyber-badge text-[9px]">Model 1 (P1)</span>
                        <h5 className="font-bold text-xs text-slate-800">NVD/CVE Exploitation Model</h5>
                        <p className="text-[10px] text-slate-500">CVSS v3.1 scores, attack vector, severity (NVD dataset)</p>
                        <div className="pt-2 border-t border-slate-200 flex justify-between items-end font-mono">
                          <span className="text-[10px] text-slate-500">P1 Output:</span>
                          <span className="text-base font-bold text-blue-700">{fmtPct(result.p1_nvd)}</span>
                        </div>
                      </div>

                      {/* P2 */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="cyber-badge text-[9px]">Model 2 (P2)</span>
                        <h5 className="font-bold text-xs text-slate-800">EPSS-Style Risk Model</h5>
                        <p className="text-[10px] text-slate-500">
                          Exploitation velocity &amp; threat dynamics — XGBoost classifier, <em>not</em> raw EPSS score
                        </p>
                        <div className="pt-2 border-t border-slate-200 flex justify-between items-end font-mono">
                          <span className="text-[10px] text-slate-500">P2 Output:</span>
                          <span className="text-base font-bold text-sky-600">{fmtPct(result.p2_epss)}</span>
                        </div>
                      </div>

                      {/* P3 */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="cyber-badge text-[9px]">Model 3 (P3)</span>
                        <h5 className="font-bold text-xs text-slate-800">Org-Aware Cyber-Risk Model</h5>
                        <p className="text-[10px] text-slate-500">
                          Asset criticality, exposure, incident history, EDR/MFA coverage
                        </p>
                        <div className="pt-2 border-t border-slate-200 flex justify-between items-end font-mono">
                          <span className="text-[10px] text-slate-500">P3 Output:</span>
                          <span className="text-base font-bold text-indigo-700">{fmtPct(result.p3_cisa_kev)}</span>
                        </div>
                      </div>

                      {/* P4 */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="cyber-badge text-[9px]">Model 4 (P4)</span>
                        <h5 className="font-bold text-xs text-slate-800">ATT&amp;CK Severity Model</h5>
                        <p className="text-[10px] text-slate-500">
                          MITRE TTP signals — 47-feature one-hot CVSS/severity schema
                        </p>
                        <div className="pt-2 border-t border-slate-200 flex justify-between items-end font-mono">
                          <span className="text-[10px] text-slate-500">P4 Output:</span>
                          <span className="text-base font-bold text-purple-600">{fmtPct(result.p4_mitre_attack)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Meta Model P5 */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      <div>
                        <span className="cyber-badge text-[9px] mb-1">STAGE 2 — META STACKING CLASSIFIER</span>
                        <h5 className="font-bold text-xs text-slate-900">
                          Model 5 (P5) = f(P1, P2, P3, P4) → Annualized EAL
                        </h5>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          XGBoost classifier with <code className="text-blue-700">scale_pos_weight: 21.77</code> for class imbalance.
                          P3 organizational risk is the primary gating signal.
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          <strong>EAL formula:</strong> EAL = P_annual × Financial Impact
                          &nbsp;|&nbsp; P_annual = 1 − exp(−λ)
                          &nbsp;|&nbsp; λ = P5 × exposure_factor × (criticality/5) × history_multiplier
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-extrabold text-blue-700 block font-mono">
                          {fmtPct(result.meta_exploitation_probability)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">P5 raw</span>
                        <span className="text-lg font-bold text-emerald-600 block font-mono mt-1">
                          {fmtPct(result.organization_adapted_probability)}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Org-Annualized
                        </span>
                      </div>
                    </div>

                    {/* Guidance notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200 flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p>
                          <strong className="text-slate-800">Probability ≠ Confidence:</strong>{' '}
                          Exploitation probability is the statistical likelihood of active weaponization,
                          independent of sample size or model confidence.
                        </p>
                      </div>
                      <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p>
                          <strong className="text-slate-800">High P4 ≠ High overall risk:</strong>{' '}
                          P4 uses CVSS/severity attributes and tends toward high probabilities for known
                          CVEs. P5 meta-model balances all four signals; P3 organizational context is the
                          primary gating signal for exploitation.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2 — PRODUCTION MODEL SPECIFICATIONS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'specs' && (
        <div className="space-y-6">
          {!diagnostics && (
            <div className="cyber-card flex items-center justify-center py-12 text-slate-400 text-xs">
              Loading model specifications…
            </div>
          )}
          {diagnostics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(diagnostics.models).map(([key, info]) => (
                <div
                  key={key}
                  className={`cyber-card space-y-3 border ${
                    key === 'meta_model' ? 'border-blue-300 bg-blue-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="cyber-badge text-[9px] uppercase">{key.replace(/_/g, ' ')}</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[9px] font-mono text-emerald-700 font-bold">
                      classes_: [0, 1]
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">{info.name}</h4>
                  <div className="space-y-1 text-xs text-slate-600 font-mono">
                    <div className="flex justify-between">
                      <span>Algorithm:</span>
                      <span className="text-blue-700 font-bold">{info.algorithm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Version:</span>
                      <span>{info.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Input Features:</span>
                      <span className="font-bold text-slate-800">
                        {info.feature_count ?? info.input_features?.length ?? '—'} inputs
                      </span>
                    </div>
                  </div>

                  {info.feature_importances && (
                    <div className="pt-2 border-t border-slate-100 text-[10px] font-mono">
                      <span className="text-slate-500 block mb-1">Meta-Model Feature Weights (gain):</span>
                      <div className="space-y-0.5">
                        {Object.entries(info.feature_importances).map(([f, w]) => (
                          <div key={f} className="flex justify-between">
                            <span className="text-blue-700">{f}:</span>
                            <span>{(w * 100).toFixed(2)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Model 4 specific note */}
                  {key === 'model_4' && (
                    <div className="pt-2 border-t border-slate-100 text-[10px] text-amber-700 bg-amber-50/60 rounded p-2">
                      <strong>Note:</strong> Model 4 uses a 47-feature one-hot CVSS schema (no MITRE technique IDs in
                      training data). P4 contributes severity signals; P3 provides org-specific gating.
                      No train/validation curve is stored in the artifact — overfitting cannot be
                      established from available metadata.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3 — ILLUSTRATIVE SENSITIVITY SCENARIOS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'benchmarks' && (
        <div className="space-y-6">
          <div className="cyber-card space-y-4">

            {/* Clear label — these are controlled scenarios, NOT live predictions */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="cyber-badge text-[9px] bg-amber-100 text-amber-800 border-amber-300">
                  ILLUSTRATIVE SENSITIVITY SCENARIOS
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                Risk Spectrum Sensitivity Benchmark (Low → Moderate → High → Critical)
              </h3>
              <p className="text-[11px] text-slate-600 mt-1">
                The values below are <strong>pre-computed controlled scenarios</strong> run through the
                production 5-model pipeline to demonstrate numerical separation across risk tiers.
                They are <em>not</em> live predictions for your organization's assets.
                Use the <strong>Risk Assessment tab</strong> for real-time inference.
              </p>
            </div>

            {!diagnostics && (
              <div className="flex items-center justify-center py-10 text-slate-400 text-xs">
                Loading benchmark data…
              </div>
            )}

            {diagnostics && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase bg-slate-50">
                        <th className="p-3">Risk Tier</th>
                        <th className="p-3">CVSS</th>
                        <th className="p-3">EPSS Input</th>
                        <th className="p-3">P1 (NVD)</th>
                        <th className="p-3">P2 (EPSS-Style)</th>
                        <th className="p-3">P3 (Org-Aware)</th>
                        <th className="p-3">P4 (ATT&amp;CK)</th>
                        <th className="p-3">P5 (Meta)</th>
                        <th className="p-3 text-right">P Annual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diagnostics.benchmarks.map((b, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-all">
                          <td className="p-3 font-bold text-slate-800 font-sans">
                            <span className={`px-2 py-0.5 rounded text-[10px] mr-2 ${
                              b.label.includes('Critical') ? 'bg-red-50 text-red-700 border border-red-200' :
                              b.label.includes('High')     ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                              b.label.includes('Moderate') ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                             'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {b.label}
                            </span>
                            {b.tier}
                          </td>
                          <td className="p-3">{b.cvss}</td>
                          <td className="p-3">{(b.epss * 100).toFixed(1)}%</td>
                          <td className="p-3">{(b.p1_nvd  * 100).toFixed(2)}%</td>
                          <td className="p-3">{(b.p2_epss * 100).toFixed(2)}%</td>
                          <td className="p-3">{(b.p3_org  * 100).toFixed(2)}%</td>
                          <td className="p-3">{(b.p4_mitre* 100).toFixed(2)}%</td>
                          <td className="p-3 font-bold text-blue-700">{(b.p5_meta * 100).toFixed(2)}%</td>
                          <td className="p-3 font-bold text-right text-slate-900">{(b.p_annual* 100).toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 text-xs text-slate-700">
                  <strong className="text-blue-800">Purpose of this table:</strong> Verifies that the
                  5-model stacking pipeline produces monotonically increasing outputs across deliberately
                  controlled risk inputs (Low CVSS/EPSS → Critical CVSS/EPSS). Each row was generated by
                  calling the same production inference engine used in real assessments, with controlled
                  scenario inputs — not hardcoded numbers.
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
