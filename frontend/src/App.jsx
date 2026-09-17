import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginView from './components/LoginView';
import InterTeamMessenger from './components/InterTeamMessenger';
import DashboardView from './components/views/DashboardView';
import DetectView from './components/views/DetectView';
import PredictView from './components/views/PredictView';
import QuantifyView from './components/views/QuantifyView';
import OptimizeRecommendView from './components/views/OptimizeRecommendView';
import ApproveView from './components/views/ApproveView';
import ExecuteView from './components/views/ExecuteView';
import VerifyRecalculateView from './components/views/VerifyRecalculateView';
import AuditView from './components/views/AuditView';
import BusinessValueView from './components/views/BusinessValueView';
import ThreatIntelView from './components/views/ThreatIntelView';
import ContinualLearningView from './components/views/ContinualLearningView';
import IntelligenceCenterView from './components/views/IntelligenceCenterView';

import { api } from './services/api';
import { WebSocketClient } from './services/websocket';
import { useUser, useClerk } from './components/ClerkAuth';
import { ShieldCheck, Eye, Database, Wrench, DollarSign } from 'lucide-react';

export default function App({ isClerkConfigured = true }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState('CISO');
  const [wsStatus, setWsStatus] = useState('DISCONNECTED');
  const [demoAuthenticated, setDemoAuthenticated] = useState(false);
  const [wsClientRef, setWsClientRef] = useState(null);
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);

  // Attack Mode & Demo Synchronization State
  const [attackState, setAttackState] = useState({ active: false, status: 'IDLE' });

  // Realtime Inter-Team Messages State with localStorage Persistence
  const [interTeamMessages, setInterTeamMessages] = useState(() => {
    const saved = localStorage.getItem('cyberopt_team_messages');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'MSG-INIT-1',
        sender_role: 'SOC Analyst',
        recipient_role: 'CISO',
        urgency: 'CRITICAL',
        title: 'Active CVE-2024-21626 Exploitation Flagged',
        body: 'CISA KEV confirms active wild exploitation vector on Customer Portal Cluster. Requesting EAL quantification & control approval.',
        timestamp: '14:20',
        target_tab: 'ai_quantification'
      },
      {
        id: 'MSG-INIT-2',
        sender_role: 'CISO',
        recipient_role: 'IT Remediation Team',
        urgency: 'WARNING',
        title: 'Approved Control Execution Directive',
        body: 'REC-001 (Zero-Trust Microsegmentation) approved for implementation. Please deploy controls.',
        timestamp: '14:25',
        target_tab: 'execution'
      }
    ];
  });

  // Persist messages whenever updated
  useEffect(() => {
    localStorage.setItem('cyberopt_team_messages', JSON.stringify(interTeamMessages));
  }, [interTeamMessages]);

  // Clerk hooks
  const { isSignedIn, isLoaded, user } = useUser();
  const { signOut } = useClerk();

  // Role default tab helper
  const handleRoleSelect = (roleKey) => {
    setCurrentRole(roleKey);
    if (roleKey === 'CISO') setActiveTab('dashboard');
    if (roleKey === 'CFO') setActiveTab('intelligence');
    if (roleKey === 'SOC') setActiveTab('threat_intel');
    if (roleKey === 'Security') setActiveTab('ai_quantification');
    if (roleKey === 'IT') setActiveTab('execution');
  };

  // Keep role in sync if Clerk user object contains role
  useEffect(() => {
    if (user?.role) {
      handleRoleSelect(user.role);
    }
  }, [user]);

  // Data states
  const [overview, setOverview] = useState(null);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [assets, setAssets] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [controls, setControls] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [auditBlocks, setAuditBlocks] = useState([]);

  const reloadData = async () => {
    try {
      const [ov, vul, ass, inc, ctrl, rec, blk] = await Promise.all([
        api.getQuantificationOverview().catch(() => null),
        api.getPublicVulnerabilities().catch(() => []),
        api.getEnterpriseAssets().catch(() => []),
        api.getIncidentHistory().catch(() => []),
        api.getSecurityControls().catch(() => []),
        api.getRecommendations().catch(() => []),
        api.getAuditBlocks().catch(() => [])
      ]);
      setOverview(ov);
      setVulnerabilities(vul);
      setAssets(ass);
      setIncidents(inc);
      setControls(ctrl);
      setRecommendations(rec);
      setAuditBlocks(blk);
    } catch (e) {
      console.error("Error loading application data:", e);
    }
  };

  useEffect(() => {
    reloadData();

    // Check demo attack state immediately
    api.getDemoAttackState().then((state) => {
      if (state) {
        setAttackState({
          active: state.active || state.status === 'ATTACK_STARTED',
          status: state.status,
          correlation_id: state.correlation_id,
          scenario: state.scenario,
          organization_id: state.organization_id,
          asset_id: state.asset_id,
          started_at: state.started_at,
          pipeline: state.pipeline || null,
        });
      }
    }).catch(() => {});

    // Fast polling interval (1.2s) as ultra-resilient sync fallback
    const interval = setInterval(() => {
      api.getDemoAttackState().then((state) => {
        if (state) {
          setAttackState((prev) => {
            if (prev.status !== state.status || prev.correlation_id !== state.correlation_id) {
              const isNowActive = state.active || state.status === 'ATTACK_STARTED';
              if (isNowActive && !prev.active) {
                console.log(`[DASHBOARD] ATTACK_STARTED received via polling: correlation_id=${state.correlation_id}`);
                console.log(`[DASHBOARD] Entering ATTACK MODE: Target Asset=${state.asset_id}`);
                setActiveTab('dashboard');
                reloadData();
              } else if (!isNowActive && prev.active) {
                console.log('[DASHBOARD] Attack completed/reset detected via polling');
                reloadData();
              }
              return {
                active: isNowActive,
                status: state.status,
                correlation_id: state.correlation_id,
                scenario: state.scenario,
                organization_id: state.organization_id,
                asset_id: state.asset_id,
                started_at: state.started_at,
                pipeline: state.pipeline || prev.pipeline,
              };
            }
            return prev;
          });
        }
      }).catch(() => {});
    }, 1200);

    const client = new WebSocketClient(
      (newEvent) => {
        if (newEvent.event_type === 'ATTACK_STARTED' || newEvent.status === 'ATTACK_STARTED') {
          console.log(`[DASHBOARD] ATTACK_STARTED received via WebSocket: correlation_id=${newEvent.correlation_id}`);
          console.log(`[DASHBOARD] Entering ATTACK MODE: Target Asset=${newEvent.asset_id || 'ASSET-001'}`);
          setAttackState({
            active: true,
            status: 'ATTACK_STARTED',
            correlation_id: newEvent.correlation_id,
            scenario: newEvent.scenario,
            organization_id: newEvent.organization_id,
            asset_id: newEvent.asset_id,
            started_at: newEvent.timestamp || newEvent.started_at,
            pipeline: newEvent.pipeline || null,
          });
          setActiveTab('dashboard');
          reloadData();
        } else if (newEvent.event_type === 'ATTACK_COMPLETED' || newEvent.status === 'ATTACK_COMPLETED') {
          console.log(`[DASHBOARD] ATTACK_COMPLETED received: correlation_id=${newEvent.correlation_id}`);
          setAttackState((prev) => ({
            ...prev,
            active: false,
            status: 'ATTACK_COMPLETED',
            pipeline: prev.pipeline ? { ...prev.pipeline, status: 'REMEDIATED' } : null
          }));
          reloadData();
        } else if (newEvent.event_type === 'DEMO_RESET' || newEvent.status === 'IDLE') {
          console.log('[DASHBOARD] DEMO_RESET received - restoring baseline state');
          setAttackState({ active: false, status: 'IDLE', pipeline: null });
          reloadData();
        } else if (newEvent.event_type === 'INTER_TEAM_MESSAGE') {
          setInterTeamMessages((prev) => [newEvent, ...prev.filter(m => m.id !== newEvent.id)]);
        } else {
          reloadData();
        }
      },
      (status) => setWsStatus(status)
    );
    client.connect();
    setWsClientRef(client);

    return () => {
      clearInterval(interval);
      client.disconnect();
    };
  }, []);

  const handleSendMessage = (msgObj) => {
    setInterTeamMessages((prev) => [msgObj, ...prev.filter(m => m.id !== msgObj.id)]);
    if (wsClientRef && wsClientRef.ws && wsClientRef.ws.readyState === WebSocket.OPEN) {
      wsClientRef.ws.send(JSON.stringify(msgObj));
    }
  };

  const handleSignOut = () => {
    if (signOut) signOut();
    setDemoAuthenticated(false);
  };

  const isAuthenticated = isSignedIn || demoAuthenticated;

  if (!isAuthenticated) {
    return (
      <LoginView
        onSelectRole={handleRoleSelect}
        onBypassDemo={() => setDemoAuthenticated(true)}
        isClerkConfigured={isClerkConfigured}
      />
    );
  }

  // Role-Tailored Top Workspace Config
  const roleBanners = {
    CISO: {
      title: "CISO Executive Workspace",
      icon: ShieldCheck,
      color: "border-slate-200 bg-white"
    },
    CFO: {
      title: "CFO Financial Intelligence & Capital Allocation",
      icon: DollarSign,
      color: "border-slate-200 bg-white"
    },
    SOC: {
      title: "SOC Operations Center",
      icon: Database,
      color: "border-slate-200 bg-white"
    },
    Security: {
      title: "Security Architecture & Modeling",
      icon: Eye,
      color: "border-slate-200 bg-white"
    },
    IT: {
      title: "IT Remediation & SecOps",
      icon: Wrench,
      color: "border-slate-200 bg-white"
    }
  };

  const activeBanner = roleBanners[currentRole] || roleBanners.CISO;
  const BannerIcon = activeBanner.icon;

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            overview={overview}
            onNavigate={setActiveTab}
            recommendations={recommendations}
            onRefresh={reloadData}
            attackState={attackState}
            onCompleteAttack={async (corrId) => {
              await api.completeAttackDemo(corrId);
              setAttackState((prev) => ({ ...prev, active: false, status: 'ATTACK_COMPLETED' }));
              reloadData();
            }}
          />
        );
      case 'threat_intel':
        return <ThreatIntelView />;
      case 'continual_learning':
        return <ContinualLearningView />;
      case 'vulnerabilities':
      case 'asset_inventory':
      case 'ai_risk':
      case 'incidents':
        return (
          <DetectView
            vulnerabilities={vulnerabilities}
            assets={assets}
            incidents={incidents}
            controls={controls}
          />
        );
      case 'ai_quantification':
        return (
          <div className="space-y-6">
            <PredictView assets={assets} vulnerabilities={vulnerabilities} />
            <QuantifyView overview={overview} />
          </div>
        );
      case 'model_evidence':
        return (
          <PredictView assets={assets} vulnerabilities={vulnerabilities} />
        );
      case 'optimizer':
      case 'recommendations':
        return (
          <OptimizeRecommendView
            recommendations={recommendations}
            onNavigate={setActiveTab}
          />
        );
      case 'approvals':
        return (
          <ApproveView
            recommendations={recommendations}
            currentRole={currentRole}
            onRefresh={reloadData}
          />
        );
      case 'execution':
      case 'approved_controls':
      case 'tracking':
        return (
          <ExecuteView
            recommendations={recommendations}
            currentRole={currentRole}
            onRefresh={reloadData}
          />
        );
      case 'recalculate':
        return (
          <VerifyRecalculateView
            recommendations={recommendations}
            onRefresh={reloadData}
          />
        );
      case 'audit':
        return (
          <AuditView
            auditBlocks={auditBlocks}
            onRefresh={reloadData}
          />
        );
      case 'business_value':
        return <BusinessValueView />;
      case 'intelligence':
        return <IntelligenceCenterView currentRole={currentRole} onRefresh={reloadData} />;
      default:
        return (
          <DashboardView
            overview={overview}
            onNavigate={setActiveTab}
            recommendations={recommendations}
            onRefresh={reloadData}
            attackState={attackState}
            onCompleteAttack={async (corrId) => {
              await api.completeAttackDemo(corrId);
              setAttackState((prev) => ({ ...prev, active: false, status: 'ATTACK_COMPLETED' }));
              reloadData();
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 relative">
      <Header
        currentRole={currentRole}
        wsStatus={wsStatus}
        onSignOut={handleSignOut}
        isClerkConfigured={isClerkConfigured}
        onToggleMessenger={() => setIsMessengerOpen(!isMessengerOpen)}
        unreadMessageCount={interTeamMessages.length}
      />
      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentRole={currentRole} />
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
          {/* Role-Tailored Custom Interface Banner */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 text-blue-600">
                <BannerIcon className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">{activeBanner.title}</h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 font-medium text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200/60">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
              <span>Active</span>
            </div>
          </div>

          {renderActiveView()}
        </main>
      </div>

      {/* On-Demand Cross-Role Inter-Team Communication Drawer */}
      <InterTeamMessenger
        currentRole={currentRole}
        messages={interTeamMessages}
        onSendMessage={handleSendMessage}
        onNavigate={setActiveTab}
        isOpen={isMessengerOpen}
        onClose={() => setIsMessengerOpen(false)}
      />
    </div>
  );
}
