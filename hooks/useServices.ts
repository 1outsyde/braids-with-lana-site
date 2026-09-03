import { useState, useEffect, useCallback } from "react"
import {
  getBusinessServices,
  groupServicesByCategory,
  type VendorService,
} from "@/lib/outsyde"

export interface UseServicesReturn {
  services: VendorService[]
  grouped: Record<string, VendorService[]>
  isLoading: boolean
  error: string | null
  refetch: () => void
}

// Simple module-level cache — survives re-renders, cleared on page reload
let _cache: VendorService[] | null = null

export function useServices(): UseServicesReturn {
  const [services, setServices] = useState<VendorService[]>(_cache ?? [])
  const [isLoading, setIsLoading] = useState(_cache === null)
  const [error, setError] = useState<string | null>(null)

  const fetchServices = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getBusinessServices()
      _cache = data
      setServices(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load services")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (_cache !== null) {
      setServices(_cache)
      setIsLoading(false)
      return
    }
    fetchServices()
  }, [fetchServices])

  return {
    services,
    grouped: groupServicesByCategory(services),
    isLoading,
    error,
    refetch: fetchServices,
  }
}
