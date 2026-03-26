// JSON-LD structured data for Google local search ranking
// Renders as <script type="application/ld+json"> in the page head
export default function StructuredData() {
  const business = {
    '@context': 'https://schema.org',
    '@graph': [
      // ── LocalBusiness / AutoRepair ──────────────────────────────
      {
        '@type': ['AutoRepair', 'LocalBusiness', 'TireShop'],
        '@id': 'https://jctireshop.com/#business',
        name: 'JC Central Tire Shop',
        alternateName: ['JC Tire Shop', 'JC Central Tires'],
        description:
          'JC Central Tire Shop in Kent, WA offers new & used tires with warranty, mount & balance, tire repair, rotation, tire plugs, patches, new rims, and all-terrain tires. Walk-ins welcome. Se Habla Español.',
        url: 'https://jctireshop.com',
        logo: 'https://jctireshop.com/logo.png',
        image: 'https://jctireshop.com/og-image.jpg',
        telephone: ['+12538138473', '+12063054349'],
        priceRange: '$$',
        currenciesAccepted: 'USD',
        paymentAccepted: 'Cash, Credit Card, Debit Card',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '208 Central Ave S',
          addressLocality: 'Kent',
          addressRegion: 'WA',
          postalCode: '98032',
          addressCountry: 'US',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 47.3809,
          longitude: -122.2348,
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            opens: '08:30',
            closes: '18:30',
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: 'Sunday',
            opens: '09:00',
            closes: '17:00',
          },
        ],
        sameAs: [
          'https://www.instagram.com/jccentraltireshop',
        ],
        hasMap: 'https://maps.google.com/?q=208+Central+Ave+S+Kent+WA+98032',
        areaServed: [
          { '@type': 'City', name: 'Kent', containedIn: 'Washington' },
          { '@type': 'City', name: 'Auburn', containedIn: 'Washington' },
          { '@type': 'City', name: 'Renton', containedIn: 'Washington' },
          { '@type': 'City', name: 'Federal Way', containedIn: 'Washington' },
          { '@type': 'City', name: 'Tukwila', containedIn: 'Washington' },
          { '@type': 'City', name: 'SeaTac', containedIn: 'Washington' },
        ],
        knowsLanguage: ['en', 'es'],
        slogan: 'Tires You Can Trust — Se Habla Español',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '9',
          bestRating: '5',
          worstRating: '1',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Tire Services',
          itemListElement: [
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'New Tires with Warranty' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Used Tires with Warranty' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Tire Mount & Balance' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Tire Repair — Patch & Plug' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Tire Rotation' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'New Rims' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'All Terrain Tires' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Air Check & Inspection' } },
          ],
        },
        review: [
          {
            '@type': 'Review',
            author: { '@type': 'Person', name: 'M Levkiv' },
            reviewRating: { '@type': 'Rating', ratingValue: '5' },
            reviewBody: 'Great price. Had all four winter tires installed. Steven was very knowledgeable and did an amazing job. I was in and out in less than 10 minutes with four brand new snow tires.',
          },
          {
            '@type': 'Review',
            author: { '@type': 'Person', name: 'Zale Blackwell' },
            reviewRating: { '@type': 'Rating', ratingValue: '5' },
            reviewBody: 'Awesome people. Steven and Edgar were the best. My Chevy Bolt was fixed up, tires mounted and balanced for the best price in Auburn. 10/10.',
          },
          {
            '@type': 'Review',
            author: { '@type': 'Person', name: 'Sierra' },
            reviewRating: { '@type': 'Rating', ratingValue: '5' },
            reviewBody: 'Amazing service. They all came out immediately to help us and we had 7 tires to get rid of, 4 new tires to put on. We literally sat in the car while they did it in less than 20 minutes. 100% recommend JC Central.',
          },
        ],
      },

      // ── WebSite ─────────────────────────────────────────────────
      {
        '@type': 'WebSite',
        '@id': 'https://jctireshop.com/#website',
        url: 'https://jctireshop.com',
        name: 'JC Central Tire Shop',
        description: 'Kent, WA tire shop — new & used tires, mount & balance, repair. Se Habla Español.',
        inLanguage: ['en-US', 'es-US'],
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://jctireshop.com/#contact',
          'query-input': 'required name=search_term_string',
        },
      },

      // ── BreadcrumbList ──────────────────────────────────────────
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://jctireshop.com' },
          { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://jctireshop.com/#services' },
          { '@type': 'ListItem', position: 3, name: 'Reviews', item: 'https://jctireshop.com/#testimonials' },
          { '@type': 'ListItem', position: 4, name: 'Contact', item: 'https://jctireshop.com/#contact' },
        ],
      },

      // ── FAQ — targets "people also ask" in Google ───────────────
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Where is JC Central Tire Shop located?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'JC Central Tire Shop is located at 208 Central Ave S, Kent, WA 98032.',
            },
          },
          {
            '@type': 'Question',
            name: 'What are the hours for JC Central Tire Shop?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'We are open Monday through Saturday 8:30AM–6:30PM and Sunday 9:00AM–5:00PM. Walk-ins are always welcome — no appointment needed.',
            },
          },
          {
            '@type': 'Question',
            name: 'Does JC Central Tire Shop sell used tires with warranty?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes! We sell quality used tires with warranty at unbeatable prices. All tires are inspected before sale.',
            },
          },
          {
            '@type': 'Question',
            name: 'Do you need an appointment at JC Central Tire Shop?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No appointment needed. Walk-ins are always welcome at JC Central Tire Shop in Kent, WA.',
            },
          },
          {
            '@type': 'Question',
            name: '¿Hablan español en JC Central Tire Shop?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Sí, se habla español en JC Central Tire Shop. Estamos ubicados en 208 Central Ave S, Kent, WA 98032. Llámenos al (253) 813-8473.',
            },
          },
          {
            '@type': 'Question',
            name: 'How much does tire installation cost at JC Central Tire Shop?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'JC Central Tire Shop offers competitive pricing on tire installation in Kent, WA. Call us at (253) 813-8473 for a free quote.',
            },
          },
        ],
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(business) }}
    />
  )
}
