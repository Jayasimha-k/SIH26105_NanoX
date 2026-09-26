import React, { useState, useEffect } from 'react';
import {
  Shield,
  Zap,
  Lock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Cpu,
  Layers,
  FileText,
  DollarSign,
  Activity,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';

export default function SecurityTestingView({ assets }) {
  const [targetAssetId, setTargetAssetId] = useState('ASSET-001');
  const [targetEndpoint, setTargetEndpoint] = useState('10.0.1.50');
  const [scopeToken, setScopeToken] = useState('AUTH-TOKEN-DEMO-2026-CRYPTOGRAPHIC');
  const [testMode, setTestMode] = useState('VALIDATED_POC');
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.getSecurityTestHistory().then((data) => {
      setHistory(data.runs || []);
    }).catch(() => {});
  }, []);

  const handleLaunchTest = async () => {
    setErrorMessage(null);
    setIsRunning(true);
    try {
      const res = await api.launchSecurityTest({
        test_name: "Authorized Local Container Sandbox Pentest",
        target_asset_id: targetAssetId,
        target_url_or_ip: targetEndpoint,
        scope_authorization_token: scopeToken,
        authorized_by: "CISO_SECURITY_DIRECTOR",
        test_mode: testMode
      });
      setTestResult(res);
      // Reload history
      api.getSecurityTestHistory().then((d) => setHistory(d.runs || [])).catch(() => {});
    } catch (err) {
      console.error("Security testing error:", err);
      setErrorMessage(err.message || "Scope authorization rejected or test execution failed.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div id="spotlight-security-testing" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="cyber-badge bg-purple-50 text-purple-700 border-purple-200">Strix Autonomous Agent</span>
            <span className="text-xs font-mono text-slate-400">Strict Scope Enforced</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" />
            Authorized Security Testing & Strix Agent
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic autonomous vulnerability validation with working proofs-of-concept mapped into CyberOptRQ EAL financial exposure.
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 font-mono text-xs font-bold self-start sm:self-auto">
          Scope Guard: Active
        </span>
      </div>

      {/* STRICT SCOPE POLICY CALLOUT — Strix spotlight target */}
      <div id="spotlight-strix" className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-start gap-3">
        <Lock className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <strong className="text-purple-900">Strict Scope Restriction:</strong> Strix Autonomous Security Testing operates strictly on explicitly enrolled customer VPC assets and local sandbox targets.
          Scanning arbitrary public internet addresses is cryptographically prohibited by backend policy gates.
        </div>
      </div>

      {/* Test Launch Form & Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 cyber-card space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Zap className="w-4 h-4 text-purple-600" />
            Configure Authorized Test Target
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Target Asset</label>
              <select
                value={targetAssetId}
                onChange={(e) => {
                  setTargetAssetId(e.target.value);
                  if (e.target.value === 'ASSET-001') setTargetEndpoint('10.0.1.50');
                  if (e.target.value === 'ASSET-002') setTargetEndpoint('10.0.2.100');
                  if (e.target.value === 'ASSET-003') setTargetEndpoint('10.0.3.10');
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-purple-500"
              >
                <option value="ASSET-001">ASSET-001: Core Oracle Production DB (10.0.1.50)</option>
                <option value="ASSET-002">ASSET-002: Production K8s Microservices (10.0.2.100)</option>
                <option value="ASSET-003">ASSET-003: Payment API Gateway (10.0.3.10)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Target IP / VPC Endpoint</label>
              <input
                type="text"
                value={targetEndpoint}
                onChange={(e) => setTargetEndpoint(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Cryptographic Scope Authorization Token</label>
              <input
                type="text"
                value={scopeToken}
                onChange={(e) => setScopeToken(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono text-[11px] focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Testing Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTestMode('VALIDATED_POC')}
                  className={`p-2 rounded-xl text-center font-bold text-xs border transition-all ${
                    testMode === 'VALIDATED_POC'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Validated PoC
                </button>
                <button
                  type="button"
                  onClick={() => setTestMode('DYNAMIC_PROBE')}
                  className={`p-2 rounded-xl text-center font-bold text-xs border transition-all ${
                    testMode === 'DYNAMIC_PROBE'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Recon Probe
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleLaunchTest}
                disabled={isRunning}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isRunning ? (
                  <span>Strix Agent Probing & Validating...</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Launch Authorized Autonomous Test</span>
                  </>
                )}
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Test Result / Proof of Concept Panel (7 Cols) */}
        <div className="lg:col-span-7 cyber-card space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Cpu className="w-4 h-4 text-indigo-600" />
            Validated Evidence & CyberOptRQ EAL Translation
          </h3>

          {testResult ? (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                  <span className="font-bold text-rose-800 text-xs uppercase">
                    Validated Threat Exploitation Proof-of-Concept
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-rose-700">
                  {testResult.finding?.cve}
                </span>
              </div>

              {/* PoC Details */}
              <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs space-y-1.5 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Autonomous Agent PoC:</span>
                <p className="text-emerald-400">{testResult.finding?.proof_of_concept}</p>
                <div className="text-[10px] text-slate-500 pt-1 flex justify-between">
                  <span>Method: {testResult.finding?.validation_method}</span>
                  <span>Confidence: 98%</span>
                </div>
              </div>

              {/* CyberOptRQ Financial Impact Translation */}
              <div className="grid grid-cols-3 gap-3 font-mono text-center text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 block uppercase">Fused Prob</span>
                  <div className="text-lg font-black text-rose-700">
                    {(testResult.pipeline_translation?.fused_probability * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 block uppercase">Surge EAL</span>
                  <div className="text-lg font-black text-rose-700">
                    ₹{(testResult.pipeline_translation?.validated_threat_eal / 100000).toFixed(1)}L
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 block uppercase">ROSI Expected</span>
                  <div className="text-lg font-black text-emerald-700">
                    {testResult.recommended_remediation?.rosi_pct}%
                  </div>
                </div>
              </div>

              {/* Recommended Action */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                <strong className="text-emerald-900 block font-bold">Recommended Mitigation:</strong>
                <p className="text-emerald-800">
                  {testResult.recommended_remediation?.control_name} (Cost: ₹{(testResult.recommended_remediation?.cost_inr / 100000).toFixed(1)}L)
                </p>
                <span className="text-[11px] text-emerald-700 block">
                  Reduces residual loss to ₹{(testResult.recommended_remediation?.expected_residual_eal / 100000).toFixed(1)}L.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 font-mono text-xs">
              Select an authorized asset and click "Launch Authorized Autonomous Test" to execute Strix validation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
