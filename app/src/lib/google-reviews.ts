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
      { next: { revalidate: 3600 } }
    )

    if (!res.ok) return getFallbackReviews()

    const data = await res.json()
    const reviews: GoogleReview[] = data?.result?.reviews ?? []

    return reviews
      .filter((r) => r.rating >= 4)
      .sort((a, b) => b.time - a.time)
      .slice(0, 9)
  } catch {
    return getFallbackReviews()
  }
}

function getFallbackReviews(): GoogleReview[] {
  return [
    {
      author_name: 'M Levkiv',
      rating: 5,
      text: 'Great price. Had all four winter tires installed. Steven was very knowledgeable and did an amazing job. I was in and out in less than 10 minutes with four brand new snow tires.',
      time: Date.now() / 1000 - 5184000,
      profile_photo_url: '',
      relative_time_description: '2 months ago',
    },
    {
      author_name: 'Zale Blackwell',
      rating: 5,
      text: 'Awesome people. Steven and Edgar were the best. My Chevy Bolt was fixed up, tires mounted and balanced for the best price in Auburn. 10/10.',
      time: Date.now() / 1000 - 5184000,
      profile_photo_url: '',
      relative_time_description: '2 months ago',
    },
    {
      author_name: 'Primitivo Olmos',
      rating: 5,
      text: 'Steven did an exemplary job. I was in and out with four new tires on my pickup in less than 30 minutes. These guys are awesome.',
      time: Date.now() / 1000 - 5184000,
      profile_photo_url: '',
      relative_time_description: '2 months ago',
    },
    {
      author_name: 'Erin Collier',
      rating: 5,
      text: 'These guys were a lifesaver. I didn\'t get to them until 10 minutes before they closed with my blown-out tire. They were quick and pleasant and got me back on the road in 15 minutes.',
      time: Date.now() / 1000 - 7776000,
      profile_photo_url: '',
      relative_time_description: '3 months ago',
    },
    {
      author_name: 'Kendra Fowler',
      rating: 5,
      text: 'This is a great place to go for your tire needs. Juan, Edgar and Steven helped me out and they were super great with service and quick changing my old tires to my new ones. I highly recommend supporting this business.',
      time: Date.now() / 1000 - 2592000,
      profile_photo_url: '',
      relative_time_description: 'a month ago',
    },
    {
      author_name: 'Sierra',
      rating: 5,
      text: 'Amazing service. They all came out immediately to help us and we had 7 tires to get rid of, 4 new tires to put on. We literally sat in the car while they did it in less than 20 minutes too. 100% recommend JC Central.',
      time: Date.now() / 1000 - 12960000,
      profile_photo_url: '',
      relative_time_description: '5 months ago',
    },
    {
      author_name: 'Kevin Curphey',
      rating: 5,
      text: 'Jose helped me immediately when I pulled in. They were fair priced, and did a fast amazing job, and were open on Sunday when others weren\'t. This was a great experience doing business with them in my time of need.',
      time: Date.now() / 1000 - 7776000,
      profile_photo_url: '',
      relative_time_description: '3 months ago',
    },
    {
      author_name: 'Efer Zamorano',
      rating: 5,
      text: 'I stopped by to get an inspection of my tires as I kept getting a flat. These guys were quick to get on it. They identified the issue and offered me some decent tires to keep my car going. Can\'t thank these guys enough.',
      time: Date.now() / 1000 - 12960000,
      profile_photo_url: '',
      relative_time_description: '5 months ago',
    },
    {
      author_name: 'Eric Urvina',
      rating: 5,
      text: 'Customer service is excellent. Five stars for sure. The people here are friendly, helpful and very professional.',
      time: Date.now() / 1000 - 7776000,
      profile_photo_url: '',
      relative_time_description: '3 months ago',
    },
  ]
}
