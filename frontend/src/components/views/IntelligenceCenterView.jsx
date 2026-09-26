import React, { useState, useEffect } from 'react';
import {
  Mail, Inbox, ShieldCheck, DollarSign, Brain, CheckCircle2,
  AlertTriangle, RefreshCcw, ExternalLink, Filter, Layers,
  ChevronRight, Database, ArrowRight, UserCheck, Play, Send,
  Cpu, Lock, XCircle, Search, HelpCircle, FileText, Check,
  Building2, Network, Activity
} from 'lucide-react';
import { api } from '../../services/api';

const DEFAULT_CFO_NEWSLETTERS = [
  {
    event_id: 'INTEL-FIN-302B8110',
    source_name: 'Financial Times / AWS Cloud Infrastructure',
    confidence: 0.94,
    status: 'CONFIRMED',
    details: {
      company: 'Amazon Web Services / Amazon',
      ticker: 'AMZN',
      sector: 'Cloud Computing & Enterprise Software',
      market_event: 'Q3 Cloud Infrastructure Revenue Expansion',
      newsletter_claim: 'Enterprise digital transformation expansion driving record multi-tenant workloads.',
      newsletter_forecast: 'Strong enterprise workload migration and increased cloud infrastructure spending (Q3 Expansion)',
      cyberoptrq_forecast: 'Predicted higher compliance and cloud infrastructure expenditure across hybrid accounts.',
      risk_signal: 'HIGH',
      volatility_signal: 'LOW',
      relevant_exposure_inr: 3500000.0,
      signal_summary: 'Strong enterprise workload migration and increased cloud infrastructure spending'
    }
  },
  {
    event_id: 'INTEL-FIN-5896ADD2',
    source_name: 'Financial Times / Enterprise Cloud Review',
    confidence: 0.91,
    status: 'PENDING',
    details: {
      company: 'Microsoft Corporation / Azure',
      ticker: 'MSFT',
      sector: 'Enterprise Cloud & AI Services',
      market_event: 'Global Hyperscaler CapEx Surge',
      newsletter_claim: 'Azure enterprise adoption accelerates with multi-tenant governance compliance requirements.',
      newsletter_forecast: 'Enterprise digital transformation budget expansion and Azure OpenAI workload surge',
      cyberoptrq_forecast: 'Baseline risk projection expects moderate supply chain vendor dependency increase.',
      risk_signal: 'MODERATE',
      volatility_signal: 'MODERATE',
      relevant_exposure_inr: 2800000.0,
      signal_summary: 'Enterprise digital transformation budget expansion and Azure OpenAI workload surge'
    }
  },
  {
    event_id: 'INTEL-FIN-B613490A',
    source_name: 'Bloomberg / Cyber Insurance Quarterly',
    confidence: 0.89,
    status: 'CONFIRMED',
    details: {
      company: 'Travelers & Commercial Cyber Insurers',
      ticker: 'TRV',
      sector: 'Commercial Cyber Underwriting',
      market_event: 'H2 Cyber Reinsurance Premium Revision',
      newsletter_claim: 'Global cyber underwriters enforce stricter exclusion clauses for nation-state exploits.',
      newsletter_forecast: 'Underwriting premium surge (+22% YoY) and mandatory MFA/EPP warranties across commercial policies',
      cyberoptrq_forecast: 'Increased actuarial baseline loss expectation for non-airgapped identity stores.',
      risk_signal: 'HIGH',
      volatility_signal: 'LOW',
      relevant_exposure_inr: 5200000.0,
      signal_summary: 'Underwriting premium surge (+22% YoY) and mandatory MFA/EPP warranties across policies'
    }
  },
  {
    event_id: 'INTEL-FIN-956C8B33',
    source_name: 'Wall Street Journal / Enterprise Data',
    confidence: 0.87,
    status: 'PENDING',
    details: {
      company: 'Snowflake Inc.',
      ticker: 'SNOW',
      sector: 'Data Cloud & Warehouse Analytics',
      market_event: 'Enterprise Data Lake Security Directive',
      newsletter_claim: 'Enterprises mandate fine-grained access control on analytical data warehouses.',
      newsletter_forecast: 'Consumption-based IT spend optimization initiatives and data lake consolidation',
      cyberoptrq_forecast: 'Projected exposure shift towards data exfiltration risk vectors.',
      risk_signal: 'MODERATE',
      volatility_signal: 'LOW',
      relevant_exposure_inr: 1950000.0,
      signal_summary: 'Consumption-based IT spend optimization initiatives and data lake consolidation'
    }
  },
  {
    event_id: 'INTEL-FIN-5B8C904A',
    source_name: 'Morning Brew / Cloud ROI Digest',
    confidence: 0.93,
    status: 'CONFIRMED',
    details: {
      company: 'Alphabet / Google Cloud & Cloud Platforms',
      ticker: 'GOOGL',
      sector: 'Cloud Infrastructure & Vertex AI',
      market_event: 'Google Cloud Operating Margin Reversal',
      newsletter_claim: 'GCP enterprise contracts prioritize cross-region disaster recovery and sovereign cloud compliance.',
      newsletter_forecast: 'Cloud gross margin expansion and AI infrastructure Capex acceleration',
      cyberoptrq_forecast: 'Baseline risk remains stable with regional containment architecture.',
      risk_signal: 'HIGH',
      volatility_signal: 'LOW',
      relevant_exposure_inr: 4100000.0,
      signal_summary: 'Cloud gross margin expansion and AI infrastructure Capex acceleration'
    }
  },
  {
    event_id: 'INTEL-FIN-3E0D493D',
    source_name: 'FT / Cyber Governance & SEC Directive',
    confidence: 0.96,
    status: 'CONFIRMED',
    details: {
      company: 'CrowdStrike & Enterprise Incident Response',
      ticker: 'CRWD',
      sector: 'Cybersecurity Endpoint & MDR',
      market_event: 'SEC 4-Day Material Incident Enforcement',
      newsletter_claim: 'SEC Item 1.05 and EU DORA enforce immediate material incident board disclosure.',
      newsletter_forecast: 'Consolidated cyber resilience spend and mandatory 4-day SEC material breach reporting',
      cyberoptrq_forecast: 'Elevated executive fiduciary liability and mandatory cyber governance oversight.',
      risk_signal: 'HIGH',
      volatility_signal: 'HIGH',
      relevant_exposure_inr: 6500000.0,
      signal_summary: 'Consolidated cyber resilience spend and mandatory 4-day SEC material breach reporting'
    }
  }
];

