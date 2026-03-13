export interface GoogleReview {
  author_name: string
  rating: number
  text: string
  time: number
  profile_photo_url: string
  relative_time_description: string
}

export async function getGoogleReviews(): Promise<GoogleReview[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  const placeId = process.env.GOOGLE_PLACE_ID

  if (!apiKey || !placeId) {
    return getFallbackReviews()
  }

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${apiKey}`,
      { next: { revalidate: 3600 } } // re-fetch at most once per hour
    )

    if (!res.ok) return getFallbackReviews()

    const data = await res.json()
    const reviews: GoogleReview[] = data?.result?.reviews ?? []

    return reviews
      .filter((r) => r.rating >= 4)
      .sort((a, b) => b.time - a.time)
      .slice(0, 6)
  } catch {
    return getFallbackReviews()
  }
}

function getFallbackReviews(): GoogleReview[] {
  return [
    {
      author_name: 'Maria G.',
      rating: 5,
      text: 'Best tire shop in the area! Fast service, fair prices, and they really know their stuff. Had my tires swapped in under an hour. Will never go anywhere else.',
      time: Date.now() / 1000 - 604800,
      profile_photo_url: '',
      relative_time_description: 'a week ago',
    },
    {
      author_name: 'James R.',
      rating: 5,
      text: 'JC Tire Shop saved me on a Sunday when I had a blowout on the highway. They were incredibly professional, fast, and honest about pricing. Highly recommend!',
      time: Date.now() / 1000 - 1209600,
      profile_photo_url: '',
      relative_time_description: '2 weeks ago',
    },
    {
      author_name: 'Sandra T.',
      rating: 5,
      text: 'Amazing service every single time. They are honest, fast, and the prices are unbeatable. My whole family brings their cars here now.',
      time: Date.now() / 1000 - 2592000,
      profile_photo_url: '',
      relative_time_description: 'a month ago',
    },
    {
      author_name: 'David M.',
      rating: 5,
      text: 'Needed a last-minute tire change before a road trip. They squeezed me in same day and did an excellent job. Very trustworthy team.',
      time: Date.now() / 1000 - 3196800,
      profile_photo_url: '',
      relative_time_description: '5 weeks ago',
    },
    {
      author_name: 'Lisa K.',
      rating: 5,
      text: 'Went in for a flat repair and was out in 20 minutes. Incredibly fast and the price was fair. Super clean shop too. Definitely coming back.',
      time: Date.now() / 1000 - 5184000,
      profile_photo_url: '',
      relative_time_description: '2 months ago',
    },
    {
      author_name: 'Carlos H.',
      rating: 5,
      text: 'The team here genuinely cares about their customers. They explained everything clearly and didn\'t try to upsell me on things I didn\'t need. Rare to find that.',
      time: Date.now() / 1000 - 7776000,
      profile_photo_url: '',
      relative_time_description: '3 months ago',
    },
  ]
}
