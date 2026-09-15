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
  // Auth
  login: (username, password) => fetchJSON('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  // Data endpoints
  getAssets: () => fetchJSON('/assets/'),
  getVulnerabilities: () => fetchJSON('/vulnerabilities/'),
  getSecurityControls: () => fetchJSON('/optimization/controls'),
  getRiskOverview: () => fetchJSON('/risk/overview'),
  getRecommendations: () => fetchJSON('/recommendations/'),
  getAuditBlocks: () => fetchJSON('/audit/blocks'),
  verifyAuditLedger: () => fetchJSON('/audit/verify'),
  getMLModelMetadata: () => fetchJSON('/ml/models'),

  // Predictive & Optimization triggers
  predictRisk: (asset_id, vulnerability_id, features) =>
    fetchJSON('/ml/predict', { method: 'POST', body: JSON.stringify({ asset_id, vulnerability_id, features }) }),

  assessRisk: (asset_id, vulnerability_id, control_ids) =>
    fetchJSON('/risk/assess', { method: 'POST', body: JSON.stringify({ asset_id, vulnerability_id, control_ids }) }),

  runOptimization: (budget, enforce_control_ids = [], exclude_control_ids = []) =>
    fetchJSON('/optimization/run', { method: 'POST', body: JSON.stringify({ budget, enforce_control_ids, exclude_control_ids }) }),

  simulateWhatIf: (budget, active_control_ids, threat_multiplier = 1.0) =>
    fetchJSON('/optimization/what-if', { method: 'POST', body: JSON.stringify({ budget, active_control_ids, threat_multiplier }) }),

  // Actions
  approveRecommendation: (id, action, comments = '') =>
    fetchJSON(`/approvals/${id}`, { method: 'POST', body: JSON.stringify({ action, comments }) }),

  markExecuted: (id) => fetchJSON(`/execution/execute/${id}`, { method: 'POST' }),

  verifyExecution: (id) => fetchJSON(`/execution/verify/${id}`, { method: 'POST' })
};
