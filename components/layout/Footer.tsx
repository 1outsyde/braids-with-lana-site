import Link from "next/link"
import { VENDOR_CONFIG } from "@/lib/config"

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-teal-dark border-t border-[var(--color-border)]">
      <div className="section-container py-section-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="flex flex-col gap-5">
            <p className="font-display text-display-sm text-white">
              {VENDOR_CONFIG.vendorName}
            </p>
            <p className="text-body-sm text-muted leading-relaxed">
              Professional hair braiding by {VENDOR_CONFIG.ownerName}. Serving
              Saint Albans, Queens, NY.
            </p>
            <Link href="/book" className="btn btn-primary self-start">
              Book an appointment
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-4">
            <p className="eyebrow">Navigation</p>
            <Link
              href="/#services"
              className="text-body-sm text-muted hover:text-white transition-colors"
            >
              Services & Pricing
            </Link>
            <Link
              href="/gallery"
              className="text-body-sm text-muted hover:text-white transition-colors"
            >
              Gallery
            </Link>
            <Link
              href="/book"
              className="text-body-sm text-muted hover:text-white transition-colors"
            >
              Book Now
            </Link>
          </div>

          {/* Account */}
          <div className="flex flex-col gap-4">
            <p className="eyebrow">Account</p>
            <Link
              href="/login"
              className="text-body-sm text-muted hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-body-sm text-muted hover:text-white transition-colors"
            >
              Create account
            </Link>
            <Link
              href="/account"
              className="text-body-sm text-muted hover:text-white transition-colors"
            >
              Rewards points
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-body-xs text-muted">
            &copy; {year} {VENDOR_CONFIG.vendorName}. All rights reserved.
          </p>
          <a
            href="https://goutsyde.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-body-xs text-muted hover:text-white transition-colors"
          >
            Powered by{" "}
            <span className="font-semibold text-teal">Outsyde</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
