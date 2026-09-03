"use client"

import Link from "next/link"
import { useServices } from "@/hooks/useServices"
import ServiceCard from "@/components/sections/ServiceCard"
import Skeleton from "@/components/ui/Skeleton"
import ErrorState from "@/components/ui/ErrorState"

export default function ServiceMenu() {
  const { grouped, isLoading, error, refetch } = useServices()
  const categories = Object.keys(grouped)

  return (
    <section id="services" className="py-section-lg bg-surface">
      <div className="section-container">
        <div className="flex flex-col gap-3 mb-12">
          <p className="eyebrow">What we offer</p>
          <h2 className="font-display text-display-lg text-white">
            Services & Pricing
          </h2>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-52" />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <ErrorState
            message={error}
            onRetry={refetch}
          />
        )}

        {!isLoading && !error && categories.length === 0 && (
          <div className="flex flex-col items-center gap-6 py-20 text-center">
            <p className="text-body-lg text-muted max-w-sm">
              Service menu coming soon. Book a consultation to get started.
            </p>
            <Link href="/book" className="btn btn-primary">
              Book Now
            </Link>
          </div>
        )}

        {!isLoading && !error && categories.length > 0 && (
          <div className="flex flex-col gap-14">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="font-display text-display-sm text-white mb-6 pb-4 border-b border-[var(--color-border)]">
                  {category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {grouped[category].map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
