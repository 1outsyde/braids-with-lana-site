import Link from "next/link"

export default function BookingCTA() {
  return (
    <section className="bg-teal py-section-md">
      <div className="section-container flex flex-col items-center text-center gap-6">
        <h2 className="font-display text-display-lg text-onyx">
          Ready to get braided?
        </h2>
        <p className="text-body-lg text-onyx/80 max-w-lg">
          Book online 24/7. Pick your style, choose a time, we&apos;ll handle
          the rest.
        </p>
        <Link href="/book" className="btn btn-primary">
          Book your appointment
        </Link>
        <p className="text-body-xs text-onyx/60">
          Create an account to earn loyalty points with every visit.
        </p>
      </div>
    </section>
  )
}
