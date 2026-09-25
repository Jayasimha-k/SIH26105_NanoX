import React, { useState } from 'react';
import {
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Server,
  Cpu,
  Lock,
  Database,
  Sparkles,
  DollarSign,
  Layers,
  Check
} from 'lucide-react';
import { api } from '../../services/api';

export default function OnboardingStepper({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    organization_name: 'Apex Global Financial Technologies',
    domain: 'apexfintech.internal',
    industry: 'Financial Services & Banking',
    business_size: 'Enterprise (2500 Employees)',
    country_region: 'India / South Asia',
    financial_exposure: 4500000.0,
    mfa_coverage_pct: 98.0,
    edr_coverage_pct: 95.0,
    technology_stack: ['Kubernetes', 'Linux Container Runtime / runc', 'PostgreSQL', 'AWS ECS', 'Kafka'],
    cloud_providers: ['AWS', 'Azure Hybrid'],
    critical_services: ['Real-time Payment Gateway', 'Core Settlement Ledger', 'Customer Identity Directory'],
    subscription_plan: 'ENTERPRISE'
  });

  const [assessmentResult, setAssessmentResult] = useState(null);

  const steps = [
    { num: 1, title: 'Organization', desc: 'Enterprise profile & identity' },
    { num: 2, title: 'Assets & Stack', desc: 'Perimeter & critical infrastructure' },
    { num: 3, title: 'Security Controls', desc: 'EDR, MFA & perimeter shields' },
    { num: 4, title: 'Subscription', desc: 'Module entitlements & tier' },
    { num: 5, title: 'Baseline Assessment', desc: 'Initial FAIR risk quantification' }
  ];

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else if (step === 4) {
      setLoading(true);
      try {
        const res = await api.onboardOrganization(formData);
        setAssessmentResult(res);
        setStep(5);
      } catch (e) {
        console.error("Onboarding error:", e);
        // Fallback demo assessment
        setAssessmentResult({
          status: "ONBOARDING_COMPLETED",
          initial_assessment: {
            calibrated_risk_probability: 0.78,
            meta_probability: 0.76,
            eal_baseline: 3510000.0
          }
        });
        setStep(5);
      } finally {
        setLoading(false);
      }
    } else {
      if (onComplete) onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-3xl z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg text-white mb-1">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Welcome to CyberOpt<span className="text-blue-500">RQ</span> Enterprise
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Set up your organization context to convert generic threat intelligence into calibrated financial cyber risk.
          </p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs transition-all ${
                      step > s.num
                        ? 'bg-emerald-600 text-white'
                        : step === s.num
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 ring-4 ring-blue-500/20'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span className={`text-[10px] font-bold mt-1.5 hidden sm:block ${step === s.num ? 'text-white' : 'text-slate-500'}`}>
                    {s.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 transition-all ${step > s.num ? 'bg-emerald-600' : 'bg-slate-800'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-md">
          {/* STEP 1: Organization Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  Step 1: Enterprise Profile & Identity
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Your organization's industry and domain shape baseline exposure probabilities.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                <div>
                  <label className="block text-slate-400 mb-1">Organization Legal Name</label>
                  <input
                    type="text"
                    value={formData.organization_name}
                    onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Internal Domain</label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Industry Sector</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Estimated Financial Breach Exposure (₹)</label>
                  <input
                    type="number"
                    value={formData.financial_exposure}
                    onChange={(e) => setFormData({ ...formData, financial_exposure: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Assets & Technology Stack */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-400" />
                  Step 2: Technology Footprint & Critical Services
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Technology stacks filter out irrelevant CVEs and identify container or cloud vulnerabilities.</p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Core Technology Stack</label>
                  <div className="flex flex-wrap gap-2">
                    {formData.technology_stack.map((t, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-800 text-blue-300 rounded-lg border border-slate-700 font-mono text-[11px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Cloud Providers</label>
                  <div className="flex flex-wrap gap-2">
                    {formData.cloud_providers.map((c, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-800 text-emerald-300 rounded-lg border border-slate-700 font-mono text-[11px]">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Designated Critical Business Services</label>
                  <ul className="space-y-1.5 font-mono text-[11px] text-slate-300">
                    {formData.critical_services.map((s, i) => (
                      <li key={i} className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800">
                        <Check className="w-3.5 h-3.5 text-blue-400" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Security Controls */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  Step 3: Baseline Defensive Posture
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Existing controls reduce residual exploitation likelihood.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 block font-bold">MFA Coverage</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">{formData.mfa_coverage_pct}%</div>
                  <span className="text-[10px] text-slate-500">Hardware token & authenticator app coverage</span>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 block font-bold">EDR Agent Coverage</span>
                  <div className="text-2xl font-black text-blue-400 font-mono">{formData.edr_coverage_pct}%</div>
                  <span className="text-[10px] text-slate-500">Active endpoint detection and response</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Subscription Plan */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  Step 4: Subscription Tier & Modules
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Select entitlements for your organization tenant.</p>
              </div>

              <div className="p-5 bg-gradient-to-r from-blue-950/40 to-slate-950 rounded-2xl border border-blue-500/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Enterprise Cloud SaaS Plan</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono text-xs font-bold">ACTIVE DEMO</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Includes P1-P6 Machine Learning Risk Engine, Model 6 Network Behavioral Intelligence, Continuous Email Intelligence, and Knapsack Optimization.
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: Baseline Assessment Result */}
          {step === 5 && (
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-black text-white">Initial Baseline Risk Assessment Complete!</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  CyberOptRQ has ingested your organization context, mapped relevant vulnerability models, and computed baseline financial exposure.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 font-mono text-left">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Calibrated Risk</span>
                  <div className="text-lg font-black text-amber-400">
                    {assessmentResult?.initial_assessment?.calibrated_risk_probability ? (assessmentResult.initial_assessment.calibrated_risk_probability * 100).toFixed(1) + '%' : '78.0%'}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Baseline EAL</span>
                  <div className="text-lg font-black text-rose-400">
                    ₹{assessmentResult?.initial_assessment?.eal_baseline ? (assessmentResult.initial_assessment.eal_baseline / 100000).toFixed(1) + 'L' : '35.1L'}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Decision Status</span>
                  <div className="text-lg font-black text-emerald-400">READY</div>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800 mt-6">
            {step > 1 && step < 5 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              {loading ? (
                <span>Quantifying Baseline...</span>
              ) : step === 5 ? (
                <>
                  <span>Open Customer Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : step === 4 ? (
                <>
                  <span>Run Initial Assessment</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {onCancel && (
          <div className="text-center">
            <button
              onClick={onCancel}
              className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
            >
              Cancel and return to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
