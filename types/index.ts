/**
 * types/index.ts
 *
 * Shared TypeScript types for BWL site.
 * Domain types (Business, VendorService, Appointment, etc.) live in lib/outsyde.ts.
 * This file holds UI-layer and app-layer types.
 */

// ─── Booking Flow State ───────────────────────────────────────────

export type BookingStep =
  | "select-service"
  | "select-datetime"
  | "auth"
  | "payment"
  | "confirmation";

export interface BookingState {
  step: BookingStep;
  service_id: string | null;
  service_name: string | null;
  service_price: number | null;
  date: string | null;
  time: string | null;
  hold_id: string | null;
  hold_expires_at: string | null;
  payment_intent_id: string | null;
  appointment_id: string | null;
}

// ─── Dashboard ────────────────────────────────────────────────────

export interface DashboardStats {
  total_appointments: number;
  upcoming_appointments: number;
  total_revenue_cents: number;
  this_month_revenue_cents: number;
}

// ─── Nav ──────────────────────────────────────────────────────────

export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

// ─── Toast / Notifications ────────────────────────────────────────

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}