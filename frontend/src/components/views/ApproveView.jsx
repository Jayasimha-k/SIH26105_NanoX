import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function ApproveView({ recommendations, currentRole, onRefresh }) {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            Executive Approval Center
          </h2>
        </div>
        <span className="cyber-badge">
          Role: {currentRole}
        </span>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Pending Approval Queue ({pendingRecs.length})</h3>

        {pendingRecs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200">
            No pending recommendations waiting for approval.
          </div>
        ) : (
          pendingRecs.map((rec) => (
            <div key={rec.id} className="cyber-card space-y-4 border-l-4 border-l-blue-600">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-700">{rec.id}</span>
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5">{rec.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{rec.description}</p>
                </div>

                <div className="flex items-center gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Cost</span>
                    <span className="font-bold text-slate-800 text-xs">₹{(rec.cost/100000).toFixed(1)}L</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Risk Reduction</span>
                    <span className="font-bold text-emerald-600 text-xs">₹{(rec.expected_risk_reduction/100000).toFixed(1)}L</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">ROSI</span>
                    <span className="font-bold text-blue-700 text-xs">+{rec.rosi}%</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 pt-3 border-t border-slate-100">
                <input
                  type="text"
                  placeholder="Enter executive approval notes or justification..."
                  value={comments[rec.id] || ''}
                  onChange={(e) => setComments({ ...comments, [rec.id]: e.target.value })}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                />

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(rec.id, 'APPROVED')}
                    disabled={processingId === rec.id || (currentRole !== 'CISO' && currentRole !== 'Security')}
                    className="cyber-button text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleAction(rec.id, 'REJECTED')}
                    disabled={processingId === rec.id || (currentRole !== 'CISO' && currentRole !== 'Security')}
                    className="cyber-button-secondary text-xs text-red-600 hover:text-red-700"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
