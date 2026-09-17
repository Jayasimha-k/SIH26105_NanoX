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
  getBlockchainStats: () => fetchJSON('/blockchain/stats'),
  verifyConsortiumIntegrity: () => fetchJSON('/blockchain/verify-all'),

  // Continuous Threat Intelligence & Offline Feeds
  getThreatIntelligenceRecords: (status) =>
    fetchJSON(`/threat-intelligence/records${status ? `?validation_status=${status}` : ''}`),
  triggerThreatIngestion: (offlineMode = true) =>
    fetchJSON('/threat-intelligence/ingest', { method: 'POST', body: JSON.stringify({ offline_mode: offlineMode }) }),
  triggerThreatReassessment: (threatId = null, organizationId = 'Hospital A') =>
    fetchJSON('/threat-intelligence/reassess', { method: 'POST', body: JSON.stringify({ threat_id: threatId, organization_id: organizationId }) }),
  getThreatSources: () => fetchJSON('/threat-intelligence/sources'),

  // Executive Business Value & Standards Compliance
  getFrameworkCompliance: () => fetchJSON('/business-value/compliance'),

  // Step 8b: Continual Learning & Model Governance Engine
  getLearningStatus: (orgId = 'Hospital A') =>
    fetchJSON(`/learning/status?org_id=${encodeURIComponent(orgId)}`),
  getLearningEvidence: (status, orgId = 'Hospital A') =>
    fetchJSON(`/learning/evidence?org_id=${encodeURIComponent(orgId)}${status ? `&status=${encodeURIComponent(status)}` : ''}`),
  recordLearningEvidence: (payload) =>
    fetchJSON('/learning/evidence', { method: 'POST', body: JSON.stringify(payload) }),
  confirmLearningOutcome: (evidenceId, outcome, notes = '') =>
    fetchJSON('/learning/confirm-outcome', { method: 'POST', body: JSON.stringify({ evidence_id: evidenceId, outcome_status: outcome, outcome, notes }) }),
  trainCandidateModel: (orgId = 'Hospital A') =>
    fetchJSON('/learning/train-candidate', { method: 'POST', body: JSON.stringify({ organization_id: orgId }) }),
  validateCandidateModel: (orgId = 'Hospital A') =>
    fetchJSON('/learning/validate-candidate', { method: 'POST', body: JSON.stringify({ organization_id: orgId }) }),
  promoteCandidateModel: (candidateVersion, orgId = 'Hospital A') =>
    fetchJSON('/learning/promote', { method: 'POST', body: JSON.stringify({ organization_id: orgId, candidate_version: candidateVersion }) }),
  getLearningModels: (orgId = 'Hospital A') =>
    fetchJSON(`/learning/models?org_id=${encodeURIComponent(orgId)}`),
  getLearningDrift: (orgId = 'Hospital A') =>
    fetchJSON(`/learning/drift?org_id=${encodeURIComponent(orgId)}`),
  seedDemoLearningEvidence: (orgId = 'Hospital A', count = 25) =>
    fetchJSON('/learning/seed-demo', { method: 'POST', body: JSON.stringify({ organization_id: orgId, count }) })
};
