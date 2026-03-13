import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Services from '@/components/Services'
import Testimonials from '@/components/Testimonials'
import CalendlyWidget from '@/components/CalendlyWidget'
import ContactForm from '@/components/ContactForm'
import Footer from '@/components/Footer'
import { getGoogleReviews } from '@/lib/google-reviews'

export default async function HomePage() {
  const reviews = await getGoogleReviews()

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Testimonials reviews={reviews} />
        <CalendlyWidget />
        <ContactForm />
      </main>
      <Footer />
    </>
  )
}
