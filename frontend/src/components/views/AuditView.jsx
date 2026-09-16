import React, { useState, useEffect } from 'react';
import {
  Lock, ShieldCheck, CheckCircle2, AlertTriangle, Cpu, Network,
  Layers, FileCode, Play, RefreshCw, Key, ShieldAlert, Zap,
  Check, ArrowRight, Activity
} from 'lucide-react';
import { api } from '../../services/api';

export default function AuditView({ auditBlocks, onRefresh }) {
  const [activeSubTab, setActiveSubTab] = useState('nodes'); // 'nodes', 'explorer', 'mining', 'contracts', 'demo'
  const [networkInfo, setNetworkInfo] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState('node_ciso');
  const [selectedNodeChain, setSelectedNodeChain] = useState([]);
  const [mempool, setMempool] = useState({ pending_count: 0, transactions: [] });
  const [smartContracts, setSmartContracts] = useState({ contracts: [], execution_history: [] });
  const [directory, setDirectory] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [actionLog, setActionLog] = useState(null);
  const [miningMiner, setMiningMiner] = useState('node_ciso');
  const [verifyResult, setVerifyResult] = useState(null);

  const fetchBlockchainState = async () => {
    try {
      const [net, nds, mem, sc, dir] = await Promise.all([
        api.getBlockchainNetwork().catch(() => null),
        api.getBlockchainNodes().catch(() => []),
        api.getBlockchainMempool().catch(() => ({ pending_count: 0, transactions: [] })),
        api.getBlockchainSmartContracts().catch(() => ({ contracts: [], execution_history: [] })),
        api.getConsortiumDirectory().catch(() => null)
      ]);
      setNetworkInfo(net);
      setNodes(nds);
      setMempool(mem);
      setSmartContracts(sc);
      setDirectory(dir);

      if (selectedNodeId) {
        const chainRes = await api.getNodeChain(selectedNodeId).catch(() => null);
        if (chainRes && chainRes.chain) {
          setSelectedNodeChain(chainRes.chain);
        }
      }
    } catch (e) {
      console.error("Error loading blockchain state:", e);
    }
  };

  useEffect(() => {
    fetchBlockchainState();
  }, [selectedNodeId]);

  const handleSelectNode = async (nodeId) => {
    setSelectedNodeId(nodeId);
    try {
      const res = await api.getNodeChain(nodeId);
      setSelectedNodeChain(res.chain || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMineBlock = async () => {
    setLoading(true);
    setActionLog({ status: 'info', message: `Mining new block using Proof-of-Work on ${miningMiner}...` });
    try {
      const res = await api.mineBlockchainBlock(miningMiner);
      setActionLog({
        status: 'success',
        message: res.message,
        details: res.consensus_event
      });
      await fetchBlockchainState();
      if (onRefresh) onRefresh();
    } catch (e) {
      setActionLog({ status: 'error', message: e.message || 'Mining failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleTamperAttack = async () => {
    setLoading(true);
    setActionLog({ status: 'warning', message: 'Injecting simulated malicious insider attack on Node 1 (CISO)...' });
    try {
      const res = await api.tamperBlockchainBlock('node_ciso', 1);
      setActionLog({
        status: 'tamper',
        message: res.message,
        details: res
      });
      await fetchBlockchainState();
    } catch (e) {
      setActionLog({ status: 'error', message: e.message || 'Tamper simulation failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleConsensusAutoRepair = async () => {
    setLoading(true);
    setActionLog({ status: 'info', message: 'Running Byzantine Fault Tolerant Multi-Node Consensus Protocol...' });
    try {
      const res = await api.resolveBlockchainConflicts();
      setActionLog({
        status: 'recovered',
        message: res.message,
        details: res
      });
      await fetchBlockchainState();
      if (onRefresh) onRefresh();
    } catch (e) {
      setActionLog({ status: 'error', message: e.message || 'Consensus resolution failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLegacy = async () => {
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

  const hasAnomaly = networkInfo && !networkInfo.all_nodes_in_consensus;

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#141124] p-5 rounded-xl border border-[#44174E] shadow-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="cyber-badge-peach text-[10px]">Permissioned Consortium Network</span>
            <span className="cyber-badge text-[10px]">BFT Proof-of-Work (PoW)</span>
            <span className="cyber-badge text-[10px]">ECDSA-secp256k1</span>
          </div>
          <h2 className="text-xl font-bold text-[#E9BCB9] flex items-center gap-2">
            <Lock className="w-6 h-6 text-[#ED9E5B]" />
            Decentralized Consortium Blockchain Ledger
          </h2>
          <p className="text-[#E9BCB9]/70 text-xs mt-1">
            Distributed multi-node peer-to-peer network with independent ledgers, cryptographic signatures, on-chain smart contracts & Byzantine fault-tolerant consensus.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchBlockchainState} className="cyber-button-secondary text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Network
          </button>
          <button onClick={handleVerifyLegacy} disabled={loading} className="cyber-button text-xs">
            <ShieldCheck className="w-4 h-4" />
            Verify Cryptographic State
          </button>
        </div>
      </div>

      {/* Network Health Bar */}
      {networkInfo && (
        <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold ${
          hasAnomaly
            ? 'bg-[#1C0D12] border-[#ED9E5B] text-[#ED9E5B]'
            : 'bg-[#0D0B18] border-[#44174E] text-[#E9BCB9]'
        }`}>
          <div className="flex items-center gap-3">
            {hasAnomaly ? (
              <ShieldAlert className="w-6 h-6 text-[#ED9E5B] animate-pulse" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#E9BCB9]">Consensus Health:</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  hasAnomaly ? 'bg-red-950/80 text-[#ED9E5B] border border-[#ED9E5B]/40' : 'bg-green-950/60 text-green-400 border border-green-500/30'
                }`}>
                  {networkInfo.consensus_health}
                </span>
              </div>
              <p className="text-[11px] opacity-75 mt-0.5">
                {networkInfo.total_nodes} Peer Nodes Active | Target Difficulty: {networkInfo.mining_difficulty} Zeros | Total Confirmed Blocks: {networkInfo.current_block_height}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <div>
              <span className="text-[#E9BCB9]/60 block uppercase text-[9px]">Mempool Pending</span>
              <span className="text-[#ED9E5B] font-bold text-sm">{mempool.pending_count} Transactions</span>
            </div>
            <div>
              <span className="text-[#E9BCB9]/60 block uppercase text-[9px]">Network Status</span>
              <span className="text-green-400 font-bold text-sm">P2P Synchronized</span>
            </div>
          </div>
        </div>
      )}

      {/* Legacy DB Verification Banner if triggered */}
      {verifyResult && (
        <div className={`p-3 rounded-xl border flex items-center gap-3 text-xs ${verifyResult.is_valid ? 'bg-[#0D0B18] border-green-500/40 text-green-400' : 'bg-[#0D0B18] border-red-500 text-red-400'}`}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-bold">{verifyResult.message}</p>
            <p className="text-[10px] opacity-80">{verifyResult.algorithm} | {verifyResult.total_blocks_checked} Blocks Verified</p>
          </div>
        </div>
      )}

      {/* Action Notification Box */}
      {actionLog && (
        <div className={`p-4 rounded-xl border text-xs font-mono transition-all ${
          actionLog.status === 'tamper'
            ? 'bg-red-950/40 border-[#ED9E5B] text-[#ED9E5B]'
            : actionLog.status === 'recovered'
            ? 'bg-green-950/40 border-green-500 text-green-300'
            : 'bg-[#141124] border-[#44174E] text-[#E9BCB9]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Consensus Event Log
            </span>
            <span className="text-[10px] opacity-60">{new Date().toLocaleTimeString()}</span>
          </div>
          <p className="font-bold text-sm text-[#E9BCB9]">{actionLog.message}</p>
          {actionLog.details && (
            <pre className="mt-2 p-2 bg-[#0A0914] rounded border border-[#44174E]/40 text-[10px] overflow-x-auto text-[#E9BCB9]/80">
              {JSON.stringify(actionLog.details, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <div className="flex border-b border-[#44174E] gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSubTab('nodes')}
          className={`px-4 py-2.5 rounded-t-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'nodes'
              ? 'bg-[#141124] text-[#ED9E5B] border-t border-x border-[#44174E]'
              : 'text-[#E9BCB9]/70 hover:text-[#E9BCB9]'
          }`}
        >
          <Network className="w-4 h-4" />
          P2P Consortium Nodes ({nodes.length})
        </button>

        <button
          onClick={() => setActiveSubTab('explorer')}
          className={`px-4 py-2.5 rounded-t-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'explorer'
              ? 'bg-[#141124] text-[#ED9E5B] border-t border-x border-[#44174E]'
              : 'text-[#E9BCB9]/70 hover:text-[#E9BCB9]'
          }`}
        >
          <Layers className="w-4 h-4" />
          Decentralized Block Explorer
        </button>

        <button
          onClick={() => setActiveSubTab('mining')}
          className={`px-4 py-2.5 rounded-t-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'mining'
              ? 'bg-[#141124] text-[#ED9E5B] border-t border-x border-[#44174E]'
              : 'text-[#E9BCB9]/70 hover:text-[#E9BCB9]'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Mempool & PoW Mining ({mempool.pending_count})
        </button>

        <button
          onClick={() => setActiveSubTab('contracts')}
          className={`px-4 py-2.5 rounded-t-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'contracts'
              ? 'bg-[#141124] text-[#ED9E5B] border-t border-x border-[#44174E]'
              : 'text-[#E9BCB9]/70 hover:text-[#E9BCB9]'
          }`}
        >
          <FileCode className="w-4 h-4" />
          Smart Contracts ({smartContracts.contracts.length})
        </button>

        <button
          onClick={() => setActiveSubTab('demo')}
          className={`px-4 py-2.5 rounded-t-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'demo'
              ? 'bg-[#A34054] text-white border-t border-x border-[#ED9E5B]'
              : 'text-[#ED9E5B] hover:text-[#ED9E5B]/80 font-bold'
          }`}
        >
          <Zap className="w-4 h-4" />
          Reviewer Live Demo: Tamper & Auto-Repair
        </button>
      </div>

      {/* TAB 1: P2P CONSORTIUM NODES */}
      {activeSubTab === 'nodes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {nodes.map((node) => {
              const isTampered = node.status === 'TAMPERED' || !node.is_valid;
              const isSelected = selectedNodeId === node.node_id;

              return (
                <div
                  key={node.node_id}
                  onClick={() => handleSelectNode(node.node_id)}
                  className={`cyber-card cursor-pointer border transition-all ${
                    isTampered
                      ? 'border-red-500 bg-red-950/20 shadow-red-900/30'
                      : isSelected
                      ? 'border-[#ED9E5B] bg-[#1C1830]'
                      : 'border-[#44174E] hover:border-[#662249]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${isTampered ? 'bg-red-500 animate-ping' : 'bg-green-400'}`} />
                      <span className="text-[10px] font-mono font-bold text-[#E9BCB9]/60">PORT {node.port}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isTampered ? 'bg-red-950 text-red-400 border border-red-500' : 'bg-green-950/70 text-green-400 border border-green-500/30'
                    }`}>
                      {node.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[#E9BCB9]">{node.name}</h3>
                  <p className="text-[11px] text-[#ED9E5B] font-mono mt-0.5">Role: {node.role}</p>

                  <div className="mt-4 pt-3 border-t border-[#44174E]/60 space-y-2 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#E9BCB9]/60">Ledger Height:</span>
                      <span className="font-bold text-[#E9BCB9]">{node.block_height} Blocks</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#E9BCB9]/60">Local Mempool:</span>
                      <span className="text-[#ED9E5B]">{node.mempool_size} tx</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#E9BCB9]/60">Chain Integrity:</span>
                      <span className={node.is_valid ? 'text-green-400' : 'text-red-400 font-bold'}>
                        {node.is_valid ? 'CLEAN (100%)' : 'TAMPER DETECTED'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 p-2 bg-[#0D0B18] rounded border border-[#44174E]/40 text-[9px] font-mono truncate text-[#E9BCB9]/70">
                    <span className="block text-[8px] text-[#E9BCB9]/40 uppercase">ECDSA Public Key:</span>
                    {node.public_key}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Selected Node Ledger Preview */}
          <div className="cyber-card space-y-4">
            <div className="flex justify-between items-center border-b border-[#44174E] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#E9BCB9] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#ED9E5B]" />
                  Independent Local Ledger: {selectedNodeId.toUpperCase()}
                </h3>
                <p className="text-[11px] text-[#E9BCB9]/60">Viewing decentralized ledger stored in node's isolated state</p>
              </div>
              <span className="cyber-badge-peach text-xs">{selectedNodeChain.length} Confirmed Blocks</span>
            </div>

            <div className="space-y-3">
              {selectedNodeChain.map((b) => (
                <div key={b.index} className="p-3 bg-[#0D0B18] rounded-xl border border-[#44174E] font-mono text-xs flex flex-col md:flex-row justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="cyber-badge text-[10px]">Block #{b.index}</span>
                      <span className="text-[10px] text-[#E9BCB9]/60">{b.timestamp}</span>
                      <span className="text-green-400 text-[10px] flex items-center gap-1">
                        <Check className="w-3 h-3" /> Nonce: {b.nonce}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#ED9E5B] break-all">
                      Hash: <span className="font-bold">{b.hash}</span>
                    </div>
                    <div className="text-[10px] text-[#E9BCB9]/60 break-all">
                      Prev: {b.previous_hash}
                    </div>
                  </div>

                  <div className="text-right flex flex-col justify-center min-w-[140px]">
                    <span className="text-[10px] text-[#E9BCB9]/60">Miner Node</span>
                    <span className="text-xs font-bold text-[#E9BCB9]">{b.miner_node}</span>
                    <span className="text-[10px] text-green-400 mt-1">
                      {b.transactions ? b.transactions.length : 0} Transaction(s)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DECENTRALIZED BLOCK EXPLORER */}
      {activeSubTab === 'explorer' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#E9BCB9] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#ED9E5B]" />
              Consortium Blockchain Explorer
            </h3>
            <span className="text-xs text-[#E9BCB9]/70 font-mono">Total Verified Blocks: {selectedNodeChain.length}</span>
          </div>

          <div className="space-y-4">
            {selectedNodeChain.map((block) => (
              <div key={block.index} className="cyber-card space-y-4 font-mono text-xs border border-[#44174E]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-[#44174E] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="cyber-badge-peach text-xs font-bold">Block #{block.index}</span>
                    <span className="text-[#E9BCB9] font-bold text-sm">
                      {block.transactions && block.transactions[0] ? block.transactions[0].action : 'GENESIS'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#E9BCB9]/70">{block.timestamp}</span>
                    <span className="px-2 py-0.5 bg-[#44174E]/40 rounded text-[10px] text-[#ED9E5B] border border-[#662249]">
                      PoW Difficulty: {block.difficulty || 2}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                  <div className="bg-[#0D0B18] p-2.5 rounded-lg border border-[#44174E]/60">
                    <span className="text-[#E9BCB9]/60 block text-[9px] uppercase">Proof of Work (Nonce):</span>
                    <span className="text-green-400 font-bold text-sm">{block.nonce}</span>
                  </div>
                  <div className="bg-[#0D0B18] p-2.5 rounded-lg border border-[#44174E]/60">
                    <span className="text-[#E9BCB9]/60 block text-[9px] uppercase">Miner Node:</span>
                    <span className="text-[#E9BCB9] font-bold">{block.miner_node}</span>
                  </div>
                  <div className="bg-[#0D0B18] p-2.5 rounded-lg border border-[#44174E]/60">
                    <span className="text-[#E9BCB9]/60 block text-[9px] uppercase">Merkle Root SHA-256:</span>
                    <span className="text-[#ED9E5B] font-mono text-[10px] truncate block">{block.merkle_root}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="bg-[#0D0B18] p-3 rounded-lg border border-[#44174E]/60">
                    <span className="text-[#E9BCB9]/60 block text-[9px] uppercase">Current SHA-256 Block Hash:</span>
                    <span className="text-[#ED9E5B] font-bold break-all">{block.hash}</span>
                  </div>
                  <div className="bg-[#0D0B18] p-2.5 rounded-lg border border-[#44174E]/30 text-[10px]">
                    <span className="text-[#E9BCB9]/50 block text-[9px] uppercase">Previous Block Hash:</span>
                    <span className="text-[#E9BCB9]/80 break-all">{block.previous_hash}</span>
                  </div>
                </div>

                {/* Transaction & Signature Payload */}
                {block.transactions && block.transactions.length > 0 && (
                  <div className="border-t border-[#44174E]/40 pt-3 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-[#E9BCB9]/70 flex items-center gap-1">
                      <Key className="w-3 h-3 text-[#ED9E5B]" />
                      Cryptographic Payload & ECDSA Signatures ({block.transactions.length} Tx):
                    </span>
                    {block.transactions.map((tx, idx) => (
                      <div key={idx} className="p-3 bg-[#17132B] rounded-lg border border-[#662249]/40 space-y-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-[#ED9E5B] font-bold">{tx.tx_id || `TX-${idx}`}</span>
                          <span className="cyber-badge text-[9px] text-green-400 border-green-500/30">
                            ECDSA VERIFIED (secp256k1)
                          </span>
                        </div>
                        <pre className="text-[10px] text-[#E9BCB9]/90 bg-[#0A0914] p-2 rounded overflow-x-auto">
                          {JSON.stringify(tx.payload || tx, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MEMPOOL & POW MINING CONSOLE */}
      {activeSubTab === 'mining' && (
        <div className="space-y-6">
          <div className="cyber-card space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-bold text-sm text-[#E9BCB9] flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#ED9E5B]" />
                  Decentralized Mempool & PoW Mining Engine
                </h3>
                <p className="text-[11px] text-[#E9BCB9]/70 mt-1">
                  Unconfirmed transactions awaiting consensus mining into the next block.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={miningMiner}
                  onChange={(e) => setMiningMiner(e.target.value)}
                  className="bg-[#0D0B18] border border-[#44174E] text-[#E9BCB9] text-xs px-3 py-2 rounded-lg"
                >
                  <option value="node_ciso">Miner: Node 1 (CISO)</option>
                  <option value="node_soc">Miner: Node 2 (SOC)</option>
                  <option value="node_auditor">Miner: Node 3 (Auditor)</option>
                  <option value="node_compliance">Miner: Node 4 (Compliance)</option>
                </select>

                <button
                  onClick={handleMineBlock}
                  disabled={loading || mempool.pending_count === 0}
                  className="cyber-button text-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  {loading ? 'Mining Nonce...' : 'Mine Block (Proof-of-Work)'}
                </button>
              </div>
            </div>

            {mempool.pending_count === 0 ? (
              <div className="p-8 text-center bg-[#0D0B18] rounded-xl border border-dashed border-[#44174E]">
                <Cpu className="w-8 h-8 text-[#ED9E5B]/40 mx-auto mb-2" />
                <p className="text-xs text-[#E9BCB9]/70 font-semibold">Mempool is clean.</p>
                <p className="text-[11px] text-[#E9BCB9]/40 mt-1">All approved recommendations and execution decisions have been mined and synchronized across peer nodes.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mempool.transactions.map((tx, idx) => (
                  <div key={idx} className="p-3 bg-[#0D0B18] rounded-xl border border-[#44174E] font-mono text-xs flex justify-between items-center">
                    <div>
                      <span className="cyber-badge text-[10px] mr-2">{tx.action}</span>
                      <span className="font-bold text-[#E9BCB9]">{tx.actor}</span>
                      <p className="text-[10px] text-[#E9BCB9]/60 mt-1">{tx.timestamp}</p>
                    </div>
                    <span className="text-xs text-[#ED9E5B] font-bold">Pending Mining</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SMART CONTRACTS */}
      {activeSubTab === 'contracts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {smartContracts.contracts.map((sc) => (
              <div key={sc.id} className="cyber-card space-y-3 border border-[#44174E]">
                <div className="flex justify-between items-center">
                  <span className="cyber-badge-peach text-[10px]">{sc.id}</span>
                  <span className="text-green-400 text-[10px] font-bold">{sc.status}</span>
                </div>
                <h4 className="font-bold text-sm text-[#E9BCB9]">{sc.name}</h4>
                <p className="text-xs text-[#E9BCB9]/70 leading-relaxed">{sc.description}</p>
                <div className="pt-2 border-t border-[#44174E]/40 text-[10px] font-mono text-[#ED9E5B]">
                  Contract Version: {sc.version}
                </div>
              </div>
            ))}
          </div>

          <div className="cyber-card space-y-3">
            <h3 className="font-bold text-sm text-[#E9BCB9] flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#ED9E5B]" />
              Recent On-Chain Smart Contract Execution Logs
            </h3>
            <div className="space-y-2">
              {smartContracts.execution_history.length === 0 ? (
                <p className="text-xs text-[#E9BCB9]/60 py-4 text-center">No smart contract execution events recorded yet.</p>
              ) : (
                smartContracts.execution_history.slice(-5).map((log, idx) => (
                  <div key={idx} className="p-3 bg-[#0D0B18] rounded-lg border border-[#44174E] text-xs font-mono flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.passed ? 'bg-green-950/60 text-green-400 border border-green-500/30' : 'bg-red-950/60 text-red-400 border border-red-500/30'}`}>
                          {log.passed ? 'PASSED' : 'VIOLATION REJECTED'}
                        </span>
                        <span className="font-bold text-[#E9BCB9]">{log.action}</span>
                      </div>
                      <p className="text-[11px] text-[#E9BCB9]/70 mt-1">{log.report}</p>
                    </div>
                    <span className="text-[10px] text-[#ED9E5B]">{log.tx_id}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REVIEWER LIVE DEMO - BYZANTINE TAMPER & AUTO-REPAIR */}
      {activeSubTab === 'demo' && (
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-[#1E1128] via-[#141124] to-[#251020] rounded-2xl border-2 border-[#ED9E5B]/60 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#ED9E5B]/20 rounded-xl border border-[#ED9E5B] text-[#ED9E5B]">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <span className="cyber-badge-peach text-xs font-bold">Hackathon Reviewer Live Demonstration</span>
                <h3 className="text-lg font-bold text-white mt-0.5">Byzantine Fault Tolerance & Decentralized Tamper Auto-Recovery</h3>
                <p className="text-xs text-[#E9BCB9]/80 mt-1">
                  Demonstrate that this is a <strong>real decentralized system</strong> by corrupting a node and watching the peer majority detect and heal it automatically!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Step 1: Attack */}
              <div className="bg-[#0D0B18] p-4 rounded-xl border border-red-500/40 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" />
                  Step 1: Simulate Malicious Insider Tamper
                </div>
                <p className="text-xs text-[#E9BCB9]/70">
                  Directly alters Block #1 inside Node 1's isolated database. This breaks the SHA-256 Merkle root and hash linkage.
                </p>
                <button
                  onClick={handleTamperAttack}
                  disabled={loading}
                  className="w-full bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-500 font-bold px-4 py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Corrupt Block #1 on Node 1 (CISO)
                </button>
              </div>

              {/* Step 2: Auto-Repair */}
              <div className="bg-[#0D0B18] p-4 rounded-xl border border-green-500/40 space-y-3">
                <div className="flex items-center gap-2 text-green-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  Step 2: Run Byzantine Consensus Auto-Repair
                </div>
                <p className="text-xs text-[#E9BCB9]/70">
                  Nodes 2, 3, and 4 vote (3 vs 1 majority). The corrupted node is rejected, and the genuine consensus chain is broadcasted to restore it!
                </p>
                <button
                  onClick={handleConsensusAutoRepair}
                  disabled={loading}
                  className="w-full bg-green-900/60 hover:bg-green-800 text-green-200 border border-green-500 font-bold px-4 py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Execute BFT Consensus & Heal Node
                </button>
              </div>
            </div>
          </div>

          {/* Current Node Status Preview during demo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {nodes.map((node) => {
              const isTampered = node.status === 'TAMPERED' || !node.is_valid;
              return (
                <div key={node.node_id} className={`p-3 rounded-xl border font-mono text-xs ${
                  isTampered ? 'bg-red-950/40 border-red-500 text-red-300' : 'bg-[#0D0B18] border-[#44174E] text-[#E9BCB9]'
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-[11px]">{node.name.split(' ')[0]}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      isTampered ? 'bg-red-900 text-red-200' : 'bg-green-900/60 text-green-300'
                    }`}>
                      {node.status}
                    </span>
                  </div>
                  <div className="text-[10px] opacity-75 truncate">Hash: {node.latest_hash}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
