"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { isAdminEmail } from "@/lib/config"

const NAV_LINKS = [
  { label: "Services", href: "/#services" },
  { label: "Gallery", href: "/gallery" },
]

export default function Nav() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()
  const authed = !!user
  const isAdmin = !!user && isAdminEmail(user.email)

  return (
    <nav className="sticky top-0 z-50 bg-teal-dark border-b border-[var(--color-border)] backdrop-blur-sm">
      <div className="section-container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/braids-by-lana-logo.png"
            alt="Braids by Lana"
            width={120}
            height={44}
            style={{ objectFit: 'contain' }}
            priority
          />
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-body-sm text-muted hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-4">
          {authed ? (
            <>
              {isAdmin && (
                <Link
                  href="/dashboard"
                  className="text-body-sm text-muted hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/account"
                className="text-body-sm text-muted hover:text-white transition-colors"
              >
                My Account
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-body-sm text-muted hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link href="/book" className="btn btn-primary">
                Book Now
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 text-white"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          <span
            className={`block w-6 h-0.5 bg-current transition-all duration-200 ${isOpen ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`block w-6 h-0.5 bg-current transition-all duration-200 ${isOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-6 h-0.5 bg-current transition-all duration-200 ${isOpen ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-teal-dark border-t border-[var(--color-border)]">
          <div className="section-container py-6 flex flex-col gap-5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-body-md text-muted hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="section-divider" />
            {authed ? (
              <>
                {isAdmin && (
                  <Link
                    href="/dashboard"
                    className="text-body-md text-muted hover:text-white transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  href="/account"
                  className="text-body-md text-muted hover:text-white transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  My Account
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-body-md text-muted hover:text-white transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/book"
                  className="btn btn-primary self-start"
                  onClick={() => setIsOpen(false)}
                >
                  Book Now
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
