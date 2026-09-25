/**
 * CyberOptRQ Authentication Bridge
 * ================================
 * Note: ClerkAuth.jsx originally housed a local mock RBAC context.
 * All authentication logic has been unified into AuthContext.jsx which explicitly supports:
 *   1. OFFLINE_DEMO (Local RBAC for SIH competition)
 *   2. SUPABASE_AUTH (Live multi-tenant cloud PostgreSQL & Supabase Auth)
 *
 * This file maintains backwards compatibility by re-exporting from AuthContext.jsx.
 */

export {
  AuthProvider,
  ClerkProvider,
  useAuth,
  useUser,
  useClerk,
  UserButton,
  SignIn,
  AUTH_MODE,
  supabase
} from './AuthContext';
