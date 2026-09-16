import React, { useState } from 'react';
import { Shield, KeyRound, Lock, UserCheck, CheckCircle2 } from 'lucide-react';
import { SignIn } from './ClerkAuth';

export default function LoginView({ onSelectRole, onBypassDemo, isClerkConfigured }) {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Subtle Ambient Background Accent */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Login Container */}
      <div className={`w-full z-10 space-y-6 transition-all duration-300 ${step === 1 ? 'max-w-sm' : 'max-w-lg'}`}>
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-600 rounded-2xl shadow-sm text-white mb-0.5">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center justify-center gap-2">
            CyberOpt-RQ
            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">SIH 2026</span>
          </h1>
        </div>

        {/* Minimalist Segmented Stepper */}
        <div className="bg-slate-200/70 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold max-w-[280px] mx-auto">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              step === 1
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Authenticate
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              step === 2
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Select Role
          </button>
        </div>

        {/* Sleek Login Card */}
        <div className="bg-white border border-slate-200 p-6 space-y-4 shadow-sm rounded-2xl">
          <div className="border-b border-slate-100 pb-3 text-center">
            <h2 className="font-bold text-sm text-slate-900">
              {step === 1 ? 'Enterprise Sign In' : 'Select Workspace Role'}
            </h2>
          </div>

          <SignIn
            onSelectRole={onSelectRole}
            step={step}
            setStep={setStep}
            onBypassDemo={onBypassDemo}
          />
        </div>

        <div className="text-center">
          <span className="text-[11px] text-slate-400 font-medium">Enterprise Cryptographic RBAC</span>
        </div>
      </div>
    </div>
  );
}
