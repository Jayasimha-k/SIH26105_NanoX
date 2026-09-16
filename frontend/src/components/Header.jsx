import React from 'react';
import { Shield, UserCheck, LogOut } from 'lucide-react';
import { UserButton, useUser, useClerk } from './ClerkAuth';

export default function Header({ currentRole, wsStatus, onSignOut, isClerkConfigured }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const roleLabels = {
    CISO: 'CISO (Governance)',
    SOC: 'SOC Analyst',
    Security: 'Security Lead',
    IT: 'IT Remediation'
  };

  return (
    <header className="h-16 bg-[#0A0914]/95 backdrop-blur-md border-b border-[#44174E] px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-tr from-[#A34054] to-[#662249] rounded-lg shadow-lg shadow-[#A34054]/30 border border-[#ED9E5B]/40">
          <Shield className="w-5 h-5 text-[#E9BCB9] font-bold" />
        </div>
        <div>
          <h1 className="font-extrabold text-[#E9BCB9] tracking-wide text-sm flex items-center gap-2">
            CyberOpt-RQ
            <span className="text-[10px] bg-[#662249]/60 text-[#E9BCB9] border border-[#A34054] px-2 py-0.5 rounded font-mono font-normal">v1.0.0</span>
          </h1>
          <p className="text-[11px] text-[#ED9E5B]">AI Cyber Risk Quantification & Investment Optimizer</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Professional Realtime System Status Badge */}
        <div className="flex items-center gap-2 bg-[#0D0B18] px-3 py-1.5 rounded-lg border border-[#44174E] text-xs">
          <span className={`w-2 h-2 rounded-full ${wsStatus === 'CONNECTED' ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400' : 'bg-[#ED9E5B]'}`} />
          <span className="text-[#E9BCB9] font-semibold text-[11px]">
            {wsStatus === 'CONNECTED' ? 'Realtime Sync Active' : 'Connecting Engine...'}
          </span>
        </div>

        {/* Clean Static Active Role Indicator Badge */}
        <div className="flex items-center gap-2 bg-[#0D0B18] px-3 py-1.5 rounded-lg border border-[#44174E]">
          <UserCheck className="w-4 h-4 text-[#ED9E5B]" />
          <span className="text-[#E9BCB9]/80 text-xs font-semibold">Active Role:</span>
          <span className="text-[#ED9E5B] font-bold text-xs font-mono px-2 py-0.5 bg-[#A34054]/30 rounded border border-[#A34054]">
            {roleLabels[currentRole] || currentRole}
          </span>
        </div>

        {/* Clerk User Button / Log Out Profile Widget */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#44174E]">
          {isSignedIn ? (
            <div className="flex items-center gap-2">
              <UserButton onSignOut={onSignOut} />
              <span className="text-xs text-[#E9BCB9] font-semibold hidden md:inline">
                {user?.firstName || 'Executive User'}
              </span>
            </div>
          ) : (
            <button
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D0B18] hover:bg-[#1C1830] border border-[#662249] rounded-lg text-xs font-semibold text-[#E9BCB9] transition-all cursor-pointer"
              title="Sign Out to Login Screen"
            >
              <LogOut className="w-3.5 h-3.5 text-[#ED9E5B]" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
