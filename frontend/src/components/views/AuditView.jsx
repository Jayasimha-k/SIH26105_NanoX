import React, { useState } from 'react';
import { Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
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
          <span className="cyber-badge mb-1">Hyperledger Fabric Model</span>
          <h2 className="text-xl font-bold text-[#E9BCB9] flex items-center gap-2">
            <Lock className="w-6 h-6 text-[#ED9E5B]" />
            Permissioned Blockchain Audit Ledger
          </h2>
          <p className="text-[#E9BCB9]/70 text-xs mt-1">Immutable SHA-256 block-chained decision records for CISO approvals & IT remediation steps</p>
        </div>
        <button onClick={handleVerifyLedger} disabled={loading} className="cyber-button">
          <ShieldCheck className="w-4 h-4" />
          {loading ? 'Verifying Hashes...' : 'Verify Ledger Cryptographic Integrity'}
        </button>
      </div>

      {verifyResult && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${verifyResult.is_valid ? 'bg-[#0D0B18] border-[#A34054] text-[#E9BCB9]' : 'bg-[#0D0B18] border-[#ED9E5B] text-[#ED9E5B]'}`}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#ED9E5B]" />
          <div>
            <p className="font-bold text-[#E9BCB9]">{verifyResult.message}</p>
            <p className="text-[11px] opacity-80 mt-0.5">{verifyResult.algorithm} | {verifyResult.total_blocks_checked} Blocks Anchored</p>
          </div>
        </div>
      )}

      {/* Block Explorer List */}
      <div className="space-y-4">
        {auditBlocks.map((block) => (
          <div key={block.id} className="cyber-card space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-[#44174E] pb-2">
              <div className="flex items-center gap-2">
                <span className="cyber-badge">Block #{block.block_index}</span>
                <span className="text-[#E9BCB9] font-bold">{block.action}</span>
              </div>
              <span className="text-[#E9BCB9]/70 text-[10px]">{block.timestamp}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[#E9BCB9]/70 block">Authorized User:</span>
                <span className="text-[#E9BCB9]">{block.user_id}</span>
              </div>
              <div>
                <span className="text-[#E9BCB9]/70 block">Previous Block Hash:</span>
                <span className="text-[#E9BCB9]/80 truncate block">{block.previous_hash}</span>
              </div>
            </div>

            <div className="bg-[#0D0B18] p-2.5 rounded border border-[#44174E]">
              <span className="text-[#E9BCB9]/70 block text-[10px] uppercase font-sans">Current SHA-256 Block Hash:</span>
              <span className="text-[#ED9E5B] font-bold break-all">{block.block_hash}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
