/**
 * lib/outsyde.ts
 *
 * Typed API layer for all Outsyde backend calls.
 * Backend is READ-ONLY from this repo.
 * All mutations (booking, auth) go through the backend — never direct DB.
 */

const API_URL = process.env.NEXT_PUBLIC_OUTSYDE_API_URL;
const BUSINESS_ID = process.env.NEXT_PUBLIC_BUSINESS_ID;

if (!API_URL && typeof window === "undefined") {
  console.warn("[outsyde] NEXT_PUBLIC_OUTSYDE_API_URL is not set.");
}

// ─── Types ────────────────────────────────────────────────────────

export interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_image: string | null;
  cover_image: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  city: string | null;
  state: string | null;
  instagram_handle: string | null;
  approval_status: "pending" | "approved" | "rejected";
  stripe_onboarding_complete: boolean;
  created_at: string;
}

export interface VendorService {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface BookingSlot {
  available: boolean;
  conflicts: string[];
}

export interface BookingHold {
  hold_id: string;
  service_id: string;
  date: string;
  time: string;
  expires_at: string;
}

export interface PaymentIntent {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  business_id: string;
  service_id: string;
  service_name: string;
  service_price: number;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  stripe_payment_intent_id: string | null;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_vendor: boolean;
  avatar_url: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

// ─── Internal Fetch Utility ────────────────────────────────────────

interface FetchOptions extends RequestInit {
  token?: string;
}

async function outsydeFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...fetchOptions.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    let message = `API error ${response.status}`;
    try {
      const body = await response.json();
      message = body.message ?? body.error ?? message;
    } catch {
      // ignore parse errors
    }
    throw new OutsydeAPIError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export class OutsydeAPIError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "OutsydeAPIError";
  }
}

// ─── Business ─────────────────────────────────────────────────────

/**
 * Fetch the BWL vendor profile.
 * Uses NEXT_PUBLIC_BUSINESS_ID from env.
 */
export async function getBusiness(): Promise<Business> {
  if (!BUSINESS_ID) {
    throw new Error("[outsyde] NEXT_PUBLIC_BUSINESS_ID is not set.");
  }
  return outsydeFetch<Business>(`/api/businesses/${BUSINESS_ID}`);
}

/**
 * Fetch all active services for BWL.
 * Filters client-side: only is_active = true services are returned.
 */
export async function getBusinessServices(): Promise<VendorService[]> {
  if (!BUSINESS_ID) {
    throw new Error("[outsyde] NEXT_PUBLIC_BUSINESS_ID is not set.");
  }
  const services = await outsydeFetch<VendorService[]>(
    `/api/businesses/${BUSINESS_ID}/services`
  );
  // Belt-and-suspenders: only show active services even if backend returns all
  return services.filter((s) => s.is_active);
}

/**
 * Group services by category.
 */
export function groupServicesByCategory(
  services: VendorService[]
): Record<string, VendorService[]> {
  return services.reduce(
    (acc, service) => {
      const cat = service.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(service);
      return acc;
    },
    {} as Record<string, VendorService[]>
  );
}

/**
 * Format price in dollars.
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Format duration in human-readable form.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}hr`;
}

// ─── Booking ──────────────────────────────────────────────────────

export interface ValidateSlotParams {
  service_id: string;
  date: string; // ISO date string
  time: string; // "HH:MM" 24h
}

export async function validateBookingSlot(
  params: ValidateSlotParams
): Promise<BookingSlot> {
  return outsydeFetch<BookingSlot>("/api/booking/validate", {
    method: "POST",
    body: JSON.stringify({ ...params, business_id: BUSINESS_ID }),
  });
}

export interface CreateHoldParams {
  service_id: string;
  date: string;
  time: string;
}

export async function createBookingHold(
  params: CreateHoldParams,
  token: string
): Promise<BookingHold> {
  return outsydeFetch<BookingHold>("/api/booking/hold", {
    method: "POST",
    token,
    body: JSON.stringify({ ...params, business_id: BUSINESS_ID }),
  });
}

export async function createPaymentIntent(
  holdId: string,
  token: string
): Promise<PaymentIntent> {
  return outsydeFetch<PaymentIntent>(
    `/api/booking/${holdId}/create-payment-intent`,
    {
      method: "POST",
      token,
    }
  );
}

export interface ConfirmBookingParams {
  hold_id: string;
  payment_intent_id: string;
}

export async function confirmBooking(
  params: ConfirmBookingParams,
  token: string
): Promise<Appointment> {
  return outsydeFetch<Appointment>("/api/booking/confirm", {
    method: "POST",
    token,
    body: JSON.stringify(params),
  });
}

// ─── Appointments ─────────────────────────────────────────────────

/**
 * Client: fetch their own appointment history.
 */
export async function getMyAppointments(token: string): Promise<Appointment[]> {
  return outsydeFetch<Appointment[]>("/api/my-appointments", { token });
}

/**
 * Vendor/Admin: fetch all appointments for the business.
 */
export async function getBusinessAppointments(
  token: string
): Promise<Appointment[]> {
  return outsydeFetch<Appointment[]>("/api/business/appointments", { token });
}

// ─── Auth ─────────────────────────────────────────────────────────

export interface CustomerSignupParams {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export async function customerSignup(
  params: CustomerSignupParams
): Promise<AuthTokens> {
  return outsydeFetch<AuthTokens>("/api/auth/customer/signup", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export interface LoginParams {
  email: string;
  password: string;
}

export async function customerLogin(params: LoginParams): Promise<AuthTokens> {
  return outsydeFetch<AuthTokens>("/api/auth/mobile/login", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getMe(token: string): Promise<AuthUser> {
  return outsydeFetch<AuthUser>("/api/auth/me", { token });
}

// ─── BFF Client ───────────────────────────────────────────────────
// Routes all calls through Next.js API routes (/api/*) so the backend
// URL never reaches the browser. Used by auth-context.tsx.

const BFF_BASE = '/api'

async function bffRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
  retry = true
): Promise<{ data: T }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('outsyde_access_token') : null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  }
  const res = await fetch(`${BFF_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  if (res.status === 401 && retry) {
    try {
      await fetch(`${BFF_BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
      return bffRequest<T>(method, path, body, extraHeaders, false)
    } catch {
      throw new Error('Unauthorized')
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, string>
    throw Object.assign(new Error(err.message ?? err.error ?? 'Request failed'), {
      response: { status: res.status, data: err },
    })
  }

  const data = (await res.json()) as T
  return { data }
}

export const outsydeClient = {
  get: <T>(path: string, options?: { headers?: Record<string, string> }) =>
    bffRequest<T>('GET', path, undefined, options?.headers),
  post: <T>(path: string, body?: unknown, options?: { headers?: Record<string, string> }) =>
    bffRequest<T>('POST', path, body, options?.headers),
  patch: <T>(path: string, body?: unknown) =>
    bffRequest<T>('PATCH', path, body),
  delete: <T>(path: string) =>
    bffRequest<T>('DELETE', path),
}