import React, { useState } from 'react';
import { RefreshCcw, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

export default function VerifyRecalculateView({ recommendations, onRefresh }) {
  const [loadingId, setLoadingId] = useState(null);

  const handleVerifyAndRecalculate = async (id) => {
    setLoadingId(id);
    try {
      await api.triggerRecalculation(id);
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
          <span className="cyber-badge mb-1">Continuous Learning Loop</span>
          <h2 className="text-xl font-bold text-[#E9BCB9] flex items-center gap-2">
            <RefreshCcw className="w-6 h-6 text-[#ED9E5B]" />
            Impact Verification & Risk Recalculation
          </h2>
          <p className="text-[#E9BCB9]/70 text-xs mt-1">
            Measure real post-implementation impact & continuously update organization risk models with feedback data (incidents, environment changes)
          </p>
        </div>
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

            <div>
              {rec.status === 'EXECUTED' && (
                <button
                  onClick={() => handleVerifyAndRecalculate(rec.id)}
                  disabled={loadingId === rec.id}
                  className="cyber-button text-xs"
                >
                  <RefreshCcw className={`w-3.5 h-3.5 ${loadingId === rec.id ? 'animate-spin' : ''}`} />
                  Verify Impact & Recalculate EAL
                </button>
              )}

              {rec.status === 'VERIFIED' && (
                <span className="cyber-badge border border-[#A34054] text-[#E9BCB9]">
                  <ShieldCheck className="w-4 h-4 text-[#ED9E5B]" /> Recalculated & Verified
                </span>
              )}

              {rec.status === 'PENDING' && (
                <span className="text-xs text-[#E9BCB9]/70 italic">Awaiting Approval & Execution</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
