import React from 'react';
import { AlertTriangle, ShieldAlert, FileText, CheckCircle } from 'lucide-react';

export default function VulnerabilitiesView({ vulnerabilities }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Vulnerability Threat Intelligence</h2>
          <p className="text-slate-400 text-xs mt-1">CVE, EPSS scores, CISA Known Exploited Vulnerability (KEV) status & base breach impacts</p>
        </div>
        <span className="cyber-badge bg-red-950 text-red-400 border border-red-800">
          <ShieldAlert className="w-3.5 h-3.5" /> NVD & CISA Feed Synced
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {vulnerabilities.map((v) => (
          <div key={v.id} className="cyber-card space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400">{v.cve_id}</span>
                <h3 className="font-bold text-slate-100 text-sm mt-0.5">{v.title}</h3>
              </div>
              {v.cisa_kev ? (
                <span className="cyber-badge bg-red-500/20 text-red-400 border border-red-500/40">CISA KEV</span>
              ) : (
                <span className="cyber-badge bg-slate-800 text-slate-400">Standard</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
              <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">CVSS 3.1 Severity</span>
                <span className={`font-bold ${v.cvss_score >= 9.0 ? 'text-red-400' : 'text-amber-400'}`}>{v.cvss_score} / 10.0</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">EPSS Probability</span>
                <span className="font-bold text-purple-400">{(v.epss_score * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Attack Vector:</span>
                <span className="font-mono text-cyan-300">{v.attack_vector}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Base Breach Impact:</span>
                <span className="font-semibold text-emerald-400">₹{(v.financial_impact_base / 100000).toFixed(1)} Lakhs</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
