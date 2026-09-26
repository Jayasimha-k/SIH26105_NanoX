/**
 * demoState.js — Single Source of Truth for SIH 2026 Demo Values.
 *
 * Deterministic Scenario:
 *  - Scenario: strix_container_escape_pentest
 *  - Organization: org_abc_tech
 *  - Asset: ASSET-001 (Core Oracle Production DB)
 *
 * Trace Backend Calculations:
 *  1. Baseline (IDLE):
 *     - Risk Score: 78% (0.78 calibrated organization probability)
 *     - Pre-EAL: ₹39,543,000 (₹395.4 Lakhs)
 *     - Model 6 Flow Anomaly: 0.040 (benign flow)
 *     - Residual EAL: ₹6,326,880 (₹63.3 Lakhs post-control baseline)
 *  2. Attack (ACTIVE):
 *     - Risk Score: 96% (0.9574 fused probability: 0.960 Model 6 XGBoost * 0.90 + 0.934 Meta * 0.10)
 *     - Pre-EAL: ₹61,371,720 (₹613.7 Lakhs)
 *     - Spike Delta: +₹21,828,720 (+₹218.3 Lakhs / +55.2%)
 *     - Model 6 Flow Anomaly: 0.960 (anomalous attack flow)
 *     - Target Asset: ASSET-001 (Core Oracle Production DB, Criticality 9.5)
 *     - Prescribed Safeguard: Zero-Trust Microsegmentation & Network Isolation
 *  3. Remediation (COMPLETED):
 *     - Risk Score: 14% (0.142 post-mitigation residual probability)
 *     - Residual EAL: ₹6,326,880 (₹63.3 Lakhs)
 *     - Loss Prevented: ₹33,216,120 (₹332.2L from baseline) or ₹55,044,840 (₹550.4L from attack peak)
 *     - EAL Reduction: -84.0%
 *     - ROSI: 465.8%
 */

export const CANONICAL_DEMO_STATE = {
  scenario: 'strix_container_escape_pentest',
  organizationId: 'org_abc_tech',
  targetAsset: {
    id: 'ASSET-001',
    name: 'Core Oracle Production DB',
    criticality: 9.5,
    financialValueInr: 12000000.0,
    financialValueLakhs: 120.0,
  },
  baseline: {
    riskScore: 78,
    riskScorePct: '78%',
    ealInr: 39543000.0,
    ealLakhs: 395.4,
    p6FlowAnomaly: 0.040,
    fusionProb: 0.35,
    status: 'NORMAL',
    statusLabel: 'BASELINE NORMAL (78%)',
    controlStatus: 'MONITORING',
    monthlyTrend: [
      { month: 'Jan', preEal: 250.0, postEal: 63.3 },
      { month: 'Feb', preEal: 280.0, postEal: 63.3 },
      { month: 'Mar', preEal: 310.0, postEal: 63.3 },
      { month: 'Apr', preEal: 345.0, postEal: 63.3 },
      { month: 'May', preEal: 375.0, postEal: 63.3 },
      { month: 'Jun (Baseline)', preEal: 395.4, postEal: 63.3 },
    ]
  },
  attack: {
    riskScore: 96,
    riskScorePct: '96%',
    fusedProb: 0.9574,
    fusedProbPct: '95.7%',
    orgAdaptedProb: 0.9574,
    ealInr: 61371720.0,
    ealLakhs: 613.7,
    spikeInr: 21828720.0,
    spikeLakhs: 218.3,
    spikePct: '+55.2%',
    p1Nvd: 0.98,
    p2Epss: 0.94,
    p3CisaKev: true,
    p4Mitre: 'T1190 (Public RCE)',
    p5Meta: 0.934,
    p6Network: 0.960,
    fusionVersion: 'v2',
    fusionWeight: 0.90,
    recommendedControl: 'Zero-Trust Microsegmentation & Network Isolation',
    status: 'ATTACK_ACTIVE',
    statusLabel: 'ATTACK ACTIVE (96%)',
    monthlyTrend: [
      { month: 'Jan', preEal: 250.0, postEal: 63.3 },
      { month: 'Feb', preEal: 280.0, postEal: 63.3 },
      { month: 'Mar', preEal: 310.0, postEal: 63.3 },
      { month: 'Apr', preEal: 345.0, postEal: 63.3 },
      { month: 'May', preEal: 375.0, postEal: 63.3 },
      { month: 'Jun (Baseline)', preEal: 395.4, postEal: 63.3 },
      { month: 'NOW (LIVE ATTACK)', preEal: 613.7, postEal: 63.3 },
    ]
  },
  remediation: {
    riskScore: 14,
    riskScorePct: '14%',
    residualProb: 0.142,
    residualProbPct: '14.2%',
    ealInr: 6326880.0,
    ealLakhs: 63.3,
    riskReductionBaselineInr: 33216120.0,
    riskReductionBaselineLakhs: 332.2,
    lossAvertedPeakInr: 55044840.0,
    lossAvertedPeakLakhs: 550.4,
    reductionPct: '-84.0%',
    rosi: 465.8,
    controlDeployed: 'Zero-Trust Microsegmentation & Network Isolation',
    status: 'REMEDIATED',
    statusLabel: 'POST-REMEDIATION (14%)',
    monthlyTrend: [
      { month: 'Jan', preEal: 250.0, postEal: 63.3 },
      { month: 'Feb', preEal: 280.0, postEal: 63.3 },
      { month: 'Mar', preEal: 310.0, postEal: 63.3 },
      { month: 'Apr', preEal: 345.0, postEal: 63.3 },
      { month: 'May', preEal: 375.0, postEal: 63.3 },
      { month: 'Jun (Baseline)', preEal: 395.4, postEal: 63.3 },
      { month: 'ATTACK SPIKE', preEal: 613.7, postEal: 63.3 },
      { month: 'REMEDIATED (63.3L)', preEal: 63.3, postEal: 63.3 },
    ]
  }
};