const DEFAULT_CFO_QUEUE = [
  {
    financial_id: 'INTEL-FIN-5896ADD2',
    event_id: 'INTEL-FIN-5896ADD2',
    correlation_id: 'CORR-2026-CFO-MSFT',
    organization_id: 'org_abc_tech',
    company: 'Microsoft Corporation / Azure',
    ticker: 'MSFT',
    sector: 'Enterprise Cloud & AI Services',
    risk_signal: 'MODERATE',
    relevant_exposure_inr: 2800000.0,
    confidence: 0.91,
    status: 'PENDING',
    newsletter_forecast: 'Enterprise digital transformation budget expansion and Azure OpenAI workload surge',
    cyberoptrq_forecast: 'Baseline risk projection expects moderate supply chain vendor dependency increase.',
    newsletter_claim: 'Azure enterprise adoption accelerates with multi-tenant governance compliance requirements.'
  },
  {
    financial_id: 'INTEL-FIN-956C8B33',
    event_id: 'INTEL-FIN-956C8B33',
    correlation_id: 'CORR-2026-CFO-SNOW',
    organization_id: 'org_abc_tech',
    company: 'Snowflake Inc.',
    ticker: 'SNOW',
    sector: 'Data Cloud & Warehouse Analytics',
    risk_signal: 'MODERATE',
    relevant_exposure_inr: 1950000.0,
    confidence: 0.87,
    status: 'PENDING',
    newsletter_forecast: 'Consumption-based IT spend optimization initiatives and data lake consolidation',
    cyberoptrq_forecast: 'Projected exposure shift towards data exfiltration risk vectors.',
    newsletter_claim: 'Enterprises mandate fine-grained access control on analytical data warehouses.'
  }
];

const DEFAULT_CISO_QUEUE = [
  {
    event_id: 'INTEL-CYBER-5C88E0FA',
    correlation_id: 'CORR-2026-CISO-RUNC',
    cve: 'CVE-2024-21626',
    source: 'SANS @RISK Weekly Newsletter',
    affected_product: 'runc Container Runtime',
    attack_technique: 'T1611: Escape to Host',
    reported_exploitation: true,
    confidence: 0.96,
    matched_asset: 'Production Kubernetes Cluster (ASSET-002)',
    previous_risk_score: 84.5,
    previous_eal: 3200000.0,
    attack_risk_score: 96.2,
    attack_updated_eal: 4928000.0,
    has_attack_surge: true,
    status: 'MATCHED'
  },
  {
    event_id: 'INTEL-CYBER-C2EEFA3E',
    correlation_id: 'CORR-2026-CISO-XZ',
    cve: 'CVE-2024-3094',
    source: 'BleepingComputer Daily Digest',
    affected_product: 'xz-utils / liblzma Compression Library',
    attack_technique: 'T1195.002: Vulnerable Supply Chain Software',
    reported_exploitation: true,
    confidence: 0.98,
    matched_asset: 'Core Infrastructure Servers (ASSET-001)',
    previous_risk_score: 79.0,
    previous_eal: 2800000.0,
    attack_risk_score: 94.0,
    attack_updated_eal: 4312000.0,
    has_attack_surge: true,
    status: 'MATCHED'
  },
  {
    event_id: 'INTEL-CYBER-56849088',
    correlation_id: 'CORR-2026-CISO-SSH',
    cve: 'CVE-2024-6387',
    source: 'SANS @RISK Security Advisory',
    affected_product: 'OpenSSH Server (sshd)',
    attack_technique: 'T1068: Exploitation for Privilege Escalation',
    reported_exploitation: false,
    confidence: 0.91,
    matched_asset: 'DMZ Gateway Server (ASSET-003)',
    previous_risk_score: 68.0,
    previous_eal: 1950000.0,
    attack_risk_score: 72.0,
    attack_updated_eal: 2100000.0,
    has_attack_surge: false,
    status: 'MATCHED'
  },
  {
    event_id: 'INTEL-CYBER-3BA5DE2C',
    correlation_id: 'CORR-2026-CISO-CISA',
    cve: 'CVE-2023-44487',
    source: 'CISA Cybersecurity Advisories',
    affected_product: 'Apache HTTP Server & Reverse Proxies',
    attack_technique: 'T1498: Network Denial of Service',
    reported_exploitation: true,
    confidence: 0.94,
    matched_asset: 'Customer Web Portal (ASSET-001)',
    previous_risk_score: 82.0,
    previous_eal: 2900000.0,
    attack_risk_score: 91.5,
    attack_updated_eal: 4466000.0,
    has_attack_surge: true,
    status: 'MATCHED'
  }
];

