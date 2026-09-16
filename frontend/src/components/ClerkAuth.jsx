import React, { createContext, useContext, useState } from 'react';
import { User, LogOut, Mail, Lock as LockIcon, Shield, UserCheck } from 'lucide-react';

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
        className="flex items-center gap-2 p-1 rounded-full hover:bg-[#141124] transition-all border border-[#ED9E5B]/60 cursor-pointer"
        title={user.email || user.firstName}
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#A34054] to-[#662249] flex items-center justify-center text-[#E9BCB9] font-bold text-xs shadow-md">
          {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'C'}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-[#0D0B18] border border-[#662249] rounded-xl shadow-2xl z-50 p-3 space-y-2 text-xs">
          <div className="border-b border-[#44174E] pb-2">
            <p className="font-bold text-[#E9BCB9]">{user.firstName || 'Executive User'}</p>
            <p className="text-[11px] text-[#E9BCB9]/70 truncate">{user.email || 'ciso@enterprise.com'}</p>
            <p className="text-[10px] text-[#ED9E5B] font-mono mt-0.5">Role: {user.role || 'CISO'}</p>
          </div>
          <button
            onClick={handleSignOutClick}
            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#141124] text-[#ED9E5B] font-semibold flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export function SignIn({ onSelectRole }) {
  const { signIn } = useClerk();
  const [selectedRole, setSelectedRole] = useState('CISO');
  const [email, setEmail] = useState('ciso@enterprise.com');
  const [password, setPassword] = useState('••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (roleKey) => {
    setSelectedRole(roleKey);
    if (roleKey === 'CISO') setEmail('ciso@enterprise.com');
    if (roleKey === 'SOC') setEmail('soc.analyst@enterprise.com');
    if (roleKey === 'Security') setEmail('security.lead@enterprise.com');
    if (roleKey === 'IT') setEmail('it.remediation@enterprise.com');
    if (onSelectRole) onSelectRole(roleKey);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      signIn({
        firstName: selectedRole === 'CISO' ? 'CISO Executive' : selectedRole === 'SOC' ? 'SOC Lead' : selectedRole === 'Security' ? 'Security Architect' : 'IT Specialist',
        email: email || `${selectedRole.toLowerCase()}@enterprise.com`,
        role: selectedRole
      });
      if (onSelectRole) onSelectRole(selectedRole);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="w-full space-y-4 text-xs">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Login Role Selection Selector */}
        <div>
          <label className="block text-[#E9BCB9] text-[11px] font-semibold mb-1.5 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-[#ED9E5B]" /> Select Your Enterprise Access Role
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleRoleChange('CISO')}
              className={`p-2 rounded-xl border text-left transition-all ${
                selectedRole === 'CISO'
                  ? 'bg-[#A34054] border-[#ED9E5B] text-[#E9BCB9] font-bold shadow-md'
                  : 'bg-[#0D0B18] border-[#44174E] text-[#E9BCB9]/70 hover:border-[#662249]'
              }`}
            >
              <span className="block text-[11px] font-bold">CISO</span>
              <span className="block text-[9px] text-[#E9BCB9]/80">Governance & Approvals</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('SOC')}
              className={`p-2 rounded-xl border text-left transition-all ${
                selectedRole === 'SOC'
                  ? 'bg-[#A34054] border-[#ED9E5B] text-[#E9BCB9] font-bold shadow-md'
                  : 'bg-[#0D0B18] border-[#44174E] text-[#E9BCB9]/70 hover:border-[#662249]'
              }`}
            >
              <span className="block text-[11px] font-bold">SOC Analyst</span>
              <span className="block text-[9px] text-[#E9BCB9]/80">Threat Ingestion & CVEs</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('Security')}
              className={`p-2 rounded-xl border text-left transition-all ${
                selectedRole === 'Security'
                  ? 'bg-[#A34054] border-[#ED9E5B] text-[#E9BCB9] font-bold shadow-md'
                  : 'bg-[#0D0B18] border-[#44174E] text-[#E9BCB9]/70 hover:border-[#662249]'
              }`}
            >
              <span className="block text-[11px] font-bold">Security Lead</span>
              <span className="block text-[9px] text-[#E9BCB9]/80">AI Modeling & PuLP</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('IT')}
              className={`p-2 rounded-xl border text-left transition-all ${
                selectedRole === 'IT'
                  ? 'bg-[#A34054] border-[#ED9E5B] text-[#E9BCB9] font-bold shadow-md'
                  : 'bg-[#0D0B18] border-[#44174E] text-[#E9BCB9]/70 hover:border-[#662249]'
              }`}
            >
              <span className="block text-[11px] font-bold">IT Remediation</span>
              <span className="block text-[9px] text-[#E9BCB9]/80">Control Deployment</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[#E9BCB9] text-[11px] font-semibold mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#ED9E5B] absolute left-3 top-2.5" />
            <input
              type="email"
              required
              placeholder="user@enterprise.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0D0B18] border border-[#44174E] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#E9BCB9] focus:outline-none focus:border-[#A34054] transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[#E9BCB9] text-[11px] font-semibold mb-1.5">Password</label>
          <div className="relative">
            <LockIcon className="w-4 h-4 text-[#ED9E5B] absolute left-3 top-2.5" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0D0B18] border border-[#44174E] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#E9BCB9] focus:outline-none focus:border-[#A34054] transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-[11px]">
          <label className="flex items-center gap-2 text-[#E9BCB9]/80 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded bg-[#0D0B18] border-[#44174E] accent-[#A34054]"
            />
            <span>Remember me</span>
          </label>
          <span className="text-[#ED9E5B] hover:text-[#E9BCB9] cursor-pointer font-medium">Forgot password?</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="cyber-button w-full py-3 text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          {loading ? 'Authenticating...' : `Sign In as ${selectedRole}`}
        </button>
      </form>

      {/* Modern Google & GitHub OAuth Buttons */}
      <div className="pt-3 border-t border-[#44174E]/80 space-y-3">
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#44174E]"></div>
          <span className="flex-shrink mx-3 text-[10px] text-[#E9BCB9]/60 uppercase tracking-wider font-mono">Or continue with</span>
          <div className="flex-grow border-t border-[#44174E]"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Google OAuth */}
          <button
            type="button"
            onClick={() => {
              signIn({ firstName: `${selectedRole} User`, email: `${selectedRole.toLowerCase()}@gmail.com`, role: selectedRole });
              if (onSelectRole) onSelectRole(selectedRole);
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#0D0B18] hover:bg-[#1C1830] border border-[#44174E] hover:border-[#662249] rounded-xl text-xs font-semibold text-[#E9BCB9] transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
            </svg>
            <span>Google</span>
          </button>

          {/* GitHub OAuth */}
          <button
            type="button"
            onClick={() => {
              signIn({ firstName: `${selectedRole} Lead`, email: `${selectedRole.toLowerCase()}@github.com`, role: selectedRole });
              if (onSelectRole) onSelectRole(selectedRole);
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#0D0B18] hover:bg-[#1C1830] border border-[#44174E] hover:border-[#662249] rounded-xl text-xs font-semibold text-[#E9BCB9] transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current text-[#E9BCB9]" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span>GitHub</span>
          </button>
        </div>
      </div>
    </div>
  );
}
