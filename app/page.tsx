import Hero from "@/components/sections/Hero";
import ServiceMenu from "@/components/sections/ServiceMenu";
import BookingCTA from "@/components/layout/BookingCTA";
import Contact from "@/components/sections/Contact";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServiceMenu />
      <BookingCTA />
      <Contact />
    </>
  );
}
