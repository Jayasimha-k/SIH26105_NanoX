import React, { useState, useEffect } from 'react';
import { X, Building2, Server, Shield, AlertTriangle, RefreshCcw, Database, Layers } from 'lucide-react';
import { api } from '../services/api';

/**
 * OrganizationDataPanel — Slide-in panel triggered by [ ORGANIZATION DATA ] button.
 * Reads live assets, controls, incidents, and intelligence org profile from backend.
 * Feeds the P1-P5 organization-specific risk adaptation layer.
 */
export function OrganizationDataPanel({ onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const d = await api.getOrganizationProfile('org_abc_tech');
        setData(d);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl h-full overflow-y-auto flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Organization Data</h2>
              <p className="text-[10px] text-slate-500 font-medium">Live inputs to P1–P5 risk adaptation layer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6 flex-1">
          {loading && (
            <div className="flex items-center gap-3 p-8 justify-center text-slate-500">
              <RefreshCcw className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Loading organization data...</span>
            </div>
          )}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              {error}
            </div>
          )}

          {data && (
            <>
              {/* Source badge */}
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900">
                <Database className="w-3 h-3 flex-shrink-0" />
                <span className="font-medium">{data.data_source}</span>
              </div>

              {/* Intelligence Profile */}
              {data.intelligence_profile && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Intelligence Org Profile</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Organization</div>
                      <div className="font-bold text-slate-900 mt-0.5">{data.intelligence_profile.name}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Industry</div>
                      <div className="font-bold text-slate-900 mt-0.5">{data.intelligence_profile.industry || '—'}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Domain</div>
                      <div className="font-bold text-slate-900 mt-0.5 break-all">{data.intelligence_profile.domain || '—'}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Financial Exposure</div>
                      <div className="font-bold text-rose-700 mt-0.5">
                        {data.intelligence_profile.financial_exposure_inr
                          ? `₹${(data.intelligence_profile.financial_exposure_inr / 1e7).toFixed(1)} Cr`
                          : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Tech Stack */}
                  {data.intelligence_profile.technology_stack?.length > 0 && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Technology Stack</div>
                      <div className="flex flex-wrap gap-1.5">
                        {data.intelligence_profile.technology_stack.map((t, i) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cloud Providers */}
                  {data.intelligence_profile.cloud_providers?.length > 0 && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Cloud Providers</div>
                      <div className="flex flex-wrap gap-1.5">
                        {data.intelligence_profile.cloud_providers.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[10px] font-bold">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Existing Vulnerabilities */}
                  {data.intelligence_profile.existing_vulnerabilities?.length > 0 && (
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                      <div className="text-[10px] font-bold text-rose-400 uppercase mb-2">Known Vulnerabilities (Org Context)</div>
                      <div className="flex flex-wrap gap-1.5">
                        {data.intelligence_profile.existing_vulnerabilities.map((v, i) => (
                          <span key={i} className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-bold font-mono">{v}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Live Assets */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Live Assets</h3>
                  <span className="text-[10px] font-bold text-slate-500">{data.asset_count} registered</span>
                </div>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {data.live_assets.length === 0 ? (
                    <p className="text-xs text-slate-500 p-3">No assets registered.</p>
                  ) : data.live_assets.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <Server className="w-3 h-3 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{a.name}</div>
                        <div className="text-[10px] text-slate-500">{a.type} | Exposure: {a.exposure_level}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[10px] font-bold text-slate-700">Criticality</div>
                        <div className="font-black text-blue-700">{a.criticality_score}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Deployed Controls</h3>
                  <span className="text-[10px] font-bold text-slate-500">{data.deployed_controls.length} controls</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.deployed_controls.map((c) => (
                    <span key={c.id} className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pipeline note */}
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed">
                <strong>Pipeline Role:</strong> {data.note}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


/**
 * Model6Panel — Slide-in panel triggered by [ MODEL 6 ] button.
 * Reads real P6 artifact metadata and fusion config from disk.
 */
export function Model6Panel({ onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const d = await api.getModel6Info();
        setData(d);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl h-full overflow-y-auto flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Model 6 — P6 Network Evidence</h2>
              <p className="text-[10px] text-slate-500 font-medium">CIC-IDS2017 XGBoost — Network flow behavioral evidence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6 flex-1">
          {loading && (
            <div className="flex items-center gap-3 p-8 justify-center text-slate-500">
              <RefreshCcw className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Loading P6 metadata...</span>
            </div>
          )}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              {error}
            </div>
          )}

          {data && (
            <>
              {/* Artifact status */}
              <div className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold ${
                data.artifact_status === 'LOADED'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <Shield className="w-3 h-3 flex-shrink-0" />
                Artifact: {data.artifact_file} — {data.artifact_status}
              </div>

              {/* Pipeline Role */}
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1">Pipeline Role</div>
                {data.role_in_pipeline}
              </div>

              {/* Fusion V2 Config */}
              {data.fusion_v2 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Fusion V2 Configuration</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">P6 Weight (w_p6)</div>
                      <div className="font-black text-indigo-700 text-xl mt-1">{data.fusion_v2.p6_weight ?? '0.90'}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">P5 Weight (1-w)</div>
                      <div className="font-black text-blue-700 text-xl mt-1">
                        {data.fusion_v2.p5_weight ?? (1 - (data.fusion_v2.p6_weight ?? 0.90)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-800 text-emerald-400 rounded-xl font-mono text-[10px] leading-relaxed">
                    P_fused = w_p5 × P5 + w_p6 × P6<br />
                    P_fused = {data.fusion_v2.p5_weight ?? 0.10} × P5 + {data.fusion_v2.p6_weight ?? 0.90} × P6
                  </div>
                </div>
              )}

              {/* Model Metadata */}
              {data.artifact && !data.artifact.error && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">P6 Model Artifact</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Dataset</div>
                      <div className="font-bold text-slate-900 mt-0.5">{data.artifact.dataset}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Framework</div>
                      <div className="font-bold text-slate-900 mt-0.5">{data.artifact.framework} v{data.artifact.framework_version}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Train Rows</div>
                      <div className="font-black text-blue-700 mt-0.5">{data.artifact.data_split?.train_rows?.toLocaleString()}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Feature Count</div>
                      <div className="font-black text-blue-700 mt-0.5">{data.artifact.features?.count} features</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">File Size</div>
                      <div className="font-bold text-slate-900 mt-0.5">{data.artifact.model_file_size_mb} MB</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Train Time</div>
                      <div className="font-bold text-slate-900 mt-0.5">{data.artifact.training_time_seconds}s</div>
                    </div>
                  </div>

                  {/* Hyperparameters */}
                  {data.artifact.hyperparameters && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Hyperparameters</div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px] font-mono">
                        {Object.entries(data.artifact.hyperparameters).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-slate-500">{k}</span>
                            <span className="font-bold text-slate-800">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feature names preview */}
                  {data.artifact.features?.names && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                        Input Features ({data.artifact.features.names.length} total — CIC-IDS2017 Flow Features)
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                        {data.artifact.features.names.slice(0, 20).map((f, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[9px] rounded font-mono">{f}</span>
                        ))}
                        {data.artifact.features.names.length > 20 && (
                          <span className="px-1.5 py-0.5 text-slate-500 text-[9px]">+{data.artifact.features.names.length - 20} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {data.model_card_excerpt && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Model Card Excerpt</div>
                  <pre className="text-[10px] text-slate-700 whitespace-pre-wrap leading-relaxed">{data.model_card_excerpt}</pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
