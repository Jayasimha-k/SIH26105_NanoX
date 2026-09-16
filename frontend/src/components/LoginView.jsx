import React from 'react';
import { Shield, KeyRound, Lock } from 'lucide-react';
import { SignIn } from './ClerkAuth';

export default function LoginView({ onSelectRole }) {
  return (
    <div className="min-h-screen bg-[#0A0914] text-[#E9BCB9] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Subtle Ambient Glowing Accents */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#A34054]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#44174E]/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Login Container */}
      <div className="max-w-md w-full z-10 space-y-6">
        
        {/* Top Header Logo & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-tr from-[#A34054] to-[#662249] rounded-2xl shadow-xl shadow-[#A34054]/30 border border-[#ED9E5B]/40 mb-1">
            <Shield className="w-8 h-8 text-[#E9BCB9]" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#E9BCB9] tracking-wider flex items-center justify-center gap-2">
            CyberOpt-RQ
            <span className="text-xs bg-[#662249]/60 text-[#ED9E5B] border border-[#A34054] px-2 py-0.5 rounded font-mono font-normal">SIH 2026</span>
          </h1>
          <p className="text-xs text-[#ED9E5B]">AI Cyber Risk Quantification & Investment Optimizer</p>
        </div>

        {/* Professional Centered Login Card */}
        <div className="cyber-card p-6 border border-[#662249] space-y-5 shadow-2xl bg-[#141124]/90 rounded-2xl">
          <div className="border-b border-[#44174E] pb-3 text-center">
            <h2 className="font-bold text-sm text-[#E9BCB9] flex items-center justify-center gap-2">
              <KeyRound className="w-4 h-4 text-[#ED9E5B]" /> Executive Portal Sign In
            </h2>
          </div>

          <SignIn onSelectRole={onSelectRole} />

          {/* Secure Encryption Footer */}
          <div className="pt-3 border-t border-[#44174E] text-center">
            <p className="text-[10px] text-[#E9BCB9]/60 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3 text-[#ED9E5B]" />
              Protected by Enterprise Cryptographic Authentication
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
