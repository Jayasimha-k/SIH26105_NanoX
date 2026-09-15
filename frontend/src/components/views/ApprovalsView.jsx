import React, { useState } from 'react';
import { CheckCircle2, XCircle, ShieldCheck, Lock, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';

export default function ApprovalsView({ recommendations, currentRole, onRefresh }) {
  const [comments, setComments] = useState({});
  const [processingId, setProcessingId] = useState(null);

  const handleAction = async (recId, action) => {
    setProcessingId(recId);
    try {
      await api.approveRecommendation(recId, action, comments[recId] || '');
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingRecs = recommendations.filter(r => r.status === 'PENDING');
  const processedRecs = recommendations.filter(r => r.status !== 'PENDING');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            CISO Human-in-the-Loop Approval Center
          </h2>
          <p className="text-slate-400 text-xs mt-1">Review investment recommendations & align security strategy | Anchored to Blockchain Audit Ledger</p>
        </div>
        <span className={`cyber-badge ${currentRole === 'CISO' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
          Role: {currentRole} {currentRole !== 'CISO' && '(Read-Only Mode)'}
        </span>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-200 text-sm">Pending Approval Queue ({pendingRecs.length})</h3>

        {pendingRecs.map((rec) => (
          <div key={rec.id} className="cyber-card space-y-4 border-l-4 border-l-amber-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="font-mono text-xs font-bold text-cyan-400">{rec.id}</span>
                <h4 className="font-bold text-slate-100 text-sm mt-0.5">{rec.title}</h4>
                <p className="text-xs text-slate-400 mt-1">{rec.description}</p>
              </div>

              <div className="flex items-center gap-4 text-xs bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px]">Cost</span>
                  <span className="font-bold text-emerald-400 text-xs">₹{(rec.cost/100000).toFixed(1)}L</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Risk Reduction</span>
                  <span className="font-bold text-cyan-400 text-xs">₹{(rec.expected_risk_reduction/100000).toFixed(1)}L</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ROSI</span>
                  <span className="font-bold text-purple-400 text-xs">+{rec.rosi}%</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 pt-3 border-t border-slate-800">
              <input
                type="text"
                placeholder="Enter approval note or executive justification..."
                value={comments[rec.id] || ''}
                onChange={(e) => setComments({ ...comments, [rec.id]: e.target.value })}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAction(rec.id, 'APPROVED')}
                  disabled={processingId === rec.id || currentRole !== 'CISO'}
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all disabled:opacity-40"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </button>
                <button
                  onClick={() => handleAction(rec.id, 'REJECTED')}
                  disabled={processingId === rec.id || currentRole !== 'CISO'}
                  className="bg-red-950 hover:bg-red-900 text-red-400 border border-red-800 font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all disabled:opacity-40"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
