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
    fetchJSON('/learning/seed-demo', { method: 'POST', body: JSON.stringify({ organization_id: orgId, count }) }),

  // Step 10: Continuous Intelligence, Newsletter Ingestion & HITL Engine
  getOrganizations: () => fetchJSON('/intelligence/organizations'),
  registerOrganization: (payload) => fetchJSON('/intelligence/organizations/register', { method: 'POST', body: JSON.stringify(payload) }),
  getEmailConnections: (orgId = 'org_abc_tech') => fetchJSON(`/intelligence/email/connections?organization_id=${encodeURIComponent(orgId)}`),
  connectEmail: (payload) => fetchJSON('/intelligence/email/connect', { method: 'POST', body: JSON.stringify(payload) }),
  syncEmail: (connId = null, orgId = 'org_abc_tech') => fetchJSON('/intelligence/email/sync', { method: 'POST', body: JSON.stringify({ connection_id: connId, organization_id: orgId }) }),
  getIngestedEmails: (orgId = 'org_abc_tech') => fetchJSON(`/intelligence/emails?organization_id=${encodeURIComponent(orgId)}`),
  getIntelligenceEvents: (category = null, orgId = 'org_abc_tech') => fetchJSON(`/intelligence/events?${category ? `category=${category}&` : ''}organization_id=${encodeURIComponent(orgId)}`),
  getIntelligenceReviewQueue: (role = 'CISO', orgId = 'org_abc_tech') => fetchJSON(`/intelligence/review-queue?role=${encodeURIComponent(role)}&organization_id=${encodeURIComponent(orgId)}`),
  confirmIntelligence: (eventId, role = 'CISO', reviewerId = 'CISO-Lead', reason = '') =>
    fetchJSON(`/intelligence/${eventId}/confirm`, { method: 'POST', body: JSON.stringify({ decision: 'CONFIRM', reviewer_role: role, reviewer_id: reviewerId, reason }) }),
  correctIntelligence: (eventId, corrections, role = 'CISO', reviewerId = 'CISO-Lead', reason = '') =>
    fetchJSON(`/intelligence/${eventId}/correct`, { method: 'POST', body: JSON.stringify({ decision: 'CORRECT', reviewer_role: role, reviewer_id: reviewerId, corrections, reason }) }),
  rejectIntelligence: (eventId, role = 'CISO', reviewerId = 'CISO-Lead', reason = '') =>
    fetchJSON(`/intelligence/${eventId}/reject`, { method: 'POST', body: JSON.stringify({ decision: 'REJECT', reviewer_role: role, reviewer_id: reviewerId, reason }) }),
  investigateIntelligence: (eventId, role = 'CISO', reviewerId = 'CISO-Lead') =>
    fetchJSON(`/intelligence/${eventId}/investigate`, { method: 'POST', body: JSON.stringify({ decision: 'NEED_INVESTIGATION', reviewer_role: role, reviewer_id: reviewerId }) }),
  recordIntelligenceOutcome: (eventId, outcomeState = 'EXPLOITED_SUCCESSFULLY', lossInr = 3500000.0, notes = '') =>
    fetchJSON(`/intelligence/${eventId}/outcome`, { method: 'POST', body: JSON.stringify({ outcome_state: outcomeState, observed_loss_inr: lossInr, notes }) }),
  getPredictionOutcomes: (orgId = 'org_abc_tech') => fetchJSON(`/intelligence/outcomes?organization_id=${encodeURIComponent(orgId)}`),
  getIntelligenceModelFeedback: (orgId = 'org_abc_tech') => fetchJSON(`/intelligence/model-feedback?organization_id=${encodeURIComponent(orgId)}`),
  trainIntelligenceCandidate: (orgId = 'org_abc_tech') => fetchJSON('/intelligence/model-feedback/train-candidate', { method: 'POST', body: JSON.stringify({ organization_id: orgId }) }),
  approveIntelligenceCandidate: (candVer) => fetchJSON(`/intelligence/model-feedback/${candVer}/approve`, { method: 'POST' }),
  rejectIntelligenceCandidate: (candVer, reason = '') => fetchJSON(`/intelligence/model-feedback/${candVer}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getIntelligenceSources: () => fetchJSON('/intelligence/sources'),
  triggerIntelligenceOfflineDemo: (workflow = 'ALL', orgId = 'org_abc_tech') =>
    fetchJSON('/intelligence/offline-demo', { method: 'POST', body: JSON.stringify({ workflow, organization_id: orgId }) }),
  getModelVersions: () => fetchJSON('/intelligence/model-versions'),

  // Organization Data & Model 6 Information
  getOrganizationProfile: (orgId = 'org_abc_tech') => fetchJSON(`/predict/organization-profile?org_id=${encodeURIComponent(orgId)}`),
  getModel6Info: () => fetchJSON('/predict/model6-info'),

  // Attack Demo Event System (for Attacker Console <-> Dashboard <-> Bad Apple)
  startAttackDemo: (scenario = 'controlled_local_attack') =>
    fetchJSON('/demo/attack/start', { method: 'POST', body: JSON.stringify({ scenario }) }),
  completeAttackDemo: (correlationId) =>
    fetchJSON('/demo/attack/complete', { method: 'POST', body: JSON.stringify({ correlation_id: correlationId }) }),
  resetAttackDemo: () =>
    fetchJSON('/demo/attack/reset', { method: 'POST' }),
  getDemoAttackState: () => fetchJSON('/demo/attack/state'),
};
