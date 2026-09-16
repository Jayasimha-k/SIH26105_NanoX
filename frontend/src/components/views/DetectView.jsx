import React, { useState } from 'react';
import {
  Database, ShieldAlert, Server, Activity, FileText, Globe,
  AlertTriangle, Search, Filter, ArrowUpRight, CheckCircle2,
  ExternalLink, Eye, Send, X, HelpCircle
} from 'lucide-react';

const mockSocVulnerabilities = [
  {
    cve_id: 'CVE-2024-3094',
    title: 'XZ Utils Liblzma Upstream Supply Chain Backdoor',
    asset_id: 'ASSET-002',
    asset_name: 'Production K8s Microservices Cluster',
    cvss: 10.0,
    epss: 0.95,
    exposure: 'Internet-Facing',
    cisa_kev: true,
    ai_risk: 0.94,
    ai_label: 'CRITICAL',
    mitre: 'T1195.001 (Compromise Software Supply Chain)',
    cwe: 'CWE-506 (Embedded Malicious Code)',
    first_seen: '2024-03-29',
    exploit_available: true
  },
  {
    cve_id: 'CVE-2024-21626',
    title: 'runc Leaky File Descriptor Container Escape & Host RCE',
    asset_id: 'ASSET-001',
    asset_name: 'Core Oracle Production DB',
    cvss: 9.8,
    epss: 0.88,
    exposure: 'Internal Zone',
    cisa_kev: true,
    ai_risk: 0.87,
    ai_label: 'HIGH',
    mitre: 'T1068 (Exploitation for Privilege Escalation)',
    cwe: 'CWE-403 (Exposure of File Descriptor)',
    first_seen: '2024-01-31',
    exploit_available: true
  },
  {
    cve_id: 'CVE-2023-4863',
    title: 'libwebp Heap Buffer Overflow Code Execution',
    asset_id: 'ASSET-003',
    asset_name: 'Payment API Gateway',
    cvss: 8.8,
    epss: 0.72,
    exposure: 'External API',
    cisa_kev: true,
    ai_risk: 0.82,
    ai_label: 'HIGH',
    mitre: 'T1190 (Exploit Public-Facing Application)',
    cwe: 'CWE-122 (Heap-based Buffer Overflow)',
    first_seen: '2023-09-12',
    exploit_available: true
  },
  {
    cve_id: 'CVE-2023-23397',
    title: 'Microsoft Outlook NTLM Credential Theft & Relay',
    asset_id: 'ASSET-004',
    asset_name: 'Enterprise Active Directory Domain Controller',
    cvss: 9.8,
    epss: 0.91,
    exposure: 'Internal Network',
    cisa_kev: true,
    ai_risk: 0.76,
    ai_label: 'HIGH',
    mitre: 'T1187 (Forced Authentication / NTLM Relay)',
    cwe: 'CWE-290 (Authentication Bypass by Spoofing)',
    first_seen: '2023-03-14',
    exploit_available: true
  },
  {
    cve_id: 'CVE-2023-38606',
    title: 'Apple WebKit & Kernel Privilege Escalation (Operation Triangulation)',
    asset_id: 'ASSET-005',
    asset_name: 'Executive Mobile Management Fleet',
    cvss: 7.8,
    epss: 0.64,
    exposure: 'Mobile Fleet',
    cisa_kev: false,
    ai_risk: 0.58,
    ai_label: 'MEDIUM',
    mitre: 'T1068 (Privilege Escalation)',
    cwe: 'CWE-20 (Improper Input Validation)',
    first_seen: '2023-07-24',
    exploit_available: false
  }
];

