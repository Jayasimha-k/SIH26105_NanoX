const BASE_URL = '/api';

async function fetchJSON(endpoint, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Network response error' }));
      throw new Error(err.detail || `HTTP Error ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`API Fetch Error [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Step 1: Detect Data Collection
  getPublicVulnerabilities: () => fetchJSON('/detect/vulnerabilities'),
  getEnterpriseAssets: () => fetchJSON('/detect/assets'),
  getIncidentHistory: () => fetchJSON('/detect/incidents'),
  getSecurityControls: () => fetchJSON('/detect/controls'),

  // Step 2: Predict AI Models (P1-P4 Ensemble & Org Adapt)
  predictRisk: (asset_id, vulnerability_id) =>
    fetchJSON('/predict/run', { method: 'POST', body: JSON.stringify({ asset_id, vulnerability_id }) }),
  getMLModelDiagnostics: () => fetchJSON('/predict/diagnostics'),

  // Step 3: Quantify Financial Risk (EAL)
  getQuantificationOverview: () => fetchJSON('/quantify/overview'),

  // Steps 4 & 5: Optimize & Recommend (PuLP Solver)
  runOptimization: (budget, enforce_control_ids = [], exclude_control_ids = []) =>
    fetchJSON('/optimize/run', { method: 'POST', body: JSON.stringify({ budget, enforce_control_ids, exclude_control_ids }) }),

  getRecommendations: () => fetchJSON('/optimize/recommendations'),

  // Step 6: Human-in-the-Loop Approvals
  approveRecommendation: (id, action, comments = '') =>
    fetchJSON(`/approvals/${id}`, { method: 'POST', body: JSON.stringify({ action, comments }) }),

  // Step 7: Execute Controls
  markExecuted: (id) => fetchJSON(`/execution/execute/${id}`, { method: 'POST' }),

  // Step 8: Verify Impact & Continuous Learning Recalculation
  triggerRecalculation: (id) => fetchJSON(`/recalculate/trigger/${id}`, { method: 'POST' }),

  // Blockchain Audit Trail & Decentralized Consortium
  getAuditBlocks: () => fetchJSON('/audit/blocks'),
  verifyAuditLedger: () => fetchJSON('/audit/verify'),
  getBlockchainNetwork: () => fetchJSON('/blockchain/network'),
  getBlockchainNodes: () => fetchJSON('/blockchain/nodes'),
  getNodeChain: (nodeId) => fetchJSON(`/blockchain/nodes/${nodeId}/chain`),
  getBlockchainMempool: () => fetchJSON('/blockchain/mempool'),
  mineBlockchainBlock: (minerNodeId = 'node_ciso') =>
    fetchJSON('/blockchain/mine', { method: 'POST', body: JSON.stringify({ miner_node_id: minerNodeId }) }),
  tamperBlockchainBlock: (nodeId = 'node_ciso', blockIndex = 1) =>
    fetchJSON('/blockchain/tamper', { method: 'POST', body: JSON.stringify({ node_id: nodeId, block_index: blockIndex }) }),
  resolveBlockchainConflicts: () =>
    fetchJSON('/blockchain/resolve-conflicts', { method: 'POST' }),
  getBlockchainSmartContracts: () => fetchJSON('/blockchain/smart-contracts'),
  getConsortiumDirectory: () => fetchJSON('/blockchain/directory'),

  // Executive Business Value & Standards Compliance
  getFrameworkCompliance: () => fetchJSON('/business-value/compliance')
};