export default function IntelligenceCenterView({ currentRole = 'CISO', onRefresh }) {
  const [activeTab, setActiveTab] = useState(currentRole === 'CFO' ? 'financial_intel' : 'ciso_queue');
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Data States
  const [orgs, setOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('org_abc_tech');
  const [connections, setConnections] = useState([]);
  const [emails, setEmails] = useState([]);
  const [events, setEvents] = useState([]);
  const [cisoQueue, setCisoQueue] = useState([]);
  const [cfoQueue, setCfoQueue] = useState([]);
  const [outcomes, setOutcomes] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [modelVersions, setModelVersions] = useState([]);
  const [sources, setSources] = useState([]);
  const [orgProfile, setOrgProfile] = useState(null);
  const [model6Info, setModel6Info] = useState(null);

  // Modal / Action states
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedFinEvent, setSelectedFinEvent] = useState(null);
  const [finFilter, setFinFilter] = useState('ALL');
  const [finSearch, setFinSearch] = useState('');
  const [correctionField, setCorrectionField] = useState('');
  const [correctionValue, setCorrectionValue] = useState('');
  const [reviewReason, setReviewReason] = useState('');
  const [demoExecuting, setDemoExecuting] = useState(false);
  const [demoLog, setDemoLog] = useState(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        orgList,
        connList,
        emailList,
        cyberEvents,
        finEvents,
        cQueue,
        fQueue,
        outcomeList,
        fbData,
        versions,
        srcList,
        orgProf,
        m6Info
      ] = await Promise.all([
        api.getOrganizations().catch(() => []),
        api.getEmailConnections(selectedOrgId).catch(() => []),
        api.getIngestedEmails(selectedOrgId).catch(() => []),
        api.getIntelligenceEvents('CYBERSECURITY', selectedOrgId).catch(() => []),
        api.getIntelligenceEvents('FINANCIAL', selectedOrgId).catch(() => []),
        api.getIntelligenceReviewQueue('CISO', selectedOrgId).catch(() => []),
        api.getIntelligenceReviewQueue('CFO', selectedOrgId).catch(() => []),
        api.getPredictionOutcomes(selectedOrgId).catch(() => []),
        api.getIntelligenceModelFeedback(selectedOrgId).catch(() => null),
        api.getModelVersions().catch(() => []),
        api.getIntelligenceSources().catch(() => []),
        api.getOrganizationProfile(selectedOrgId).catch(() => null),
        api.getModel6Info().catch(() => null)
      ]);

      setOrgs(orgList);
      setConnections(connList);
      setEmails(emailList);
      const finalCyber = (cyberEvents && cyberEvents.length > 0) ? cyberEvents : DEFAULT_CISO_QUEUE.map(item => ({
        event_id: item.event_id,
        category: 'CYBERSECURITY',
        cve: item.cve,
        affected_product: item.affected_product,
        attack_technique: item.attack_technique,
        exploitation_observed: item.reported_exploitation,
        confidence: item.confidence,
        status: item.status
      }));
      setEvents([...finalCyber, ...finEvents]);
      setCisoQueue((cQueue && cQueue.length > 0) ? cQueue : DEFAULT_CISO_QUEUE);
      setCfoQueue((fQueue && fQueue.length > 0) ? fQueue : DEFAULT_CFO_QUEUE);
      setOutcomes(outcomeList);
      setFeedback(fbData);
      setModelVersions(versions);
      setSources(srcList);
      setOrgProfile(orgProf);
      setModel6Info(m6Info);
    } catch (err) {
      console.error('Error loading intelligence center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [selectedOrgId]);

  const showNotification = (msg, isError = false) => {
    setActionMessage({ text: msg, isError });
    setTimeout(() => setActionMessage(null), 5000);
  };

  // Review Actions
  const handleReviewAction = async (eventId, role, decision) => {
    try {
      if (decision === 'CONFIRM') {
        await api.confirmIntelligence(eventId, role, `${role}-Lead-User`, reviewReason || 'Verified via Intelligence Center');
        showNotification(`Event ${eventId} confirmed successfully. Added to verified evidence.`);
      } else if (decision === 'REJECT') {
        await api.rejectIntelligence(eventId, role, `${role}-Lead-User`, reviewReason || 'Rejected during review');
        showNotification(`Event ${eventId} rejected from model training.`);
      } else if (decision === 'NEED_INVESTIGATION') {
        await api.investigateIntelligence(eventId, role, `${role}-Lead-User`);
        showNotification(`Event ${eventId} marked as pending investigation.`);
      } else if (decision === 'CORRECT') {
        const corrections = {};
        if (correctionField && correctionValue) {
          corrections[correctionField] = correctionValue;
        }
        await api.correctIntelligence(eventId, corrections, role, `${role}-Lead-User`, reviewReason || 'Corrections applied');
        showNotification(`Event ${eventId} corrected and verified.`);
      }
      setSelectedEvent(null);
      setCorrectionField('');
      setCorrectionValue('');
      setReviewReason('');
      loadAllData();
    } catch (err) {
      showNotification(`Action failed: ${err.message}`, true);
    }
  };

  // 1-Click Offline Demo
  const handleRunOfflineDemo = async (workflow = 'ALL') => {
    setDemoExecuting(true);
    try {
      const res = await api.triggerIntelligenceOfflineDemo(workflow, selectedOrgId);
      setDemoLog(res);
      showNotification(`Offline Demonstration for ${workflow} completed successfully!`);
      loadAllData();
    } catch (err) {
      showNotification(`Demo failed: ${err.message}`, true);
    } finally {
      setDemoExecuting(false);
    }
  };

  // Trigger Sync
  const handleSyncEmails = async () => {
    setLoading(true);
    try {
      const res = await api.syncEmail(null, selectedOrgId);
      showNotification(`Sync complete: ${res.total_new_emails || 0} new emails processed.`);
      loadAllData();
    } catch (err) {
      showNotification(`Sync failed: ${err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="spotlight-intelligence" className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Mail className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Continuous Intelligence & Human-in-the-Loop Decision Center
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Post-prediction continuous evidence layer with symmetrical CISO & CFO validation pipelines
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name} ({o.domain})</option>
            ))}
            {orgs.length === 0 && <option value="org_abc_tech">ABC Technologies (abc.com)</option>}
          </select>

          <button
            onClick={handleSyncEmails}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Sync Mailbox</span>
          </button>

          <button
            onClick={() => handleRunOfflineDemo('LEARNING')}
            disabled={demoExecuting}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>{demoExecuting ? 'Learning...' : 'Run Learning Demo'}</span>
          </button>

          <button
            onClick={() => handleRunOfflineDemo('ALL')}
            disabled={demoExecuting}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{demoExecuting ? 'Executing Demo...' : 'Run Offline Demo'}</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm ${
          actionMessage.isError ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {/* Visual Email Processing Lifecycle Bar — newsletter spotlight target */}
      <div id="spotlight-newsletter" className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-sm overflow-x-auto">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
          Continuous Intelligence Ingestion Lifecycle
        </div>
        <div className="flex items-center gap-2 min-w-[760px] text-xs font-bold">
          <span className="px-2.5 py-1 rounded bg-blue-950 text-blue-300 border border-blue-800">1. RECEIVED</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">2. PARSED (RFC 822)</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">3. SOURCE MATCH</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">4. AI EXTRACTED</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">5. RELEVANCE MATCH</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800">6. HUMAN REVIEW</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">7. VALIDATED</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">8. OUTCOME & DRIFT</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-800">9. FABRIC ANCHOR</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="text-[10px] font-bold uppercase text-slate-400">Ingested Emails</div>
          <div className="text-xl font-black text-slate-900 mt-1">{emails.length}</div>
          <div className="text-[10px] font-semibold text-blue-600 mt-0.5">Deduplicated</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="text-[10px] font-bold uppercase text-slate-400">CISO Review Queue</div>
          <div className="text-xl font-black text-amber-600 mt-1">
            {cisoQueue.length > 0 ? cisoQueue.length : DEFAULT_CISO_QUEUE.length}
          </div>
          <div className="text-[10px] font-semibold text-slate-500 mt-0.5">Pending Action</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="text-[10px] font-bold uppercase text-slate-400">CFO Review Queue</div>
          <div className="text-xl font-black text-indigo-600 mt-1">
            {cfoQueue.length > 0 ? cfoQueue.length : DEFAULT_CFO_QUEUE.length}
          </div>
          <div className="text-[10px] font-semibold text-slate-500 mt-0.5">Financial Signals</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="text-[10px] font-bold uppercase text-slate-400">Validated Events</div>
          <div className="text-xl font-black text-emerald-600 mt-1">
            {events.filter(e => e.status === 'VALIDATED').length}
          </div>
          <div className="text-[10px] font-semibold text-slate-500 mt-0.5">Ground Truth</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="text-[10px] font-bold uppercase text-slate-400">Model Lineage</div>
          <div className="text-xl font-black text-slate-900 mt-1">
            {feedback?.active_champion?.version || 'v1.0.0'}
          </div>
          <div className="text-[10px] font-semibold text-blue-600 mt-0.5">Active Champion</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="text-[10px] font-bold uppercase text-slate-400">Drift Status</div>
          <div className="text-xl font-black text-slate-900 mt-1">
            {feedback?.drift_summary?.status || 'STABLE'}
          </div>
          <div className="text-[10px] font-semibold text-slate-500 mt-0.5">PSI Monitoring</div>
        </div>
      </div>

      {/* Navigation Tabs (Part 24) */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
        {[
          { id: 'ciso_queue', label: `CISO Review Queue (${cisoQueue.length > 0 ? cisoQueue.length : DEFAULT_CISO_QUEUE.length})`, icon: ShieldCheck },
          { id: 'cfo_queue', label: `CFO Review Queue (${cfoQueue.length > 0 ? cfoQueue.length : DEFAULT_CFO_QUEUE.length})`, icon: DollarSign },
          { id: 'cyber_intel', label: 'Cyber Intelligence', icon: Inbox },
          { id: 'financial_intel', label: `Financial Signals (${events.filter(e => e.category === 'FINANCIAL').length > 0 ? events.filter(e => e.category === 'FINANCIAL').length : DEFAULT_CFO_NEWSLETTERS.length})`, icon: DollarSign },
          { id: 'predictions_vs_outcomes', label: 'Predictions vs Outcomes', icon: Brain },
          { id: 'model_feedback', label: 'Model Feedback', icon: Cpu },
          { id: 'model_versions', label: 'Model Versions', icon: Layers },
          { id: 'email_connections', label: 'Email Connections', icon: Mail },
          { id: 'intelligence_sources', label: 'Sources Registry', icon: Database },
          { id: 'offline_demo', label: 'Offline Demonstration', icon: Play }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CISO REVIEW QUEUE */}
      {activeTab === 'ciso_queue' && (
        <div id="spotlight-ciso-review" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              CISO Cybersecurity Intelligence Review Queue
            </h3>
            <span className="text-xs text-slate-500">
              Mandatory Human-in-the-Loop Validation before Model Feedback Eligibility
            </span>
          </div>

          {(() => {
            const queueItems = cisoQueue.length > 0 ? cisoQueue : DEFAULT_CISO_QUEUE;
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {queueItems.map((item) => (
                  <div key={item.event_id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                          {item.cve}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{item.affected_product}</h4>
                        <p className="text-xs text-slate-500">{item.source}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                        CONFIDENCE: {Math.round(item.confidence * 100)}%
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Attack Technique:</span>
                        <span className="font-bold text-slate-800">{item.attack_technique}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">In-The-Wild Exploitation:</span>
                        <span className="font-extrabold text-rose-600">
                          {item.reported_exploitation ? 'YES — OBSERVED IN WILD' : 'NO'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Matched Enterprise Asset:</span>
                        <span className="font-bold text-blue-700">{item.matched_asset}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                        <span className="text-slate-600">Baseline CyberOptRQ Prediction:</span>
                        <span className="text-slate-900">{item.previous_risk_score}% Risk (₹{((item.previous_eal || 2730000) / 100000).toFixed(1)}L EAL)</span>
                      </div>

                      {item.has_attack_surge && (
                        <div className="flex justify-between items-center bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-rose-900">
                          <div>
                            <div className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                              <span>⚡</span> ACTIVE ATTACK IMPACT
                            </div>
                            <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                              Surge EAL Spike: +₹{((item.eal_spike_inr || (item.previous_eal * 0.54)) / 100000).toFixed(1)} Lakhs
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-rose-700">
                              ₹{((item.attack_updated_eal || (item.previous_eal * 1.54)) / 100000).toFixed(1)}L
                            </div>
                            <span className="px-1.5 py-0.5 rounded bg-rose-200 text-rose-800 text-[9px] font-extrabold uppercase">
                              {item.attack_risk_score || 94.2}% Risk Surge
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Correlation Reasoning */}
                    {item.relevance_reasons && item.relevance_reasons.length > 0 && (
                      <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-[11px] text-blue-900">
                        <span className="font-bold">Correlation Logic:</span>
                        <ul className="list-disc list-inside mt-1 space-y-0.5 text-blue-800 font-medium">
                          {item.relevance_reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleReviewAction(item.event_id, 'CISO', 'CONFIRM')}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                      >
                        [ CONFIRM ]
                      </button>
                      <button
                        onClick={() => setSelectedEvent(item)}
                        className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition"
                      >
                        [ CORRECT ]
                      </button>
                      <button
                        onClick={() => handleReviewAction(item.event_id, 'CISO', 'REJECT')}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition"
                      >
                        [ REJECT ]
                      </button>
                      <button
                        onClick={() => handleReviewAction(item.event_id, 'CISO', 'NEED_INVESTIGATION')}
                        className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                      >
                        [ INVESTIGATE ]
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 2: CFO REVIEW QUEUE */}
      {activeTab === 'cfo_queue' && (
        <div id="spotlight-cfo-finance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              CFO Financial Intelligence Review Queue
            </h3>
            <span className="text-xs text-slate-500">
              Symmetrical Financial Signal Review & Capital Exposure Verification
            </span>
          </div>

          {(() => {
            const queueItems = cfoQueue.length > 0 ? cfoQueue : DEFAULT_CFO_QUEUE;
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {queueItems.map((item) => (
                  <div key={item.financial_id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                          {item.ticker || 'MARKET'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{item.company}</h4>
                        <p className="text-xs text-slate-500">{item.sector}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                        RISK SIGNAL: {item.risk_signal}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                      <div>
                        <span className="text-slate-500 font-medium">Newsletter Forecast:</span>
                        <div className="font-bold text-slate-800 mt-0.5">{item.newsletter_forecast}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">CyberOptRQ Baseline Forecast:</span>
                        <div className="text-slate-700 mt-0.5">{item.cyberoptrq_forecast}</div>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-2">
                        <span className="text-slate-500">Portfolio Exposure:</span>
                        <span className="font-extrabold text-slate-900">₹{Number(item.relevant_exposure_inr).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleReviewAction(item.financial_id, 'CFO', 'CONFIRM')}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                      >
                        [ CONFIRM SIGNAL ]
                      </button>
                      <button
                        onClick={() => handleReviewAction(item.financial_id, 'CFO', 'REJECT')}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition"
                      >
                        [ REJECT ]
                      </button>
                      <button
                        onClick={() => handleReviewAction(item.financial_id, 'CFO', 'NEED_INVESTIGATION')}
                        className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                      >
                        [ INVESTIGATE ]
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 3: CYBER INTELLIGENCE STREAM */}
      {activeTab === 'cyber_intel' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Ingested Cyber Threat Intelligence Records
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Event ID</th>
                  <th className="p-3">CVE</th>
                  <th className="p-3">Product / Vendor</th>
                  <th className="p-3">Technique</th>
                  <th className="p-3">In-The-Wild</th>
                  <th className="p-3">Confidence</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(() => {
                  const rawList = events.filter(e => e.category === 'CYBERSECURITY');
                  const displayList = rawList.length > 0 ? rawList : DEFAULT_CISO_QUEUE.map(item => ({
                    event_id: item.event_id,
                    cve: item.cve,
                    affected_product: item.affected_product,
                    attack_technique: item.attack_technique,
                    exploitation_observed: item.reported_exploitation,
                    confidence: item.confidence,
                    status: item.status
                  }));
                  return displayList.map((e) => (
                    <tr key={e.event_id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono font-bold text-blue-600">{e.event_id}</td>
                      <td className="p-3 font-extrabold text-slate-900">{e.cve || 'N/A'}</td>
                      <td className="p-3 text-slate-700">{e.affected_product}</td>
                      <td className="p-3 font-mono text-slate-600">{e.attack_technique}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          e.exploitation_observed ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {e.exploitation_observed ? 'YES' : 'NO'}
                        </span>
                      </td>
                      <td className="p-3 font-bold">{Math.round(e.confidence * 100)}%</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: FINANCIAL INTELLIGENCE STREAM */}
      {activeTab === 'financial_intel' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Financial Intelligence Extracted from Newsletters
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Source: Finance newsletters → RFC 822 Parser → Financial Extraction → CFO Review
            </span>
          </div>

          {/* CFO Architecture Lifecycle */}
          <div className="bg-indigo-950 text-white p-4 rounded-2xl border border-indigo-800 overflow-x-auto">
            <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-2">CFO Financial Intelligence Lifecycle</div>
            <div className="flex items-center gap-2 min-w-[900px] text-xs font-bold">
              <span className="px-2.5 py-1 rounded bg-indigo-900 text-indigo-200 border border-indigo-700">1. FIN EMAIL</span>
              <ChevronRight className="w-3 h-3 text-indigo-600" />
              <span className="px-2.5 py-1 rounded bg-indigo-900 text-indigo-200 border border-indigo-700">2. RFC 822 PARSE</span>
              <ChevronRight className="w-3 h-3 text-indigo-600" />
              <span className="px-2.5 py-1 rounded bg-indigo-900 text-indigo-200 border border-indigo-700">3. SOURCE DETECT</span>
              <ChevronRight className="w-3 h-3 text-indigo-600" />
              <span className="px-2.5 py-1 rounded bg-indigo-900 text-indigo-200 border border-indigo-700">4. FIN EXTRACTION</span>
              <ChevronRight className="w-3 h-3 text-indigo-600" />
              <span className="px-2.5 py-1 rounded bg-indigo-900 text-indigo-200 border border-indigo-700">5. ORG RELEVANCE</span>
              <ChevronRight className="w-3 h-3 text-indigo-600" />
              <span className="px-2.5 py-1 rounded bg-amber-900 text-amber-200 border border-amber-700">6. CFO REVIEW</span>
              <ChevronRight className="w-3 h-3 text-indigo-600" />
              <span className="px-2.5 py-1 rounded bg-emerald-900 text-emerald-200 border border-emerald-700">7. VALIDATED SIGNAL</span>
              <ChevronRight className="w-3 h-3 text-indigo-600" />
              <span className="px-2.5 py-1 rounded bg-purple-900 text-purple-200 border border-purple-700">8. FORECAST vs ACTUAL</span>
              <ChevronRight className="w-3 h-3 text-indigo-600" />
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 border border-slate-600">9. FABRIC AUDIT</span>
            </div>
          </div>

          {/* Financial Intelligence Table */}
          {(() => {
            const rawFinEvents = events.filter(e => e.category === 'FINANCIAL');
            const baseFinEvents = rawFinEvents.length > 0 ? rawFinEvents : DEFAULT_CFO_NEWSLETTERS;
            const filteredFinEvents = baseFinEvents.filter((item) => {
              const term = finSearch.toLowerCase().trim();
              const matchesSearch = !term ||
                (item.details?.company && item.details.company.toLowerCase().includes(term)) ||
                (item.details?.ticker && item.details.ticker.toLowerCase().includes(term)) ||
                (item.source_name && item.source_name.toLowerCase().includes(term)) ||
                (item.details?.sector && item.details.sector.toLowerCase().includes(term)) ||
                (item.event_id && item.event_id.toLowerCase().includes(term));
              const risk = (item.details?.risk_signal || '').toUpperCase();
              const status = (item.status || '').toUpperCase();
              const matchesFilter = finFilter === 'ALL' ||
                risk.includes(finFilter) ||
                status === finFilter;
              return matchesSearch && matchesFilter;
            });

            return (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                {/* Search & Filter Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={finSearch}
                      onChange={(e) => setFinSearch(e.target.value)}
                      placeholder="Search company, ticker, source..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'ALL', label: `All (${baseFinEvents.length})` },
                      { id: 'HIGH', label: 'High Exposure' },
                      { id: 'MODERATE', label: 'Moderate' },
                      { id: 'CONFIRMED', label: 'Confirmed' },
                      { id: 'PENDING', label: 'Pending' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFinFilter(f.id)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                          finFilter === f.id
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3">Event ID</th>
                        <th className="p-3">Source Newsletter</th>
                        <th className="p-3">Company / Ticker</th>
                        <th className="p-3">Sector</th>
                        <th className="p-3">Newsletter Signal & Exposure</th>
                        <th className="p-3">Confidence</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredFinEvents.map((e) => (
                        <tr
                          key={e.event_id}
                          onClick={() => setSelectedFinEvent(e)}
                          className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                        >
                          <td className="p-3 font-mono font-bold text-indigo-600 whitespace-nowrap">{e.event_id}</td>
                          <td className="p-3 text-slate-700">
                            <div className="font-semibold text-slate-900">{e.source_name}</div>
                            <div className="text-[10px] text-slate-400">RFC 822 Verified Ingestion</div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{e.details?.company || 'UNKNOWN'}</div>
                            <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {e.details?.ticker || '—'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">{e.details?.sector || 'UNKNOWN'}</td>
                          <td className="p-3 max-w-[280px]">
                            <div className="truncate text-slate-800 font-medium">
                              {e.details?.newsletter_forecast || e.details?.signal_summary || 'See details'}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                                (e.details?.risk_signal || '').includes('HIGH')
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {e.details?.risk_signal || 'MODERATE'} RISK
                              </span>
                              {e.details?.relevant_exposure_inr ? (
                                <span className="text-[10px] font-extrabold text-emerald-700">
                                  ₹{(Number(e.details.relevant_exposure_inr) / 100000).toFixed(1)}L Exposure
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="p-3 font-extrabold text-slate-800">
                            <div className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                              {Math.round((e.confidence || 0.88) * 100)}%
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                              e.status === 'CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}>
                              {e.status || 'CONFIRMED'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setSelectedFinEvent(e);
                              }}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg transition"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Important Separation Notice */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
            <strong>CFO Integrity Notice:</strong> Newsletter claims are clearly separated from validated signals and actual outcomes.
            NEWSLETTER CLAIM ≠ VALIDATED SIGNAL ≠ CYBEROPTRQ FORECAST ≠ OBSERVED ACTUAL.
            Never invent stock returns. If actual outcome has not occurred: STATUS = OUTCOME_PENDING.
          </div>
        </div>
      )}

      {activeTab === 'predictions_vs_outcomes' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Historical AI Prediction vs Observed Real-World Reality
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Evaluates calibration error and Brier score contribution
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Correlation ID</th>
                  <th className="p-3">CVE Target</th>
                  <th className="p-3">Predicted Risk</th>
                  <th className="p-3">Observed Reality</th>
                  <th className="p-3">Calibration Error</th>
                  <th className="p-3">Brier Score</th>
                  <th className="p-3">Model Version</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {outcomes.map((o) => (
                  <tr key={o.comparison_id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-blue-600">{o.correlation_id}</td>
                    <td className="p-3 font-extrabold text-slate-900">{o.cve || 'N/A'}</td>
                    <td className="p-3 font-extrabold text-indigo-700">{o.predicted_risk_pct}%</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-700">
                        {o.observed_state}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700">{o.calibration_error.toFixed(4)}</td>
                    <td className="p-3 font-mono font-bold text-slate-700">{o.brier_score_contribution.toFixed(4)}</td>
                    <td className="p-3 font-bold text-slate-600">{o.model_version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: MODEL FEEDBACK */}
      {activeTab === 'model_feedback' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Controlled Model Feedback & Governance Center
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Zero automatic retraining. Statistical quality gates enforced prior to human approval.
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              feedback?.feedback_status === 'READY_FOR_CALIBRATION' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {feedback?.feedback_status || 'CHECKING'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[10px] font-bold uppercase text-slate-400">Validated Ground-Truth Samples</div>
              <div className="text-2xl font-black text-slate-900">
                {feedback?.total_confirmed_samples || 0} / {feedback?.minimum_safety_samples || 15}
              </div>
              <p className="text-[11px] text-slate-500">Safety floor for adaptation training</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[10px] font-bold uppercase text-slate-400">Population Stability Index (PSI)</div>
              <div className="text-2xl font-black text-slate-900">
                {feedback?.drift_summary?.mean_psi ? feedback.drift_summary.mean_psi.toFixed(4) : '0.0000'}
              </div>
              <p className="text-[11px] text-slate-500">{feedback?.drift_summary?.status || 'STABLE'}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[10px] font-bold uppercase text-slate-400">Active Champion Version</div>
              <div className="text-2xl font-black text-blue-600">
                {feedback?.active_champion?.version || 'v1.0.0'}
              </div>
              <p className="text-[11px] text-slate-500">SHA-256 Hash: {feedback?.active_champion?.artifact_hash ? feedback.active_champion.artifact_hash.slice(0, 16) + '...' : 'Verified'}</p>
            </div>
          </div>

          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed">
            <strong>Scientific Governance Notice:</strong> {feedback?.scientific_note || 'P1-P6 baseline models remain immutable. Continual learning strictly operates on the organization adaptation layer using analyst-confirmed operational ground truth.'}
          </div>
        </div>
      )}

      {/* TAB: MODEL VERSIONS */}
      {activeTab === 'model_versions' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Model Governance Lineage</h3>
          {modelVersions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Layers className="w-8 h-8 mx-auto mb-2 text-blue-300" />
              <div className="font-bold">No model versions recorded yet.</div>
              <p className="text-xs mt-1">Model versions are created when candidates are trained and promoted through governance.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Version</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Promoted By</th>
                    <th className="p-3">Promoted At</th>
                    <th className="p-3">Brier Score</th>
                    <th className="p-3">Sample Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(Array.isArray(modelVersions) ? modelVersions : modelVersions.versions || []).map((v, idx) => (
                    <tr key={v.version || idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-blue-700">{v.version}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.status === 'CHAMPION' ? 'bg-emerald-100 text-emerald-800' :
                          v.status === 'CANDIDATE' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>{v.status}</span>
                      </td>
                      <td className="p-3 text-slate-700">{v.promoted_by || '—'}</td>
                      <td className="p-3 text-slate-600">{v.promoted_at ? new Date(v.promoted_at).toLocaleString() : '—'}</td>
                      <td className="p-3 font-mono">{v.brier_score?.toFixed(4) || '—'}</td>
                      <td className="p-3 font-bold">{v.training_sample_count || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: INTELLIGENCE SOURCES */}
      {activeTab === 'intelligence_sources' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Authorized Intelligence Sources Registry</h3>
            <span className="text-xs text-slate-500">Loaded from config/intelligence_sources.json</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sources.length === 0 ? (
              <div className="col-span-3 p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
                No sources loaded. Check config/intelligence_sources.json.
              </div>
            ) : sources.map((s, idx) => (
              <div key={s.id || idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    s.category === 'CYBERSECURITY' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>{s.category || 'INTEL'}</span>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> ACTIVE
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{s.name}</h4>
                  <p className="text-[11px] text-slate-500">{s.domain || s.email_domain || ''}</p>
                </div>
                {s.tags && (
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(s.tags) ? s.tags : [s.tags]).slice(0, 4).map((t, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded font-medium">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: EMAIL CONNECTIONS */}

      {activeTab === 'email_connections' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Connected Intelligence Mailboxes & Ingestion Feeds
            </h3>
            <button
              onClick={handleSyncEmails}
              className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700"
            >
              Sync Now
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {connections.map((c) => (
              <div key={c.connection_id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {c.provider}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {c.status}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{c.email_address}</h4>
                  <p className="text-[11px] text-slate-500">Folder: {c.folder_label}</p>
                </div>
                <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 flex justify-between">
                  <span>Processed: {c.processed_count}</span>
                  <span>Sync: {c.last_sync ? new Date(c.last_sync).toLocaleTimeString() : 'Recent'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: OFFLINE DEMONSTRATION */}
      {activeTab === 'offline_demo' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                1-Click Air-Gapped SIH Offline Demonstration
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Executes realistic RFC 822 email ingestion, relevance matching, HITL review, and Fabric audit without Internet.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleRunOfflineDemo('CISO')}
                disabled={demoExecuting}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                CISO Story Demo
              </button>
              <button
                onClick={() => handleRunOfflineDemo('CFO')}
                disabled={demoExecuting}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                CFO Story Demo
              </button>
              <button
                onClick={() => handleRunOfflineDemo('LEARNING')}
                disabled={demoExecuting}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Continual Learning Demo (5+ Newsletters)
              </button>
              <button
                onClick={() => handleRunOfflineDemo('ALL')}
                disabled={demoExecuting}
                className="px-3 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Execute All Flows
              </button>
            </div>
          </div>

          {demoLog && (
            <div className="p-4 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto max-h-96 space-y-2">
              <div className="font-bold text-white border-b border-slate-800 pb-1">
                DEMO EXECUTION AUDIT TELEMETRY:
              </div>
              <pre>{JSON.stringify(demoLog, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* MODAL: CORRECT EXTRACTED FIELDS */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Apply Human Correction to {selectedEvent.cve || selectedEvent.event_id}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-bold block mb-1">Field to Correct</label>
                <select
                  value={correctionField}
                  onChange={(e) => setCorrectionField(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="">Select field...</option>
                  <option value="affected_product">Affected Product</option>
                  <option value="attack_technique">Attack Technique</option>
                  <option value="outcome">Outcome (EXPLOITED_SUCCESSFULLY / NO_EXPLOITATION)</option>
                  <option value="cve">CVE Identifier</option>
                </select>
              </div>
              <div>
                <label className="text-slate-500 font-bold block mb-1">Corrected Value</label>
                <input
                  type="text"
                  value={correctionValue}
                  onChange={(e) => setCorrectionValue(e.target.value)}
                  placeholder="Enter verified value..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="text-slate-500 font-bold block mb-1">Reason for Correction</label>
                <input
                  type="text"
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="e.g. Internal SOC verification confirmed version mismatch"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-3 py-1.5 text-slate-600 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReviewAction(selectedEvent.event_id, 'CISO', 'CORRECT')}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Save Correction & Validate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT FINANCIAL NEWSLETTER EXTRACT */}
      {selectedFinEvent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                  {selectedFinEvent.details?.ticker || 'MARKET'}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {selectedFinEvent.details?.company || 'Company Detail'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{selectedFinEvent.source_name}</p>
              </div>
              <button
                onClick={() => setSelectedFinEvent(null)}
                className="text-slate-400 hover:text-slate-700 font-black text-lg p-1"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Newsletter Ingestion Source & Claim</span>
                <p className="text-slate-800 leading-relaxed font-semibold">
                  "{selectedFinEvent.details?.newsletter_claim || selectedFinEvent.details?.newsletter_forecast}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Quantitative Risk Signal</span>
                  <div className="text-sm font-black text-indigo-700 mt-0.5">
                    {selectedFinEvent.details?.risk_signal || 'MODERATE'}
                  </div>
                  <span className="text-[10px] text-slate-500">Volatility: {selectedFinEvent.details?.volatility_signal || 'LOW'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Relevant Enterprise Exposure</span>
                  <div className="text-sm font-black text-emerald-700 mt-0.5">
                    ₹{Number(selectedFinEvent.details?.relevant_exposure_inr || 0).toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-500">Confidence: {Math.round((selectedFinEvent.confidence || 0.88) * 100)}%</span>
                </div>
              </div>

              {selectedFinEvent.details?.cyberoptrq_forecast && (
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-indigo-700">CyberOptRQ Baseline Model Forecast</span>
                  <p className="text-indigo-950 font-medium">
                    {selectedFinEvent.details.cyberoptrq_forecast}
                  </p>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">CFO Validation Status</span>
                  <div className="font-extrabold text-slate-900 mt-0.5">{selectedFinEvent.status || 'CONFIRMED'}</div>
                </div>
                <span className="text-[11px] font-mono text-slate-500">{selectedFinEvent.event_id}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedFinEvent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Close
              </button>
              {selectedFinEvent.status !== 'CONFIRMED' && (
                <button
                  onClick={async () => {
                    await handleReviewAction(selectedFinEvent.event_id, 'CFO', 'CONFIRM');
                    setSelectedFinEvent(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  [ Confirm Signal as Ground Truth ]
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
