export default function Contact() {
  return (
    <section id="contact" className="py-section-lg bg-teal-dark">
      <div className="section-container">
        <div className="flex flex-col gap-3 mb-12">
          <p className="eyebrow">Get in touch</p>
          <h2 className="font-display text-display-lg text-white">Contact</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <p className="eyebrow">Location</p>
              <p className="text-body-lg text-white">Saint Albans, Queens, NY</p>
              <p className="text-body-sm text-muted">
                Exact address provided upon booking confirmation.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="eyebrow">Email</p>
              <a
                href="mailto:donialana15@gmail.com"
                className="text-body-lg text-teal hover:text-teal-300 transition-colors"
              >
                donialana15@gmail.com
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-6 md:border-l md:border-[var(--color-border)] md:pl-12">
            <p className="text-body-md text-muted">
              Ready to book? Use our online booking system to choose your
              service, pick a time, and pay — all in one place. No DMs, no
              waiting. Just great braids.
            </p>
            <a href="/book" className="btn btn-primary self-start">
              Book online
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
