import React, { useState, useEffect } from 'react';
import {
  Building2,
  Server,
  Cpu,
  Lock,
  Globe,
  Database,
  ShieldAlert,
  Save,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  FileCheck,
  Check
} from 'lucide-react';
import { api } from '../../services/api';

export default function MyOrganizationView() {
  const [orgData, setOrgData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit fields
  const [industry, setIndustry] = useState('');
  const [financialExposure, setFinancialExposure] = useState(3500000);
  const [countryRegion, setCountryRegion] = useState('');
  const [newTech, setNewTech] = useState('');

  const loadOrg = async () => {
    try {
      setLoading(true);
      const data = await api.getMyOrganization();
      setOrgData(data);
      setIndustry(data.industry || 'FinTech & Enterprise Cloud');
      setFinancialExposure(data.financial_exposure || 3500000);
      setCountryRegion(data.country_region || 'India / South Asia');
    } catch (e) {
      console.error("Error loading organization data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrg();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.updateMyOrganization({
        industry,
        financial_exposure: parseFloat(financialExposure),
        country_region: countryRegion,
        technology_stack: orgData.technology_stack
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadOrg();
    } catch (e) {
      console.error("Error updating organization:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTech = () => {
    if (!newTech.trim() || !orgData) return;
    const updated = [...(orgData.technology_stack || []), newTech.trim()];
    setOrgData({ ...orgData, technology_stack: updated });
    setNewTech('');
  };

  const handleRemoveTech = (idx) => {
    if (!orgData) return;
    const updated = orgData.technology_stack.filter((_, i) => i !== idx);
    setOrgData({ ...orgData, technology_stack: updated });
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-xs">
        Loading organization context...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="cyber-badge bg-blue-50 text-blue-700 border-blue-200">Tenant Context</span>
            <span className="text-xs font-mono text-slate-400">ID: {orgData?.id || 'org_abc_tech'}</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            My Organization Data Layer
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise profile, perimeter footprint, and defensive posture driving organization-adapted risk scoring.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          {saving ? <span className="animate-spin">↻</span> : saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Persisting...' : saveSuccess ? 'Saved & Synced!' : 'Save Changes'}</span>
        </button>
      </div>

      {/* WHY DOES CYBEROPTRQ NEED THIS DATA? BANNER */}
      <div className="p-5 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 border border-blue-200 rounded-2xl flex items-start gap-4">
        <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm shrink-0">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-slate-900">Why Does CyberOptRQ Need Organization Data?</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Generic threat feeds tell you that a CVE exists in the wild. CyberOptRQ fuses your exact technology stack,
            exposure levels (internet-facing vs air-gapped), defensive controls (MFA, EDR), and asset financial values
            to convert generic alerts into <strong>organization-specific exploitation probabilities</strong> and <strong>Expected Annual Loss (EAL)</strong>.
          </p>
        </div>
      </div>

      {/* Grid: Context & Defensive Posture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Organization Profile & Financial Exposure (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="cyber-card space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-blue-600" />
              Enterprise Profile & Business Context
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
              <div>
                <label className="block text-slate-500 mb-1">Organization Name</label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold">
                  {orgData?.name || 'ABC Technologies Enterprise'}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Domain Boundary</label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono">
                  {orgData?.domain || 'abctech.internal'}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Industry Sector</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Jurisdiction / Country Region</label>
                <input
                  type="text"
                  value={countryRegion}
                  onChange={(e) => setCountryRegion(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-500 mb-1">Estimated Enterprise Breach Financial Impact (₹)</label>
                <input
                  type="number"
                  value={financialExposure}
                  onChange={(e) => setFinancialExposure(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Used by EAL equation: EAL = P(Exploitation) &times; Financial Breach Impact.
                </p>
              </div>
            </div>
          </div>

          {/* Technology Stack & Perimeter Services */}
          <div className="cyber-card space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Server className="w-4 h-4 text-indigo-600" />
              Technology Stack & Monitored Services
            </h3>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-600">Active Technology Stack Components</label>
              <div className="flex flex-wrap gap-2">
                {orgData?.technology_stack?.map((tech, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-800 text-xs font-mono font-semibold transition-colors"
                  >
                    <span>{tech}</span>
                    <button
                      onClick={() => handleRemoveTech(idx)}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-1"
                      title="Remove technology"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add technology (e.g., Apache, Nginx, Docker)..."
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTech()}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddTech}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  + Add
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-600 mb-2">Designated Critical Business Services</label>
              <ul className="space-y-1.5 text-xs font-mono text-slate-700">
                {orgData?.critical_services?.map((srv, idx) => (
                  <li key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{srv}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Defensive Posture & Quick Summary (1 Col) */}
        <div className="space-y-6">
          <div className="cyber-card space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Lock className="w-4 h-4 text-emerald-600" />
              Defensive Coverage Metrics
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">MFA Coverage</span>
                <div className="text-2xl font-black text-emerald-700 font-mono mt-0.5">
                  {orgData?.mfa_coverage_pct || 98.5}%
                </div>
                <span className="text-[10px] text-emerald-600">Hardware token & authenticator apps</span>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">EDR / XDR Agent Fleet</span>
                <div className="text-2xl font-black text-blue-700 font-mono mt-0.5">
                  {orgData?.edr_coverage_pct || 95.0}%
                </div>
                <span className="text-[10px] text-blue-600">Active real-time agent telemetry</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Historical Incident Count</span>
                <div className="text-2xl font-black text-slate-800 font-mono mt-0.5">
                  {orgData?.historical_incidents_count || 2}
                </div>
                <span className="text-[10px] text-slate-500">Recorded post-mortem security events</span>
              </div>
            </div>
          </div>

          {/* Cloud Footprint */}
          <div className="cyber-card space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Globe className="w-4 h-4 text-purple-600" />
              Cloud Infrastructure
            </h3>

            <div className="space-y-2 text-xs font-mono">
              {orgData?.cloud_providers?.map((prov, i) => (
                <div key={i} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-800">{prov}</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">CONNECTED</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
