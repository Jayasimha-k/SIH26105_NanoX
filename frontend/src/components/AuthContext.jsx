import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Shield,
  UserCheck,
  LogOut,
  Mail,
  Lock as LockIcon,
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
  DollarSign,
  Cloud,
  Laptop
} from 'lucide-react';

// Determine runtime authentication mode
const VITE_APP_MODE = import.meta.env.VITE_APP_MODE || 'offline_demo';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const AUTH_MODE = (VITE_APP_MODE === 'production' && isSupabaseConfigured)
  ? 'SUPABASE_AUTH'
  : 'OFFLINE_DEMO';

// Initialize Supabase client if configured
let supabase = null;
if (isSupabaseConfigured) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

export { supabase };

const AuthContext = createContext({
  authMode: AUTH_MODE,
  isSignedIn: false,
  isLoaded: true,
  user: null,
  organization: null,
  role: 'CISO',
  signIn: () => {},
  signOut: () => {},
  switchRole: () => {}
});

export function AuthProvider({ children }) {
  const [authMode] = useState(AUTH_MODE);
  const [isSignedIn, setIsSignedIn] = useState(() => {
    return localStorage.getItem('cyberopt_auth_signed_in') === 'true';
  });
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cyberopt_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [organization, setOrganization] = useState(() => {
    const saved = localStorage.getItem('cyberopt_auth_org');
    return saved ? JSON.parse(saved) : { id: 'org_abc_tech', name: 'ABC Technologies' };
  });

  // Check Supabase session if in SUPABASE_AUTH mode
  useEffect(() => {
    if (authMode === 'SUPABASE_AUTH' && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const u = {
            id: session.user.id,
            email: session.user.email,
            firstName: session.user.user_metadata?.first_name || session.user.email?.split('@')[0],
            role: session.user.user_metadata?.role || 'CISO'
          };
          setUser(u);
          setIsSignedIn(true);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const u = {
            id: session.user.id,
            email: session.user.email,
            firstName: session.user.user_metadata?.first_name || session.user.email?.split('@')[0],
            role: session.user.user_metadata?.role || 'CISO'
          };
          setUser(u);
          setIsSignedIn(true);
        } else {
          setUser(null);
          setIsSignedIn(false);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [authMode]);

  const signIn = async (userData) => {
    const defaultUser = userData || {
      firstName: 'CISO Executive',
      email: 'ciso@enterprise.com',
      role: 'CISO'
    };
    setUser(defaultUser);
    setIsSignedIn(true);
    localStorage.setItem('cyberopt_auth_signed_in', 'true');
    localStorage.setItem('cyberopt_auth_user', JSON.stringify(defaultUser));
  };

  const signOut = async () => {
    if (authMode === 'SUPABASE_AUTH' && supabase) {
      await supabase.auth.signOut();
    }
    setIsSignedIn(false);
    setUser(null);
    localStorage.removeItem('cyberopt_auth_signed_in');
    localStorage.removeItem('cyberopt_auth_user');
  };

  const switchRole = (newRole) => {
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      localStorage.setItem('cyberopt_auth_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authMode,
        isSignedIn,
        isLoaded: true,
        user,
        organization,
        role: user?.role || 'CISO',
        signIn,
        signOut,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useUser() {
  const ctx = useContext(AuthContext);
  return { isLoaded: ctx.isLoaded, isSignedIn: ctx.isSignedIn, user: ctx.user };
}

export function useClerk() {
  const ctx = useContext(AuthContext);
  return { signOut: ctx.signOut, signIn: ctx.signIn };
}

export function ClerkProvider({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

export function UserButton({ onSignOut }) {
  const { user, authMode } = useAuth();
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
        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3 space-y-2 text-xs">
          <div className="border-b border-slate-100 pb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-800">{user.firstName || 'Executive User'}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                authMode === 'SUPABASE_AUTH'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {authMode === 'SUPABASE_AUTH' ? 'Supabase Auth' : 'Offline RBAC'}
              </span>
            </div>
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
  const { signIn, authMode } = useAuth();
  const [internalStep, setInternalStep] = useState(1);
  const currentStep = setStep ? step : internalStep;
  const updateStep = setStep || setInternalStep;

  const [selectedRole, setSelectedRole] = useState('CISO');
  const [email, setEmail] = useState('ciso@enterprise.com');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    if (authMode === 'SUPABASE_AUTH' && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        updateStep(2);
      } catch (err) {
        setErrorMessage(err.message || 'Supabase authentication failed');
      } finally {
        setLoading(false);
      }
    } else {
      // Offline Demo Mode: fast transition to role selection
      setTimeout(() => {
        setLoading(false);
        updateStep(2);
      }, 300);
    }
  };

  const handleRoleConfirm = () => {
    signIn({
      firstName: `${selectedRole} User`,
      email,
      role: selectedRole
    });
    if (onSelectRole) {
      onSelectRole(selectedRole);
    }
  };

  return (
    <div className="space-y-4">
      {/* Explicit Architecture Mode Badge */}
      <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
        authMode === 'SUPABASE_AUTH'
          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
          : 'bg-amber-50/80 border-amber-200 text-amber-800'
      }`}>
        <div className="flex items-center gap-2">
          {authMode === 'SUPABASE_AUTH' ? (
            <Cloud className="w-4 h-4 text-emerald-600" />
          ) : (
            <Laptop className="w-4 h-4 text-amber-600" />
          )}
          <div>
            <span className="font-bold">
              {authMode === 'SUPABASE_AUTH' ? 'PRODUCTION MODE' : 'OFFLINE SIH DEMO MODE'}
            </span>
            <p className="text-[10px] text-slate-500">
              {authMode === 'SUPABASE_AUTH'
                ? 'Authenticated via Cloud Supabase & PostgreSQL'
                : 'Local Role-Based Access Control (No External Network Required)'}
            </p>
          </div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
          authMode === 'SUPABASE_AUTH'
            ? 'bg-emerald-200 text-emerald-900'
            : 'bg-amber-200 text-amber-900'
        }`}>
          {authMode === 'SUPABASE_AUTH' ? 'Live Cloud' : 'Local Sandbox'}
        </span>
      </div>

      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      {currentStep === 1 && (
        <form onSubmit={handleAuthSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Work Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 pl-8 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                placeholder="executive@enterprise.com"
              />
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pl-8 pr-8 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-none transition-all font-mono"
                placeholder="••••••••"
              />
              <LockIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      {currentStep === 2 && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {roles.map((r) => {
              const Icon = r.icon;
              const isSelected = selectedRole === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{r.title}</div>
                      <div className="text-[10px] text-slate-500">{r.badge}</div>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => updateStep(1)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="button"
              onClick={handleRoleConfirm}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Enter as {selectedRole} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
