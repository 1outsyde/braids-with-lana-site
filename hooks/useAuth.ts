/**
 * hooks/useAuth.ts
 *
 * Auth state hook — wraps token management and /api/auth/me validation.
 *
 * Phase 4 implementation target:
 * - On mount: reads access token, calls getMe() to validate session
 * - Exposes: user, isLoading, isAuthenticated, login(), logout(), signup()
 * - Redirects to /book after successful login (if booking flow initiated)
 *
 * Both call sites (booking gate + dashboard gate) use this hook.
 * NOTE: If /api/auth/me response shape changes, update HERE and in lib/outsyde.ts.
 */

// TODO: Phase 4 — implement useAuth with getMe validation
export function useAuth() {
  return {
    user: null,
    isLoading: true,
    isAuthenticated: false,
    login: async (_email: string, _password: string) => {},
    logout: () => {},
    signup: async (_params: {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
    }) => {},
  };
}