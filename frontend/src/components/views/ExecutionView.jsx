import React, { useState } from 'react';
import { Wrench, CheckCircle, RefreshCcw, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

export default function ExecutionView({ recommendations, currentRole, onRefresh }) {
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

  const handleVerify = async (id) => {
    setLoadingId(id);
    try {
      await api.verifyExecution(id);
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
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-purple-400" />
            IT Remediation & Implementation Tracking
          </h2>
          <p className="text-slate-400 text-xs mt-1">Execute approved security controls & verify post-implementation risk recalculation</p>
        </div>
        <span className={`cyber-badge ${currentRole === 'IT' ? 'bg-purple-950 text-purple-400 border border-purple-800' : 'bg-slate-800 text-slate-300'}`}>
          Role: {currentRole}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {recommendations.map((rec) => (
          <div key={rec.id} className="cyber-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-purple-400">{rec.id}</span>
                <span className="cyber-badge bg-slate-800 text-slate-300">{rec.status}</span>
              </div>
              <h3 className="font-bold text-slate-100 text-sm mt-0.5">{rec.title}</h3>
              <p className="text-xs text-slate-400">{rec.description}</p>
            </div>

            <div className="flex items-center gap-3">
              {rec.status === 'APPROVED' && (
                <button
                  onClick={() => handleExecute(rec.id)}
                  disabled={loadingId === rec.id}
                  className="cyber-button text-xs"
                >
                  <Wrench className="w-3.5 h-3.5" /> Mark Executed
                </button>
              )}

              {rec.status === 'EXECUTED' && (
                <button
                  onClick={() => handleVerify(rec.id)}
                  disabled={loadingId === rec.id}
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Verify & Recalculate Risk
                </button>
              )}

              {rec.status === 'VERIFIED' && (
                <span className="cyber-badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <ShieldCheck className="w-4 h-4" /> Verified Clean
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
