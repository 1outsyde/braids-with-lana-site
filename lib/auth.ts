/**
 * lib/auth.ts
 *
 * JWT token management for client-side auth.
 * Tokens stored in localStorage (client-only).
 *
 * Access token: 7d TTL
 * Refresh token: 30d TTL
 *
 * Usage pattern:
 *   const token = getAccessToken();
 *   const data = await getMe(token);
 */

const ACCESS_TOKEN_KEY = "bwl_access_token";
const REFRESH_TOKEN_KEY = "bwl_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// ─── Dashboard Allowlist ──────────────────────────────────────────
/**
 * Check if an email is on the dashboard allowlist.
 * DASHBOARD_ALLOWED_EMAILS is a comma-separated env var.
 * This check is also enforced server-side in the dashboard route.
 */
export function isDashboardAllowed(email: string): boolean {
  const allowed = process.env.DASHBOARD_ALLOWED_EMAILS ?? "";
  const list = allowed
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}