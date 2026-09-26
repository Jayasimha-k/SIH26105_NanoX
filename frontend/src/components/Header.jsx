import React, { useState } from 'react';
import { Shield, UserCheck, LogOut, MessageSquare, Building2, Globe, Cloud, Laptop, HelpCircle, Presentation } from 'lucide-react';
import { UserButton, useUser, useClerk, useAuth } from './AuthContext';
import { OrganizationDataPanel } from './OrgAndModelPanels';

export default function Header({
  currentRole,
  wsStatus,
  onSignOut,
  isClerkConfigured,
  onToggleMessenger,
  unreadMessageCount = 0,
  onNavigateMarketing,
  onOpenHelp,
  onToggleDemoBar,
  showDemoBar = true
}) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const { authMode } = useAuth();

  const [showOrgPanel, setShowOrgPanel] = useState(false);

  const roleLabels = {
    CISO: 'CISO (Executive Governance)',
    CFO: 'CFO (Financial Intelligence)',
    SOC: 'SOC Operations & Threat Intel',
    Security: 'Security Lead (Risk & Controls)',
    IT: 'IT Remediation Team'
  };

  return (
    <>
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl shadow-sm text-white">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-slate-900 tracking-tight text-base">
              CyberOpt-RQ
            </h1>
            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">SIH 2026</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Public Marketing Site Button */}
          {onNavigateMarketing && (
            <button
              onClick={onNavigateMarketing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              title="View Public Marketing & Product Site"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Public Site</span>
            </button>
          )}

          {/* [ ? HELP ] button — Explicit click only */}
          <button
            id="global-help-btn"
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-400/80 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
            title="Open Interactive Guided Spotlight Explanation (SIH Demo Explainer)"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
            <span>[ ? HELP ]</span>
          </button>

          {/* [ ORGANIZATION DATA ] button */}
          <button
            id="org-data-btn"
            onClick={() => setShowOrgPanel(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              showOrgPanel
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
            }`}
            title="View organization-specific inputs feeding the risk pipeline"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ORGANIZATION DATA</span>
          </button>

          {/* SIH Demo Narrative Toggle */}
          {onToggleDemoBar && (
            <button
              onClick={onToggleDemoBar}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                showDemoBar
                  ? 'bg-slate-900 text-white border-slate-700 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              title="Toggle SIH 2026 9-Stage Demo Narrative Bar"
            >
              <Presentation className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">DEMO BAR</span>
            </button>
          )}

          {/* Live Risk Data Indicator */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse shadow-sm shadow-emerald-400" />
            <span className="text-slate-700 font-semibold text-[11px] hidden md:inline">Live Risk Data</span>
          </div>

          {/* Inter-Team Communication */}
          <button
            onClick={onToggleMessenger}
            className="relative p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 rounded-lg border border-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Open Inter-Team Directives & Direct Messages"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadMessageCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                {unreadMessageCount}
              </span>
            )}
          </button>

          {/* Active Mode Indicator Badge */}
          <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${
            authMode === 'SUPABASE_AUTH'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {authMode === 'SUPABASE_AUTH' ? <Cloud className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{authMode === 'SUPABASE_AUTH' ? 'Supabase Auth' : 'Offline RBAC'}</span>
          </div>

          {/* Active Role Indicator Badge */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-inner">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span className="text-slate-600 text-xs font-medium hidden sm:inline">Role:</span>
            <span className="text-blue-700 font-bold text-xs font-mono px-2 py-0.5 bg-blue-100 rounded border border-blue-200">
              {roleLabels[currentRole] || currentRole}
            </span>
          </div>

          {/* Clerk User Profile / Sign Out Widget */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            {isSignedIn ? (
              <div className="flex items-center gap-2">
                <UserButton onSignOut={onSignOut} />
                <span className="text-xs text-slate-800 font-semibold hidden md:inline">
                  {user?.firstName || 'Executive'}
                </span>
              </div>
            ) : (
              <button
                onClick={onSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-sm hover:border-slate-300"
                title="Sign Out / Switch Role"
              >
                <LogOut className="w-3.5 h-3.5 text-blue-600" />
                <span>Switch Role</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Slide-in panels */}
      {showOrgPanel && <OrganizationDataPanel onClose={() => setShowOrgPanel(false)} />}
    </>
  );
}
