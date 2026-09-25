import React, { useState } from 'react';
import {
  Shield,
  ArrowRight,
  Lock,
  CheckCircle2,
  DollarSign,
  Activity,
  TrendingUp,
  Zap,
  Layers,
  FileText,
  ChevronRight,
  Sparkles,
  Globe,
  Server,
  Cpu,
  Database,
  Users,
  Check,
  Building2,
  BarChart3,
  Search,
  KeyRound
} from 'lucide-react';

export default function PublicMarketingSite({ onGetStarted, onLogin, onBookDemo }) {
  const [activeNav, setActiveNav] = useState('home');
  const [billingCycle, setBillingCycle] = useState('annual');

  const scrollToSection = (id) => {
    setActiveNav(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Ambient Radial Gradient Accents */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-blue-600/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-emerald-600/10 via-blue-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection('home')}>
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5">
                CyberOpt<span className="text-blue-500">RQ</span>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Enterprise
                </span>
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <button onClick={() => scrollToSection('product')} className="hover:text-white transition-colors">Product</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">How It Works</button>
            <button onClick={() => scrollToSection('solutions')} className="hover:text-white transition-colors">Solutions</button>
            <button onClick={() => scrollToSection('security')} className="hover:text-white transition-colors">Security</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Pricing</button>
            <button onClick={() => scrollToSection('enterprise')} className="hover:text-white transition-colors">Enterprise</button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogin}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all border border-slate-800"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center relative">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation AI Cyber Risk Quantification & Financial Exposure Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight">
          Translate Technical Threat Telemetry Into <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">Financial Decisions</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mt-6 leading-relaxed">
          CyberOptRQ bridges the communication gap between Security Operations and the C-Suite.
          We quantify vulnerability exposure in currency using FAIR-aligned Expected Annual Loss (EAL) and solve 0-1 Knapsack security budget optimization.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
          >
            [ GET STARTED ]
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onBookDemo}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            [ BOOK DEMO ]
            <Sparkles className="w-4 h-4 text-amber-400" />
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 text-left">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <Activity className="w-5 h-5 text-blue-400 mb-2.5" />
            <h4 className="font-bold text-sm text-white">Organization-Specific Risk</h4>
            <p className="text-xs text-slate-400 mt-1">Calibrates risk to your exact tech stack, asset values, and exposure levels.</p>
          </div>
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <DollarSign className="w-5 h-5 text-emerald-400 mb-2.5" />
            <h4 className="font-bold text-sm text-white">Financial Loss (EAL)</h4>
            <p className="text-xs text-slate-400 mt-1">Computes mathematically validated Expected Annual Loss in currency, not arbitrary scores.</p>
          </div>
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <Zap className="w-5 h-5 text-amber-400 mb-2.5" />
            <h4 className="font-bold text-sm text-white">Knapsack Optimizer</h4>
            <p className="text-xs text-slate-400 mt-1">Solves 0-1 Integer Linear Program to maximize Return on Security Investment (ROSI).</p>
          </div>
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <Lock className="w-5 h-5 text-purple-400 mb-2.5" />
            <h4 className="font-bold text-sm text-white">Immutable Consortium Ledger</h4>
            <p className="text-xs text-slate-400 mt-1">Cryptographic Raft consortium audit trail with zero tampering risk.</p>
          </div>
        </div>
      </section>

      {/* Decision-Centric Philosophy Section */}
      <section id="how-it-works" className="py-20 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">Core Decision Workflow</span>
            <h2 className="text-3xl font-extrabold text-white mt-2">Built for Executive Decisions, Not Model Confusion</h2>
            <p className="text-sm text-slate-400 mt-3">
              Most tools dump thousands of CVE alerts on your team. CyberOptRQ guides you through a clear decision hierarchy from exposure to validated remediation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-14">
            {[
              { step: '01', title: 'RISK', subtitle: 'How risky is my organization?', desc: 'Calibrated exploit probability based on wild threats and perimeter exposure.', color: 'border-blue-500/40' },
              { step: '02', title: 'WHY?', subtitle: 'What drives that risk?', desc: 'Explainable risk drivers: asset value, open ports, CWE class, EPSS velocity.', color: 'border-indigo-500/40' },
              { step: '03', title: 'FINANCIAL IMPACT', subtitle: 'What could it cost?', desc: 'Expected Annual Loss (EAL) calculated under FAIR quantitative risk modeling.', color: 'border-rose-500/40' },
              { step: '04', title: 'WHAT TO DO', subtitle: 'Where to invest?', desc: '0-1 Knapsack ILP optimization selects highest ROSI controls within budget.', color: 'border-emerald-500/40' },
              { step: '05', title: 'REASSESS', subtitle: 'Did it reduce risk?', desc: 'Continuous verification and model adaptation against ground truth outcomes.', color: 'border-purple-500/40' }
            ].map((item, idx) => (
              <div key={idx} className={`p-5 bg-slate-950 border ${item.color} rounded-2xl relative flex flex-col justify-between`}>
                <div>
                  <span className="text-xs font-mono font-black text-slate-500">{item.step}</span>
                  <h3 className="text-lg font-black text-white mt-1">{item.title}</h3>
                  <p className="text-xs font-semibold text-blue-400 mt-0.5">{item.subtitle}</p>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions / Role-Tailored Experiences */}
      <section id="solutions" className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">Tailored Workspaces</span>
          <h2 className="text-3xl font-extrabold text-white mt-2">Unified Platform for CISO, CFO, and SecOps</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">For the CISO</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time cyber risk posture, perimeter exposure monitoring, active CISA KEV surge detection, and 1-click emergency control execution.
            </p>
            <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Continuous Threat Intelligence</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Model 6 Network Behavioral Flows</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Human-In-The-Loop Approval Gates</li>
            </ul>
          </div>

          <div className="p-7 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">For the CFO</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Expected Annual Loss distributions, financial exposure quantified in Rupees/Dollars, security ROI forecasting, and actual vs forecast tracking.
            </p>
            <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> FAIR Model EAL Loss Engine</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Budget Optimization (ROSI)</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Financial Intelligence Newsletters</li>
            </ul>
          </div>

          <div className="p-7 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">For SecOps & Analysts</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deep technical drill-downs into P1–P6 models, ROC-AUC diagnostics, MITRE ATT&CK techniques, and authorized autonomous testing.
            </p>
            <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400" /> Strix Autonomous Security Testing</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400" /> CIC-IDS2017 Model 6 Telemetry</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400" /> Custom Dataset Upload & Validation</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-900/40 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">Enterprise Pricing</span>
            <h2 className="text-3xl font-extrabold text-white mt-2">Transparent Subscriptions for Modern Enterprises</h2>
            <p className="text-sm text-slate-400 mt-2">Select the deployment model aligned with your regulatory and infrastructure needs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Core */}
            <div className="p-7 bg-slate-950 border border-slate-800 rounded-3xl space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-800 text-slate-300">CORE</span>
                <h3 className="text-2xl font-bold text-white">Cyber Risk Core</h3>
                <p className="text-xs text-slate-400">Automated cyber-risk quantification & FAIR model Expected Annual Loss (EAL).</p>
                <div className="pt-2">
                  <span className="text-3xl font-black text-white">₹4.9L</span>
                  <span className="text-xs text-slate-400"> / year</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-2.5 pt-4 border-t border-slate-800/80">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> P1-P5 Risk Engine</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Asset & Vulnerability Catalog</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> FAIR Model EAL Loss Engine</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Local Cryptographic Audit Ledger</li>
                </ul>
              </div>
              <button
                onClick={onGetStarted}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
              >
                Choose Core Plan
              </button>
            </div>

            {/* Enterprise (Highlighted) */}
            <div className="p-7 bg-gradient-to-b from-blue-950/60 to-slate-950 border-2 border-blue-500 rounded-3xl space-y-6 flex flex-col justify-between relative shadow-2xl shadow-blue-600/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider font-mono">
                MOST POPULAR
              </div>
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-blue-500/20 text-blue-300">ENTERPRISE SAAS</span>
                <h3 className="text-2xl font-bold text-white">Enterprise Cloud</h3>
                <p className="text-xs text-slate-400">Complete multi-tenant cyber risk platform with continuous intelligence & optimization.</p>
                <div className="pt-2">
                  <span className="text-3xl font-black text-white">₹18.5L</span>
                  <span className="text-xs text-slate-400"> / year</span>
                </div>
                <ul className="text-xs text-slate-200 space-y-2.5 pt-4 border-t border-blue-900/60">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Everything in Core</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Model 6 Network Behavioral Intelligence</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Continuous Threat & Financial Newsletters</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> 0-1 Knapsack Investment Optimizer</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Autonomous Strix Security Testing</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400" /> Hyperledger Fabric Consortium Audit</li>
                </ul>
              </div>
              <button
                onClick={onGetStarted}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all"
              >
                Get Started with Enterprise
              </button>
            </div>

            {/* Sovereign Air-Gapped */}
            <div className="p-7 bg-slate-950 border border-slate-800 rounded-3xl space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-800 text-slate-300">SOVEREIGN AIR-GAPPED</span>
                <h3 className="text-2xl font-bold text-white">Private Deployment</h3>
                <p className="text-xs text-slate-400">Zero-external telemetry egress for defense, banking, and critical infrastructure.</p>
                <div className="pt-2">
                  <span className="text-3xl font-black text-white">₹45.0L</span>
                  <span className="text-xs text-slate-400"> / license</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-2.5 pt-4 border-t border-slate-800/80">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Everything in Enterprise</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> 100% Offline Air-Gapped Execution</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Dedicated On-Premises Raft Blockchain</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Offline RFC 822 .eml Ingestion</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Sovereign Model Parameter Adaptation</li>
                </ul>
              </div>
              <button
                onClick={onBookDemo}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
              >
                Contact Enterprise Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section id="security" className="py-20 max-w-7xl mx-auto px-6">
        <div className="p-10 bg-slate-900/60 border border-slate-800 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">Security Architecture</span>
            <h3 className="text-2xl font-bold text-white">Zero Telemetry Leakage & Air-Gapped Ready</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              CyberOptRQ enforces tenant isolation at database and application levels using Supabase Row Level Security (RLS).
              Raw customer traffic, proprietary emails, and model binaries never leave your authorized tenant boundary.
            </p>
          </div>
          <button
            onClick={onGetStarted}
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all shrink-0"
          >
            Review Security Whitepaper
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-10 bg-slate-950 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-slate-300 font-bold">CyberOptRQ</span>
            <span>&bull; SIH 2026 Problem Statement 26105</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Documentation</span>
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <button onClick={onLogin} className="text-blue-400 hover:text-blue-300 font-bold">Sign In</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
