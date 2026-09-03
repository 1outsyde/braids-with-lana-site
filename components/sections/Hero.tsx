import Link from "next/link"

export default function Hero() {
  return (
    <section className="relative min-h-[88vh] flex items-center overflow-hidden bg-teal-dark hero-bg">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-hero-overlay pointer-events-none" aria-hidden="true" />

      {/* Decorative rings */}
      <div
        className="absolute right-[-15%] top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-teal/10 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute right-[-8%] top-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-teal/5 pointer-events-none"
        aria-hidden="true"
      />

      <div className="section-container relative z-10 py-section-lg">
        <div className="max-w-2xl flex flex-col gap-8 animate-fade-up">
          <p className="eyebrow">Professional Hair Braiding</p>

          <h1 className="font-display text-display-xl text-white">
            Every braid<br />
            installed with{" "}
            <span className="text-gradient">love.</span>
          </h1>

          <p className="text-body-xl text-muted max-w-lg">
            Knotless braids, box braids, faux locs, and more. Book online —
            no DMs, no waiting.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/book" className="btn btn-primary">
              Book an appointment
            </Link>
            <a href="#services" className="btn btn-outline">
              View services
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
