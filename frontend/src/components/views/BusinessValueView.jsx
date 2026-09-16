import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, BookOpen } from 'lucide-react';
import { api } from '../../services/api';

export default function BusinessValueView() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getFrameworkCompliance().then(setData).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <span className="cyber-badge mb-1">Executive Alignment</span>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-blue-600" />
            Impact & Benefits: Executive Business Value Realized
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Connects security decisions with business value | Aligns CISO & CFO with data-driven insights | Mapped to NIST CSF, ISO 27001, CIS Controls & FAIR
          </p>
        </div>
        <span className="cyber-badge font-semibold">CISO-CFO Trust Engine</span>
      </div>

      {/* CISO-CFO Value Pillar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="cyber-card border-l-4 border-l-blue-600 space-y-1">
          <span className="text-blue-600 text-[10px] uppercase font-bold">Evidence-Based Decisions</span>
          <p className="text-xs text-slate-800 font-semibold mt-1">Aligns security spending with actual financial loss exposure</p>
        </div>
        <div className="cyber-card border-l-4 border-l-sky-500 space-y-1">
          <span className="text-sky-600 text-[10px] uppercase font-bold">Stronger Cyber Resilience</span>
          <p className="text-xs text-slate-800 font-semibold mt-1">Reduces overall enterprise breach impact and ransomware loss</p>
        </div>
        <div className="cyber-card border-l-4 border-l-indigo-600 space-y-1">
          <span className="text-indigo-600 text-[10px] uppercase font-bold">Better CISO-CFO Alignment</span>
          <p className="text-xs text-slate-800 font-semibold mt-1">Translates vulnerability alerts into clear monetary ROI metrics</p>
        </div>
        <div className="cyber-card border-l-4 border-l-emerald-600 space-y-1">
          <span className="text-emerald-600 text-[10px] uppercase font-bold">Audit & Compliance Readiness</span>
          <p className="text-xs text-slate-800 font-semibold mt-1">Provides cryptographic blockchain audit trail for regulators</p>
        </div>
      </div>

      {/* Standards & Framework Compliance Table */}
      <div className="cyber-card space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          Mapped International Standards & Framework Compliance
        </h3>

        <div className="space-y-3">
          {data?.standards?.map((s, i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-blue-300 transition-colors">
              <div>
                <span className="font-bold text-slate-800 text-sm">{s.framework}</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {s.functions_covered.map((fc, j) => (
                    <span key={j} className="cyber-badge text-[10px]">{fc}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-blue-700">{s.compliance_score}% Aligned</span>
                <span className="cyber-badge border border-emerald-300 text-emerald-700 bg-emerald-50">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
