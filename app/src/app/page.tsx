import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Services from '@/components/Services'
import SnapFinance from '@/components/SnapFinance'
import Gallery from '@/components/Gallery'
import Testimonials from '@/components/Testimonials'
import ContactForm from '@/components/ContactForm'
import Footer from '@/components/Footer'
import StructuredData from '@/components/StructuredData'
import { getGoogleReviews } from '@/lib/google-reviews'

export default async function HomePage() {
  const reviews = await getGoogleReviews()

  return (
    <>
      <StructuredData />
      <Navbar />
      <main>
        <Hero />
        <Gallery />
        <Services />
        <SnapFinance />
        <Testimonials reviews={reviews} />
        <ContactForm />
      </main>
      <Footer />
    </>
  )
}
