import Link from "next/link"
import { formatPrice, formatDuration, type VendorService } from "@/lib/outsyde"
import { consumerLocationLabel } from "@/lib/serviceLocation"

interface ServiceCardProps {
  service: VendorService
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const duration = service.durationMinutes ?? service.duration_minutes ?? 0
  return (
    <article className="card hairline-gradient p-6 flex flex-col gap-4 group">
      <div className="flex flex-col gap-1">
        <p className="eyebrow">{service.category}</p>
        <h3 className="font-display text-display-sm text-white group-hover:text-teal transition-colors">
          {service.name}
        </h3>
      </div>

      {service.description && (
        <p className="text-body-sm text-muted line-clamp-2 flex-1">
          {service.description}
        </p>
      )}

      <div className="flex items-center gap-4 mt-auto">
        <span className="price">{formatPrice(service.price)}</span>
        <span className="duration-tag">{formatDuration(duration)}</span>
      </div>
      <span className="text-body-sm text-muted">
        {consumerLocationLabel(service.serviceLocationType)}
      </span>

      <Link
        href={`/book?serviceId=${service.id}`}
        className="btn btn-teal self-start"
      >
        Book
      </Link>
    </article>
  )
}
