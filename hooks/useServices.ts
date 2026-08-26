/**
 * hooks/useServices.ts
 *
 * Fetches and caches BWL service menu from Outsyde backend.
 *
 * Phase 3 implementation target:
 * - Calls getBusinessServices() on mount
 * - Returns services, grouped services, loading state, error state, and refetch
 * - Simple in-memory cache (no SWR dependency — keep deps lean)
 *
 * Used by: ServiceMenu, /services page, /book page (service selection step)
 */

import type { VendorService } from "@/lib/outsyde";

export interface UseServicesReturn {
  services: VendorService[];
  grouped: Record<string, VendorService[]>;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// TODO: Phase 3 — implement useServices with fetch + simple cache
export function useServices(): UseServicesReturn {
  return {
    services: [],
    grouped: {},
    isLoading: true,
    error: null,
    refetch: () => {},
  };
}