/**
 * Standard Lakhs currency formatting (e.g. ₹613.7 Lakhs)
 */
export function formatLakhs(amountInr) {
  if (amountInr === undefined || amountInr === null || isNaN(amountInr)) return '₹0.0 Lakhs';
  const lakhs = amountInr / 100000;
  return `₹${lakhs.toFixed(1)} Lakhs`;
}

/**
 * Short Lakhs currency formatting (e.g. ₹613.7L)
 */
export function formatShortLakhs(amountInr) {
  if (amountInr === undefined || amountInr === null || isNaN(amountInr)) return '₹0.0L';
  const lakhs = amountInr / 100000;
  return `₹${lakhs.toFixed(1)}L`;
}

/**
 * Full INR integer string formatting (e.g. ₹61,371,720)
 */
export function formatFullInr(amountInr) {
  if (amountInr === undefined || amountInr === null || isNaN(amountInr)) return '₹0';
  return `₹${Math.round(amountInr).toLocaleString('en-IN')}`;
}

/**
 * Returns canonical demo state values derived from current live attack state
 */
export function getActiveDemoState(attackState) {
  const isAttackActive = attackState?.active || attackState?.status === 'ATTACK_STARTED';
  const isAttackCompleted = attackState?.status === 'ATTACK_COMPLETED';
  const pipe = attackState?.pipeline;

  if (isAttackActive) {
    const risk = pipe?.fused_probability ? Math.round(pipe.fused_probability * 100) : CANONICAL_DEMO_STATE.attack.riskScore;
    const eal = pipe?.active_attack_eal || CANONICAL_DEMO_STATE.attack.ealInr;
    const p6 = pipe?.p6_network || CANONICAL_DEMO_STATE.attack.p6Network;
    return {
      phase: 'attack',
      isAttackActive: true,
      isAttackCompleted: false,
      riskScore: risk,
      riskScorePct: `${risk}%`,
      ealInr: eal,
      ealLakhs: Number((eal / 100000).toFixed(1)),
      ealFormatted: formatLakhs(eal),
      ealShortFormatted: formatShortLakhs(eal),
      ealFullFormatted: formatFullInr(eal),
      spikeInr: pipe?.eal_spike_inr || CANONICAL_DEMO_STATE.attack.spikeInr,
      spikeLakhs: Number(((pipe?.eal_spike_inr || CANONICAL_DEMO_STATE.attack.spikeInr) / 100000).toFixed(1)),
      p6FlowAnomaly: p6,
      fusedProb: pipe?.fused_probability || CANONICAL_DEMO_STATE.attack.fusedProb,
      targetAsset: pipe?.asset_id ? `${pipe.asset_id} (${pipe.asset_name || 'Core Oracle DB'})` : `${CANONICAL_DEMO_STATE.targetAsset.id} (${CANONICAL_DEMO_STATE.targetAsset.name})`,
      statusLabel: `ATTACK ACTIVE (${risk}%)`,
      controlRecommendation: pipe?.recommended_control || CANONICAL_DEMO_STATE.attack.recommendedControl,
      trendData: CANONICAL_DEMO_STATE.attack.monthlyTrend
    };
  }

  if (isAttackCompleted) {
    const risk = CANONICAL_DEMO_STATE.remediation.riskScore;
    const eal = pipe?.post_eal || CANONICAL_DEMO_STATE.remediation.ealInr;
    return {
      phase: 'remediation',
      isAttackActive: false,
      isAttackCompleted: true,
      riskScore: risk,
      riskScorePct: `${risk}%`,
      ealInr: eal,
      ealLakhs: Number((eal / 100000).toFixed(1)),
      ealFormatted: formatLakhs(eal),
      ealShortFormatted: formatShortLakhs(eal),
      ealFullFormatted: formatFullInr(eal),
      lossAvertedInr: CANONICAL_DEMO_STATE.remediation.lossAvertedPeakInr,
      lossAvertedLakhs: CANONICAL_DEMO_STATE.remediation.lossAvertedPeakLakhs,
      targetAsset: `${CANONICAL_DEMO_STATE.targetAsset.id} (${CANONICAL_DEMO_STATE.targetAsset.name})`,
      statusLabel: 'POST-REMEDIATION (14%)',
      controlDeployed: CANONICAL_DEMO_STATE.remediation.controlDeployed,
      trendData: CANONICAL_DEMO_STATE.remediation.monthlyTrend
    };
  }

  // Baseline IDLE
  const risk = CANONICAL_DEMO_STATE.baseline.riskScore;
  const eal = CANONICAL_DEMO_STATE.baseline.ealInr;
  return {
    phase: 'baseline',
    isAttackActive: false,
    isAttackCompleted: false,
    riskScore: risk,
    riskScorePct: `${risk}%`,
    ealInr: eal,
    ealLakhs: Number((eal / 100000).toFixed(1)),
    ealFormatted: formatLakhs(eal),
    ealShortFormatted: formatShortLakhs(eal),
    ealFullFormatted: formatFullInr(eal),
    targetAsset: `${CANONICAL_DEMO_STATE.targetAsset.id} (${CANONICAL_DEMO_STATE.targetAsset.name})`,
    statusLabel: 'BASELINE NORMAL (78%)',
    controlStatus: CANONICAL_DEMO_STATE.baseline.controlStatus,
    trendData: CANONICAL_DEMO_STATE.baseline.monthlyTrend
  };
}
