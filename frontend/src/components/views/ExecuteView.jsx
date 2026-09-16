import React, { useState } from 'react';
import { Wrench, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

export default function ExecuteView({ recommendations, currentRole, onRefresh }) {
  const [loadingId, setLoadingId] = useState(null);

  const handleExecute = async (id) => {
    setLoadingId(id);
    try {
      await api.markExecuted(id);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <span className="cyber-badge mb-1">Remediation Tracking</span>
          <h2 className="text-xl font-bold text-[#E9BCB9] flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[#ED9E5B]" />
            Security Control Implementation & Deployment
          </h2>
          <p className="text-[#E9BCB9]/70 text-xs mt-1">
            IT & Remediation teams deploy approved security controls into enterprise production environments
          </p>
        </div>
        <span className="cyber-badge">
          Role: {currentRole}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {recommendations.map((rec) => (
          <div key={rec.id} className="cyber-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#ED9E5B]">{rec.id}</span>
                <span className="cyber-badge text-[#E9BCB9]">{rec.status}</span>
              </div>
              <h3 className="font-bold text-[#E9BCB9] text-sm mt-0.5">{rec.title}</h3>
              <p className="text-xs text-[#E9BCB9]/70">{rec.description}</p>
            </div>

            <div className="flex items-center gap-3">
              {rec.status === 'APPROVED' && (
                <button
                  onClick={() => handleExecute(rec.id)}
                  disabled={loadingId === rec.id}
                  className="cyber-button text-xs"
                >
                  <Wrench className="w-3.5 h-3.5" /> Execute Control
                </button>
              )}

              {rec.status === 'EXECUTED' && (
                <span className="cyber-badge-peach text-[11px]">
                  Deployed (Pending Verification)
                </span>
              )}

              {rec.status === 'VERIFIED' && (
                <span className="cyber-badge border border-[#A34054] text-[#E9BCB9]">
                  <ShieldCheck className="w-4 h-4 text-[#ED9E5B]" /> Fully Implemented
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