export default function DetectView({ vulnerabilities = [], assets = [], incidents = [], controls = [] }) {
  const [activeSubTab, setActiveSubTab] = useState('active_queue'); // 'active_queue', 'threat_feed', 'asset_exposure', 'incidents'
  const [selectedInvestigation, setSelectedInvestigation] = useState(null);
  const [escalatedCves, setEscalatedCves] = useState({});
  const [escalationNotice, setEscalationNotice] = useState(null);

  const handleEscalate = (cveId) => {
    setEscalatedCves(prev => ({ ...prev, [cveId]: true }));
    setEscalationNotice(`Threat ${cveId} has been escalated to Security Lead for Control Optimization & Remediation!`);
    setTimeout(() => setEscalationNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Escalation Notification */}
      {escalationNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{escalationNotice}</span>
          </div>
          <button onClick={() => setEscalationNotice(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP METRICS: 4 OPERATIONAL SOC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cyber-card border-l-4 border-l-red-500">
          <p className="text-slate-600 text-xs font-semibold">Active Critical CVEs</p>
          <div className="flex justify-between items-baseline mt-1">
            <h3 className="text-2xl font-extrabold text-red-600">12</h3>
            <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">Action Required</span>
          </div>
        </div>

        <div className="cyber-card border-l-4 border-l-sky-500">
          <p className="text-slate-600 text-xs font-semibold">Internet-Facing Assets</p>
          <div className="flex justify-between items-baseline mt-1">
            <h3 className="text-2xl font-extrabold text-sky-700">4</h3>
            <span className="text-[10px] text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded">High Exposure</span>
          </div>
        </div>

        <div className="cyber-card border-l-4 border-l-amber-500">
          <p className="text-slate-600 text-xs font-semibold">CISA KEV Exploits</p>
          <div className="flex justify-between items-baseline mt-1">
            <h3 className="text-2xl font-extrabold text-amber-600">3</h3>
            <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">Active in Wild</span>
          </div>
        </div>

        <div className="cyber-card border-l-4 border-l-blue-600">
          <p className="text-slate-600 text-xs font-semibold">Pending Triage</p>
          <div className="flex justify-between items-baseline mt-1">
            <h3 className="text-2xl font-extrabold text-blue-700">5</h3>
            <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">Awaiting Review</span>
          </div>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveSubTab('active_queue')}
          className={`px-4 py-2.5 rounded-t-lg font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'active_queue'
              ? 'bg-white text-blue-700 border-t border-x border-slate-200 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-red-500" />
          Triage Queue
        </button>

        <button
          onClick={() => setActiveSubTab('threat_feed')}
          className={`px-4 py-2.5 rounded-t-lg font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'threat_feed'
              ? 'bg-white text-blue-700 border-t border-x border-slate-200 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Globe className="w-4 h-4 text-blue-600" />
          Threat Intelligence
        </button>

        <button
          onClick={() => setActiveSubTab('asset_exposure')}
          className={`px-4 py-2.5 rounded-t-lg font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'asset_exposure'
              ? 'bg-white text-blue-700 border-t border-x border-slate-200 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Server className="w-4 h-4 text-slate-600" />
          Asset Exposure
        </button>

        <button
          onClick={() => setActiveSubTab('incidents')}
          className={`px-4 py-2.5 rounded-t-lg font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'incidents'
              ? 'bg-white text-blue-700 border-t border-x border-slate-200 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-slate-600" />
          Incident Log
        </button>
      </div>

      {/* SUBTAB 1: ACTIVE VULNERABILITY TRIAGE QUEUE */}
      {activeSubTab === 'active_queue' && (
        <div className="cyber-card space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Active Critical Vulnerabilities
            </h3>
            <span className="cyber-badge text-[10px]">Realtime Correlated Feed</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
                  <th className="py-2.5 px-3 font-semibold">CVE Identifier</th>
                  <th className="py-2.5 px-3 font-semibold">Target Asset</th>
                  <th className="py-2.5 px-3 font-semibold">CVSS</th>
                  <th className="py-2.5 px-3 font-semibold">EPSS</th>
                  <th className="py-2.5 px-3 font-semibold">Exposure</th>
                  <th className="py-2.5 px-3 font-semibold">CISA KEV</th>
                  <th className="py-2.5 px-3 font-semibold">AI Exploit Risk</th>
                  <th className="py-2.5 px-3 font-semibold text-right">SOC Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockSocVulnerabilities.map((vuln) => (
                  <tr key={vuln.cve_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">
                      <div>{vuln.cve_id}</div>
                      <span className="text-[10px] text-slate-500 font-sans block truncate max-w-[180px]">{vuln.title}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{vuln.asset_name}</div>
                      <span className="text-[10px] font-mono text-slate-500">{vuln.asset_id}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-bold font-mono ${vuln.cvss >= 9.0 ? 'text-red-600' : 'text-amber-600'}`}>
                        {vuln.cvss.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {(vuln.epss * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        vuln.exposure === 'Internet-Facing'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {vuln.exposure}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {vuln.cisa_kev ? (
                        <span className="cyber-badge-peach text-[10px]">Active KEV</span>
                      ) : (
                        <span className="text-[10px] text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold font-mono text-xs ${
                          vuln.ai_risk >= 0.85 ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {(vuln.ai_risk * 100).toFixed(0)}%
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          vuln.ai_risk >= 0.85 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {vuln.ai_label}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedInvestigation(vuln)}
                        className="cyber-button-secondary text-[11px] py-1 px-2.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        Investigate (Why?)
                      </button>

                      <button
                        onClick={() => handleEscalate(vuln.cve_id)}
                        disabled={escalatedCves[vuln.cve_id]}
                        className={`text-[11px] py-1 px-2.5 rounded-lg font-bold border transition-colors inline-flex items-center gap-1 cursor-pointer ${
                          escalatedCves[vuln.cve_id]
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                        }`}
                      >
                        {escalatedCves[vuln.cve_id] ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Escalated
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            Escalate
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: THREAT INTELLIGENCE FEED */}
      {activeSubTab === 'threat_feed' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mockSocVulnerabilities.map((v) => (
            <div key={v.cve_id} className="cyber-card space-y-3 border-l-4 border-l-blue-600">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-700">{v.cve_id}</span>
                  <h3 className="font-bold text-slate-900 text-sm mt-0.5">{v.title}</h3>
                </div>
                {v.cisa_kev && <span className="cyber-badge-peach text-[10px]">CISA KEV</span>}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[10px] block uppercase">NVD CVSS v3.1</span>
                  <span className="font-bold text-red-600">{v.cvss} / 10.0</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[10px] block uppercase">FIRST EPSS Velocity</span>
                  <span className="font-bold text-blue-700">{(v.epss * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">ATT&CK Technique:</span>
                  <span className="font-mono text-slate-800 text-[11px] truncate max-w-[180px]">{v.mitre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">CWE Classification:</span>
                  <span className="font-mono text-slate-800">{v.cwe}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Public Exploit:</span>
                  <span className={`font-semibold ${v.exploit_available ? 'text-red-600' : 'text-emerald-600'}`}>
                    {v.exploit_available ? 'Exploit Available in Wild' : 'No Public Exploit'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedInvestigation(v)}
                className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 transition-colors flex items-center justify-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                View AI Risk Factors (Why?)
              </button>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 3: ASSET EXPOSURE SURFACE MAP */}
      {activeSubTab === 'asset_exposure' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {assets.map((asset) => (
            <div key={asset.id} className="cyber-card space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono text-blue-700 font-bold">{asset.id}</span>
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5">{asset.name}</h4>
                </div>
                <span className="cyber-badge">{asset.asset_type}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase block">Criticality</span>
                  <span className="font-bold text-blue-700 text-sm">{asset.criticality_score} / 10.0</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase block">Remediation SLA</span>
                  <span className="font-bold text-slate-800 text-sm">{asset.sla_hours} hrs</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700 border-t border-slate-100 pt-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">IP Address:</span>
                  <span className="font-mono text-slate-800">{asset.ip_address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Exposure Surface:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    asset.exposure_level === 'INTERNET_FACING'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {asset.exposure_level}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 4: INCIDENT HISTORY */}
      {activeSubTab === 'incidents' && (
        <div className="cyber-card space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Historical Enterprise Security Incidents & Root Causes</h3>
          <div className="space-y-3">
            {incidents.map((inc) => (
              <div key={inc.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-800 text-sm">{inc.incident_name}</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Target: <span className="font-mono font-bold text-blue-700">{inc.asset_id}</span> &bull; Attack Vector: {inc.incident_type}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-red-600 block">₹{(inc.loss_incurred / 100000).toFixed(2)} Lakhs Breach Cost</span>
                  <span className="text-[10px] text-slate-500">{inc.date_occurred}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* "WHY?" AI RISK INVESTIGATION MODAL */}
      {selectedInvestigation && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <span className="cyber-badge text-[10px] mb-1">SOC Threat Investigation</span>
                <h3 className="text-base font-bold text-slate-900">
                  AI Risk Assessment: Why is {selectedInvestigation.cve_id} flagged?
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvestigation(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-red-50/70 border border-red-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-red-700 font-bold uppercase">AI Exploitation Probability</span>
                <h4 className="text-2xl font-extrabold text-red-600">{(selectedInvestigation.ai_risk * 100).toFixed(0)}% ({selectedInvestigation.ai_label} RISK)</h4>
                <p className="text-[11px] text-slate-600 mt-0.5">Target: {selectedInvestigation.asset_name}</p>
              </div>
              <div className="text-right">
                <span className="cyber-badge-peach text-[10px]">CISA KEV Verified</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <h5 className="font-bold text-slate-900 text-xs">Primary Contributing Risk Signals:</h5>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div>
                  <strong className="text-slate-900">CVSS v3.1 Severity ({selectedInvestigation.cvss} / 10.0):</strong>
                  <p className="text-[11px] text-slate-600">Unauthenticated remote code execution with low attack complexity and no user interaction.</p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <div>
                  <strong className="text-slate-900">High Threat Velocity (EPSS {(selectedInvestigation.epss * 100).toFixed(1)}%):</strong>
                  <p className="text-[11px] text-slate-600">FIRST EPSS model indicates high statistical probability of weaponization in the next 30 days.</p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div>
                  <strong className="text-slate-900">Asset Exposure Surface ({selectedInvestigation.exposure}):</strong>
                  <p className="text-[11px] text-slate-600">Directly exposed across perimeter boundary, drastically amplifying exploit feasibility.</p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                <div>
                  <strong className="text-slate-900">MITRE ATT&CK Technique:</strong>
                  <p className="text-[11px] text-slate-600 font-mono">{selectedInvestigation.mitre}</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => setSelectedInvestigation(null)}
                className="cyber-button-secondary text-xs"
              >
                Close Investigation
              </button>

              <button
                onClick={() => {
                  handleEscalate(selectedInvestigation.cve_id);
                  setSelectedInvestigation(null);
                }}
                className="cyber-button text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Escalate to Security Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

