import React, { useState } from 'react';
import { Lock, ShieldCheck, CheckCircle2, AlertOctagon, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

export default function AuditView({ auditBlocks, onRefresh }) {
  const [verifyResult, setVerifyResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerifyLedger = async () => {
    setLoading(true);
    try {
      const res = await api.verifyAuditLedger();
      setVerifyResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Lock className="w-6 h-6 text-emerald-400" />
            Permissioned Blockchain Audit Ledger
          </h2>
          <p className="text-slate-400 text-xs mt-1">Immutable SHA-256 block-chained decision records for CISO approvals & IT remediation steps</p>
        </div>
        <button onClick={handleVerifyLedger} disabled={loading} className="cyber-button">
          <ShieldCheck className="w-4 h-4" />
          {loading ? 'Verifying Hashes...' : 'Verify Ledger Cryptographic Integrity'}
        </button>
      </div>

      {verifyResult && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${verifyResult.is_valid ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-red-950/40 border-red-800 text-red-300'}`}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-bold">{verifyResult.message}</p>
            <p className="text-[11px] opacity-80 mt-0.5">{verifyResult.algorithm} | {verifyResult.total_blocks_checked} Blocks Anchored</p>
          </div>
        </div>
      )}

      {/* Block Explorer List */}
      <div className="space-y-4">
        {auditBlocks.map((block) => (
          <div key={block.id} className="cyber-card space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="cyber-badge bg-cyan-950 text-cyan-400 border border-cyan-800">Block #{block.block_index}</span>
                <span className="text-slate-200 font-bold">{block.action}</span>
              </div>
              <span className="text-slate-400 text-[10px]">{block.timestamp}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Authorized User:</span>
                <span className="text-slate-300">{block.user_id}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Previous Block Hash:</span>
                <span className="text-slate-400 truncate block">{block.previous_hash}</span>
              </div>
            </div>

            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Current SHA-256 Block Hash:</span>
              <span className="text-cyan-400 font-bold break-all">{block.block_hash}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
