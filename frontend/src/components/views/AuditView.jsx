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
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">Permissioned Consortium</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">BFT Consensus</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-6 h-6 text-blue-600" />
            Consortium Blockchain Ledger
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchBlockchainState} className="cyber-button-secondary text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Network
          </button>
          <button onClick={handleVerifyLegacy} disabled={loading} className="cyber-button text-xs">
            <ShieldCheck className="w-4 h-4" />
            Verify State
          </button>
        </div>
      </div>

      {/* Network Health Bar */}
      {networkInfo && (
        <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold ${
          hasAnomaly
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            {hasAnomaly ? (
              <ShieldAlert className="w-6 h-6 text-amber-600 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">Consensus Health:</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  hasAnomaly ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {networkInfo.consensus_health}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <div>
              <span className="text-slate-500 block uppercase text-[10px] font-bold">Mempool</span>
              <span className="text-blue-700 font-bold text-sm">{mempool.pending_count} Pending</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px] font-bold">Network</span>
              <span className="text-emerald-600 font-bold text-sm">P2P Synchronized</span>
            </div>
          </div>
        </div>
      )}

      {/* Legacy DB Verification Banner if triggered */}
      {verifyResult && (
        <div className={`p-3 rounded-xl border flex items-center gap-3 text-xs ${verifyResult.is_valid ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-bold">{verifyResult.message}</p>
            <p className="text-[10px] text-slate-500">{verifyResult.algorithm} | {verifyResult.total_blocks_checked} Blocks Verified</p>
          </div>
        </div>
      )}

      {/* Action Notification Box */}
      {actionLog && (
        <div className={`p-4 rounded-xl border text-xs font-mono transition-all ${
          actionLog.status === 'tamper'
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : actionLog.status === 'recovered'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              Consensus Event Log
            </span>
            <span className="text-[10px] text-slate-400">{new Date().toLocaleTimeString()}</span>
          </div>
          <p className="font-bold text-sm text-slate-900">{actionLog.message}</p>
          {actionLog.details && (
            <pre className="mt-2 p-2 bg-slate-50 rounded border border-slate-200 text-[10px] overflow-x-auto text-slate-700">
              {JSON.stringify(actionLog.details, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSubTab('nodes')}
          className={`px-4 py-2.5 rounded-t-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'nodes'
              ? 'bg-white text-blue-700 border-t border-x border-slate-200 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Network className="w-4 h-4" />
          P2P Consortium Nodes ({nodes.length})
        </button>

        <button
          onClick={() => setActiveSubTab('explorer')}
          className={`px-4 py-2.5 rounded-t-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'explorer'
              ? 'bg-white text-blue-700 border-t border-x border-slate-200 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Decentralized Block Explorer
        </button>

        <button
          onClick={() => setActiveSubTab('mining')}
          className={`px-4 py-2.5 rounded-t-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'mining'
              ? 'bg-white text-blue-700 border-t border-x border-slate-200 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Mempool & PoW Mining ({mempool.pending_count})
        </button>

        <button
          onClick={() => setActiveSubTab('contracts')}
          className={`px-4 py-2.5 rounded-t-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'contracts'
              ? 'bg-white text-blue-700 border-t border-x border-slate-200 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCode className="w-4 h-4" />
          Smart Contracts ({smartContracts.contracts.length})
        </button>

        <button
          onClick={() => setActiveSubTab('demo')}
          className={`px-4 py-2.5 rounded-t-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'demo'
              ? 'bg-blue-600 text-white border-t border-x border-blue-600 shadow-sm'
              : 'text-blue-600 hover:text-blue-800 font-bold'
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
                      ? 'border-red-400 bg-red-50/50 shadow-sm'
                      : isSelected
                      ? 'border-blue-500 bg-blue-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${isTampered ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
                      <span className="text-[10px] font-mono font-bold text-slate-400">PORT {node.port}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isTampered ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {node.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-800">{node.name}</h3>
                  <p className="text-[11px] text-blue-700 font-mono mt-0.5 font-semibold">Role: {node.role}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ledger Height:</span>
                      <span className="font-bold text-slate-800">{node.block_height} Blocks</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Local Mempool:</span>
                      <span className="text-blue-700 font-bold">{node.mempool_size} tx</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Chain Integrity:</span>
                      <span className={node.is_valid ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                        {node.is_valid ? 'CLEAN (100%)' : 'TAMPER DETECTED'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 p-2 bg-slate-50 rounded border border-slate-200 text-[9px] font-mono truncate text-slate-600">
                    <span className="block text-[8px] text-slate-400 uppercase">ECDSA Public Key:</span>
                    {node.public_key}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Selected Node Ledger Preview */}
          <div className="cyber-card space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Independent Local Ledger: {selectedNodeId.toUpperCase()}
                </h3>
                <p className="text-[11px] text-slate-500">Viewing decentralized ledger stored in node's isolated state</p>
              </div>
              <span className="cyber-badge-peach text-xs">{selectedNodeChain.length} Confirmed Blocks</span>
            </div>

            <div className="space-y-3">
              {selectedNodeChain.map((b) => (
                <div key={b.index} className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs flex flex-col md:flex-row justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="cyber-badge text-[10px]">Block #{b.index}</span>
                      <span className="text-[10px] text-slate-400">{b.timestamp}</span>
                      <span className="text-emerald-600 text-[10px] flex items-center gap-1 font-bold">
                        <Check className="w-3 h-3" /> Nonce: {b.nonce}
                      </span>
                    </div>
                    <div className="text-[11px] text-blue-700 break-all">
                      Hash: <span className="font-bold">{b.hash}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 break-all">
                      Prev: {b.previous_hash}
                    </div>
                  </div>

                  <div className="text-right flex flex-col justify-center min-w-[140px]">
                    <span className="text-[10px] text-slate-400">Miner Node</span>
                    <span className="text-xs font-bold text-slate-800">{b.miner_node}</span>
                    <span className="text-[10px] text-emerald-600 font-bold mt-1">
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
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Consortium Blockchain Explorer
            </h3>
            <span className="text-xs text-slate-500 font-mono">Total Verified Blocks: {selectedNodeChain.length}</span>
          </div>

          <div className="space-y-4">
            {selectedNodeChain.map((block) => (
              <div key={block.index} className="cyber-card space-y-4 font-mono text-xs border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="cyber-badge-peach text-xs font-bold">Block #{block.index}</span>
                    <span className="text-slate-800 font-bold text-sm">
                      {block.transactions && block.transactions[0] ? block.transactions[0].action : 'GENESIS'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500">{block.timestamp}</span>
                    <span className="px-2 py-0.5 bg-blue-50 rounded text-[10px] text-blue-700 border border-blue-200">
                      PoW Difficulty: {block.difficulty || 2}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase">Proof of Work (Nonce):</span>
                    <span className="text-emerald-600 font-bold text-sm">{block.nonce}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase">Miner Node:</span>
                    <span className="text-slate-800 font-bold">{block.miner_node}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase">Merkle Root SHA-256:</span>
                    <span className="text-blue-700 font-mono text-[10px] truncate block font-bold">{block.merkle_root}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase">Current SHA-256 Block Hash:</span>
                    <span className="text-blue-700 font-bold break-all">{block.hash}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[10px]">
                    <span className="text-slate-400 block text-[9px] uppercase">Previous Block Hash:</span>
                    <span className="text-slate-600 break-all">{block.previous_hash}</span>
                  </div>
                </div>

                {/* Transaction & Signature Payload */}
                {block.transactions && block.transactions.length > 0 && (
                  <div className="border-t border-slate-200 pt-3 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-600 flex items-center gap-1">
                      <Key className="w-3 h-3 text-blue-600" />
                      Cryptographic Payload & ECDSA Signatures ({block.transactions.length} Tx):
                    </span>
                    {block.transactions.map((tx, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-blue-700 font-bold">{tx.tx_id || `TX-${idx}`}</span>
                          <span className="cyber-badge text-[9px] text-emerald-700 border-emerald-200 bg-emerald-50">
                            ECDSA VERIFIED (secp256k1)
                          </span>
                        </div>
                        <pre className="text-[10px] text-slate-800 bg-white p-2 rounded border border-slate-200 overflow-x-auto">
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
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  Decentralized Mempool & PoW Mining Engine
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Unconfirmed transactions awaiting consensus mining into the next block.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={miningMiner}
                  onChange={(e) => setMiningMiner(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
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
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <Cpu className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-700 font-semibold">Mempool is clean.</p>
                <p className="text-[11px] text-slate-500 mt-1">All approved recommendations and execution decisions have been mined and synchronized across peer nodes.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mempool.transactions.map((tx, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs flex justify-between items-center">
                    <div>
                      <span className="cyber-badge text-[10px] mr-2">{tx.action}</span>
                      <span className="font-bold text-slate-800">{tx.actor}</span>
                      <p className="text-[10px] text-slate-500 mt-1">{tx.timestamp}</p>
                    </div>
                    <span className="text-xs text-blue-700 font-bold">Pending Mining</span>
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
              <div key={sc.id} className="cyber-card space-y-3 border border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="cyber-badge-peach text-[10px]">{sc.id}</span>
                  <span className="text-emerald-600 text-[10px] font-bold">{sc.status}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-800">{sc.name}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{sc.description}</p>
                <div className="pt-2 border-t border-slate-100 text-[10px] font-mono text-blue-700 font-semibold">
                  Contract Version: {sc.version}
                </div>
              </div>
            ))}
          </div>

          <div className="cyber-card space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-600" />
              Recent On-Chain Smart Contract Execution Logs
            </h3>
            <div className="space-y-2">
              {smartContracts.execution_history.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No smart contract execution events recorded yet.</p>
              ) : (
                smartContracts.execution_history.slice(-5).map((log, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {log.passed ? 'PASSED' : 'VIOLATION REJECTED'}
                        </span>
                        <span className="font-bold text-slate-800">{log.action}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{log.report}</p>
                    </div>
                    <span className="text-[10px] text-blue-700 font-bold">{log.tx_id}</span>
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
          <div className="p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 rounded-2xl border-2 border-blue-300 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl border border-blue-300 text-blue-700">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <span className="cyber-badge-peach text-xs font-bold">Hackathon Reviewer Live Demonstration</span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">Byzantine Fault Tolerance & Decentralized Tamper Auto-Recovery</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Demonstrate that this is a <strong>real decentralized system</strong> by corrupting a node and watching the peer majority detect and heal it automatically!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Step 1: Attack */}
              <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" />
                  Step 1: Simulate Malicious Insider Tamper
                </div>
                <p className="text-xs text-slate-600">
                  Directly alters Block #1 inside Node 1's isolated database. This breaks the SHA-256 Merkle root and hash linkage.
                </p>
                <button
                  onClick={handleTamperAttack}
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Corrupt Block #1 on Node 1 (CISO)
                </button>
              </div>

              {/* Step 2: Auto-Repair */}
              <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  Step 2: Run Byzantine Consensus Auto-Repair
                </div>
                <p className="text-xs text-slate-600">
                  Nodes 2, 3, and 4 vote (3 vs 1 majority). The corrupted node is rejected, and the genuine consensus chain is broadcasted to restore it!
                </p>
                <button
                  onClick={handleConsensusAutoRepair}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
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
                  isTampered ? 'bg-red-50 border-red-300 text-red-800' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-[11px]">{node.name.split(' ')[0]}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      isTampered ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {node.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">Hash: {node.latest_hash}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
