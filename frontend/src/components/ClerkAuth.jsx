import React, { createContext, useContext, useState } from 'react';
import {
  User,
  LogOut,
  Mail,
  Lock as LockIcon,
  Shield,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  Activity,
  Database,
  Wrench,
  KeyRound,
  DollarSign
} from 'lucide-react';

const ClerkContext = createContext({
  isSignedIn: false,
  isLoaded: true,
  user: null,
  signIn: () => {},
  signOut: () => {}
});

export function ClerkProvider({ children }) {
  const [isSignedIn, setIsSignedIn] = useState(() => {
    return localStorage.getItem('cyberopt_auth_signed_in') === 'true';
  });
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cyberopt_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const signIn = (userData) => {
    const defaultUser = userData || { firstName: 'CISO Executive', email: 'ciso@enterprise.com', role: 'CISO' };
    setUser(defaultUser);
    setIsSignedIn(true);
    localStorage.setItem('cyberopt_auth_signed_in', 'true');
    localStorage.setItem('cyberopt_auth_user', JSON.stringify(defaultUser));
  };

  const signOut = () => {
    setIsSignedIn(false);
    setUser(null);
    localStorage.removeItem('cyberopt_auth_signed_in');
    localStorage.removeItem('cyberopt_auth_user');
  };

  return (
    <ClerkContext.Provider value={{ isSignedIn, isLoaded: true, user, signIn, signOut }}>
      {children}
    </ClerkContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(ClerkContext);
  return { isLoaded: ctx.isLoaded, isSignedIn: ctx.isSignedIn, user: ctx.user };
}

export function useClerk() {
  const ctx = useContext(ClerkContext);
  return { signOut: ctx.signOut, signIn: ctx.signIn };
}

export function UserButton({ onSignOut }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const handleSignOutClick = () => {
    setOpen(false);
    if (signOut) signOut();
    if (onSignOut) onSignOut();
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-all border border-blue-200 cursor-pointer"
        title={user.email || user.firstName}
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
          {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'C'}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3 space-y-2 text-xs">
          <div className="border-b border-slate-100 pb-2">
            <p className="font-bold text-slate-800">{user.firstName || 'Executive User'}</p>
            <p className="text-[11px] text-slate-500 truncate">{user.email || 'ciso@enterprise.com'}</p>
            <p className="text-[10px] text-blue-600 font-mono mt-0.5 font-bold">Role: {user.role || 'CISO'}</p>
          </div>
          <button
            onClick={handleSignOutClick}
            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-red-600 font-semibold flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export function SignIn({ onSelectRole, step = 1, setStep, onBypassDemo }) {
  const { signIn } = useClerk();
  const [internalStep, setInternalStep] = useState(1);
  const currentStep = setStep ? step : internalStep;
  const updateStep = setStep || setInternalStep;

  const [selectedRole, setSelectedRole] = useState('CISO');
  const [email, setEmail] = useState('executive@enterprise.com');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState('Credentials');

  const roles = [
    {
      id: 'CISO',
      title: 'CISO',
      icon: Shield,
      badge: 'Executive Governance'
    },
    {
      id: 'CFO',
      title: 'CFO',
      icon: DollarSign,
      badge: 'Financial Risk & Capital'
    },
    {
      id: 'SOC',
      title: 'SOC Analyst',
      icon: Activity,
      badge: 'Threat Intel'
    },
    {
      id: 'Security',
      title: 'Security Lead',
      icon: Database,
      badge: 'AI Modeling'
    },
    {
      id: 'IT',
      title: 'IT Remediation',
      icon: Wrench,
      badge: 'SecOps & Fixes'
    }
  ];

  // Handle Step 1 submission -> Move to Step 2
  const handleCredentialsSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setAuthMethod('Enterprise SSO / Credentials');
      updateStep(2);
    }, 250);
  };

  // Quick OAuth buttons handle Step 1 and proceed to Step 2
  const handleOAuthLogin = (provider) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setEmail(provider === 'Google' ? 'analyst@google.enterprise.com' : 'engineer@github.enterprise.com');
      setAuthMethod(provider);
      updateStep(2);
    }, 200);
  };

  // Handle Step 2 submission -> Complete authentication & launch role workspace
  const handleFinalLaunch = (roleToLaunch = selectedRole) => {
    setLoading(true);
    const roleNames = {
      CISO: 'CISO Executive',
      SOC: 'SOC Lead Analyst',
      Security: 'Security Architect',
      IT: 'IT Remediation Lead'
    };

    setTimeout(() => {
      signIn({
        firstName: roleNames[roleToLaunch] || 'Enterprise User',
        email: email || `${roleToLaunch.toLowerCase()}@enterprise.com`,
        role: roleToLaunch
      });
      if (onSelectRole) onSelectRole(roleToLaunch);
      if (onBypassDemo) onBypassDemo();
      setLoading(false);
    }, 250);
  };

  return (
    <div className="w-full text-xs">
      {currentStep === 1 ? (
        /* ================= STEP 1: CREDENTIALS AUTHENTICATION ================= */
        <div className="space-y-4">
          <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
            <div>
              <label className="block text-slate-800 text-[11px] font-semibold mb-1">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="analyst@enterprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-800 text-[11px] font-semibold">Password</label>
                <span className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium text-[11px]">Forgot?</span>
              </div>
              <div className="relative">
                <LockIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center pt-0.5">
              <label className="flex items-center gap-2 text-slate-700 cursor-pointer text-[11px] font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-50 border-slate-300 accent-blue-600 w-3.5 h-3.5"
                />
                <span>Remember this terminal</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social OAuth & SSO */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="relative flex py-0.5 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Or</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleOAuthLogin('Google')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-800 transition-all cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuthLogin('GitHub')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-800 transition-all cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4 fill-current text-slate-900" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>GitHub</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ================= STEP 2: ROLE SELECTION & LAUNCH ================= */
        <div className="space-y-4">
          {/* Authenticated Identity Pill */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                ✓
              </div>
              <span className="text-xs font-semibold text-slate-800 truncate">{email}</span>
            </div>
            <button
              type="button"
              onClick={() => updateStep(1)}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              Switch
            </button>
          </div>

          {/* Sleek Minimal Apple-Style Role Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {roles.map((r) => {
              const IconComp = r.icon;
              const isSelected = selectedRole === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50/90 border-blue-600 shadow-sm ring-1 ring-blue-600'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        {r.title}
                      </div>
                      <div className={`text-[10px] font-medium ${
                        isSelected ? 'text-blue-700 font-semibold' : 'text-slate-500'
                      }`}>
                        {r.badge}
                      </div>
                    </div>
                  </div>

                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Bar */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => updateStep(1)}
              className="py-2.5 px-3.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleFinalLaunch(selectedRole)}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <span>Launching...</span>
              ) : (
                <>
                  <span>Launch {roles.find(r => r.id === selectedRole)?.title} Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

