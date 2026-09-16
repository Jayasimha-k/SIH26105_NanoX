import React, { useState } from 'react';
import { Database, ShieldAlert, Server, Activity, FileText, Globe, Layers } from 'lucide-react';

export default function DetectView({ vulnerabilities, assets, incidents, controls }) {
  const [activeSubTab, setActiveSubTab] = useState('vulnerabilities');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <span className="cyber-badge mb-1">Threat Intelligence Ingestion</span>
          <h2 className="text-xl font-bold text-[#E9BCB9] flex items-center gap-2">
            <Database className="w-6 h-6 text-[#ED9E5B]" />
            Threat Intelligence & Enterprise Asset Data Hub
          </h2>
          <p className="text-[#E9BCB9]/70 text-xs mt-1">
            Real-time synchronization of public threat intelligence (NVD, EPSS, CISA KEV, MITRE ATT&CK) & Organization-specific IT/OT/Cloud assets and incidents
          </p>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex items-center gap-2 border-b border-[#44174E] pb-3 text-xs">
        <button
          onClick={() => setActiveSubTab('vulnerabilities')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeSubTab === 'vulnerabilities' ? 'bg-[#A34054] text-[#E9BCB9] border border-[#ED9E5B]/50' : 'bg-[#0D0B18] text-[#E9BCB9]/70 hover:bg-[#1C1830]'}`}
        >
          Public Threat Intelligence (NVD, EPSS, KEV, ATT&CK)
        </button>
        <button
          onClick={() => setActiveSubTab('assets')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeSubTab === 'assets' ? 'bg-[#A34054] text-[#E9BCB9] border border-[#ED9E5B]/50' : 'bg-[#0D0B18] text-[#E9BCB9]/70 hover:bg-[#1C1830]'}`}
        >
          Enterprise Asset Inventory (IT/OT/Cloud)
        </button>
        <button
          onClick={() => setActiveSubTab('incidents')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeSubTab === 'incidents' ? 'bg-[#A34054] text-[#E9BCB9] border border-[#ED9E5B]/50' : 'bg-[#0D0B18] text-[#E9BCB9]/70 hover:bg-[#1C1830]'}`}
        >
          Incident History & Loss Log
        </button>
      </div>

      {/* Subtab 1: Public Vulnerability Datasets */}
      {activeSubTab === 'vulnerabilities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vulnerabilities.map((v) => (
            <div key={v.id} className="cyber-card space-y-3 border-l-4 border-l-[#A34054]">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono font-bold text-[#ED9E5B]">{v.cve_id}</span>
                  <h3 className="font-bold text-[#E9BCB9] text-sm mt-0.5">{v.title}</h3>
                </div>
                {v.cisa_kev ? (
                  <span className="cyber-badge-peach">CISA KEV Active</span>
                ) : (
                  <span className="cyber-badge text-[#E9BCB9]/70">Standard</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#0D0B18] p-2 rounded border border-[#44174E]">
                  <span className="text-[#E9BCB9]/70 text-[10px] block uppercase">NVD CVSS v3.1</span>
                  <span className="font-bold text-[#ED9E5B]">{v.cvss_score} / 10.0</span>
                </div>
                <div className="bg-[#0D0B18] p-2 rounded border border-[#44174E]">
                  <span className="text-[#E9BCB9]/70 text-[10px] block uppercase">FIRST EPSS Score</span>
                  <span className="font-bold text-[#E9BCB9]">{(v.epss_score * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-[#E9BCB9] pt-2 border-t border-[#44174E]">
                <div className="flex justify-between">
                  <span className="text-[#E9BCB9]/70">MITRE ATT&CK:</span>
                  <span className="font-mono text-[#E9BCB9] text-[11px]">{v.mitre_attack_technique} ({v.mitre_attack_name})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#E9BCB9]/70">CWE Classification:</span>
                  <span className="font-mono text-[#E9BCB9]">{v.cwe_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#E9BCB9]/70">Base Breach Impact:</span>
                  <span className="font-semibold text-[#ED9E5B]">₹{(v.financial_impact_base / 100000).toFixed(1)} Lakhs</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subtab 2: Asset Inventory */}
      {activeSubTab === 'assets' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {assets.map((asset) => (
            <div key={asset.id} className="cyber-card space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono text-[#ED9E5B]">{asset.id}</span>
                  <h3 className="font-bold text-[#E9BCB9] text-sm mt-0.5">{asset.name}</h3>
                </div>
                <span className="cyber-badge">{asset.asset_type}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#0D0B18] p-2.5 rounded border border-[#44174E]">
                  <span className="text-[#E9BCB9]/70 text-[10px] uppercase block">Criticality Rating</span>
                  <span className="font-bold text-[#ED9E5B] text-sm">{asset.criticality_score} / 10.0</span>
                </div>
                <div className="bg-[#0D0B18] p-2.5 rounded border border-[#44174E]">
                  <span className="text-[#E9BCB9]/70 text-[10px] uppercase block">Asset Financial Value</span>
                  <span className="font-bold text-[#E9BCB9] text-sm">₹{(asset.financial_value / 100000).toFixed(1)} Lakhs</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-[#E9BCB9] border-t border-[#44174E] pt-3">
                <div className="flex justify-between">
                  <span className="text-[#E9BCB9]/70">IP Address:</span>
                  <span className="font-mono text-[#E9BCB9]">{asset.ip_address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#E9BCB9]/70">Exposure Level:</span>
                  <span className={`cyber-badge text-[10px] ${asset.exposure_level === 'INTERNET_FACING' ? 'border-[#ED9E5B]/60 text-[#ED9E5B]' : 'text-[#E9BCB9]'}`}>
                    {asset.exposure_level}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#E9BCB9]/70">Remediation SLA:</span>
                  <span className="font-mono text-[#E9BCB9]">{asset.sla_hours} hours</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subtab 3: Incident History */}
      {activeSubTab === 'incidents' && (
        <div className="cyber-card space-y-4">
          <h3 className="font-bold text-[#E9BCB9] text-sm">Past Enterprise Security Incident Logs</h3>
          <div className="space-y-3">
            {incidents.map((inc) => (
              <div key={inc.id} className="p-3 bg-[#0D0B18] rounded-lg border border-[#44174E] flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-[#E9BCB9]">{inc.incident_name}</span>
                  <p className="text-[11px] text-[#E9BCB9]/70">Target Asset: {inc.asset_id} | Category: {inc.incident_type}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#ED9E5B] block">₹{(inc.loss_incurred / 100000).toFixed(2)} Lakhs Loss</span>
                  <span className="text-[10px] text-[#E9BCB9]/70">{inc.date_occurred}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
