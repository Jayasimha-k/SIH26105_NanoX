import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardView from './components/views/DashboardView';
import VulnerabilitiesView from './components/views/VulnerabilitiesView';
import AssetsView from './components/views/AssetsView';
import AIPredictionsView from './components/views/AIPredictionsView';
import FinancialRiskView from './components/views/FinancialRiskView';
import ControlsView from './components/views/ControlsView';
import OptimizerView from './components/views/OptimizerView';
import WhatIfView from './components/views/WhatIfView';
import RecommendationsView from './components/views/RecommendationsView';
import ApprovalsView from './components/views/ApprovalsView';
import RealtimeView from './components/views/RealtimeView';
import ExecutionView from './components/views/ExecutionView';
import AuditView from './components/views/AuditView';
import ModelPerformanceView from './components/views/ModelPerformanceView';
import PlugAndPlayConfigView from './components/views/PlugAndPlayConfigView';
import { api } from './services/api';
import { WebSocketClient } from './services/websocket';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState('CISO');
  const [wsStatus, setWsStatus] = useState('DISCONNECTED');
  const [eventLog, setEventLog] = useState([]);

  // Data states
  const [overview, setOverview] = useState(null);
  const [assets, setAssets] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [controls, setControls] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [auditBlocks, setAuditBlocks] = useState([]);
  const [mlMetadata, setMlMetadata] = useState(null);

  const reloadData = async () => {
    try {
      const [ov, ass, vul, ctrl, rec, blk, meta] = await Promise.all([
        api.getRiskOverview().catch(() => null),
        api.getAssets().catch(() => []),
        api.getVulnerabilities().catch(() => []),
        api.getSecurityControls().catch(() => []),
        api.getRecommendations().catch(() => []),
        api.getAuditBlocks().catch(() => []),
        api.getMLModelMetadata().catch(() => null)
      ]);
      setOverview(ov);
      setAssets(ass);
      setVulnerabilities(vul);
      setControls(ctrl);
      setRecommendations(rec);
      setAuditBlocks(blk);
      setMlMetadata(meta);
    } catch (e) {
      console.error("Error loading application data:", e);
    }
  };

  useEffect(() => {
    reloadData();

    // Initialize WebSocket listener
    const wsClient = new WebSocketClient(
      (newEvent) => {
        setEventLog((prev) => [newEvent, ...prev]);
        reloadData(); // Refresh state on real-time events
      },
      (status) => setWsStatus(status)
    );
    wsClient.connect();

    return () => wsClient.disconnect();
  }, []);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView overview={overview} onNavigate={setActiveTab} />;
      case 'vulnerabilities':
        return <VulnerabilitiesView vulnerabilities={vulnerabilities} />;
      case 'assets':
        return <AssetsView assets={assets} />;
      case 'predictions':
        return <AIPredictionsView assets={assets} vulnerabilities={vulnerabilities} />;
      case 'financial':
        return <FinancialRiskView overview={overview} assets={assets} />;
      case 'controls':
        return <ControlsView controls={controls} />;
      case 'optimizer':
        return <OptimizerView controls={controls} />;
      case 'whatif':
        return <WhatIfView controls={controls} />;
      case 'recommendations':
        return <RecommendationsView recommendations={recommendations} onNavigate={setActiveTab} />;
      case 'approvals':
        return <ApprovalsView recommendations={recommendations} currentRole={currentRole} onRefresh={reloadData} />;
      case 'realtime':
        return <RealtimeView eventLog={eventLog} wsStatus={wsStatus} />;
      case 'execution':
        return <ExecutionView recommendations={recommendations} currentRole={currentRole} onRefresh={reloadData} />;
      case 'audit':
        return <AuditView auditBlocks={auditBlocks} onRefresh={reloadData} />;
      case 'performance':
        return <ModelPerformanceView metadata={mlMetadata} />;
      case 'config':
        return <PlugAndPlayConfigView metadata={mlMetadata} />;
      default:
        return <DashboardView overview={overview} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-900 text-slate-100">
      <Header currentRole={currentRole} setCurrentRole={setCurrentRole} wsStatus={wsStatus} />
      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}
