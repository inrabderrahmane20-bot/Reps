import type { Availability } from '@/components/ui/availability-badge';

export const newsItems = [
  {
    id: 'n1',
    title: 'New tramway line to connect Guéliz and the Medina by 2027',
    category: 'Transportation',
    neighborhood: 'Guéliz',
    date: '2h ago',
    image:
      'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?q=80&w=800&auto=format&fit=crop',
    author: 'Medina Local Desk',
    summary:
      'The city council confirmed funding for a new tramway line linking Guéliz to the Medina, with construction expected to begin next year.',
    content: [
      'Marrakech\u2019s city council has confirmed funding for a new tramway line that will connect Guéliz to the Medina, aiming to ease congestion along one of the city\u2019s busiest corridors.',
      'Construction is expected to begin next year, with the first phase covering roughly six kilometers and eight stations. Officials say the line has been designed to preserve views of key landmarks along the route.',
      'Local business owners in Guéliz have welcomed the announcement, though some residents have raised concerns about disruption during the construction phase, which is expected to last around eighteen months.',
      'A public consultation period will open in the coming weeks, giving residents the chance to review the proposed station locations before final approval.',
    ],
    tags: ['Tramway', 'Guéliz', 'Medina', 'Infrastructure'],
  },
  {
    id: 'n2',
    title: 'Jemaa el-Fna weekend market extends opening hours for the summer',
    category: 'Local Life',
    neighborhood: 'Medina',
    date: '5h ago',
    image:
      'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop',
    author: 'Medina Local Desk',
    summary:
      'Stalls and food vendors around Jemaa el-Fna will stay open later through the summer months following a request from local merchants.',
    content: [
      'The weekend market around Jemaa el-Fna will extend its opening hours through the summer, following a request submitted by a coalition of local merchants earlier this month.',
      'Vendors say the change reflects shifting habits among both residents and visitors, who increasingly prefer to shop and eat later in the evening once temperatures cool down.',
      'The extended hours will apply on Fridays, Saturdays and Sundays, with the square expected to stay lively until closer to midnight during peak summer weeks.',
    ],
    tags: ['Medina', 'Market', 'Jemaa el-Fna'],
  },
  {
    id: 'n3',
    title: 'Hivernage business district opens applications for new shopfronts',
    category: 'New Businesses',
    neighborhood: 'Hivernage',
    date: '1d ago',
    image:
      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=800&auto=format&fit=crop',
    author: 'Medina Local Desk',
    summary:
      'A new stretch of retail units in Hivernage is now open for applications, with priority given to independent and local businesses.',
    content: [
      'The Hivernage business district has opened applications for a new stretch of ground-floor retail units, with priority reportedly given to independent and locally owned businesses.',
      'The initiative is part of a broader push to diversify the neighborhood beyond hotels and cafés, and organizers say they are especially interested in applications from craftspeople, boutique retailers and specialty food vendors.',
      'Applications will remain open for the next month, with successful applicants expected to be notified before the end of the year.',
    ],
    tags: ['Hivernage', 'Business', 'Opening'],
  },
];

export const communities = [
  {
    id: 'c1',
    name: 'Marrakech Swimming Club',
    members: 842,
    category: 'Hobbies',
    joined: true,
    cover:
      'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=1200&auto=format&fit=crop',
    city: 'Marrakech',
    description:
      'For anyone who swims for fun, fitness or competition. We organize weekly pool sessions, open-water meetups and the occasional early-morning swim before the city wakes up.',
    rules: [
      'Be respectful to other members, in the pool and in chat.',
      'No promotion of unrelated businesses or services.',
      'Confirm your spot before joining a session — cancel early if plans change.',
    ],
    admins: ['Nadia K.', 'Omar S.'],
    posts: [
      {
        id: 'cp1',
        author: 'Nadia K.',
        content: 'Saturday session moved to 18:00 because of the heat — same pool, see you there!',
        date: '3h ago',
        likes: 24,
        comments: 6,
      },
      {
        id: 'cp2',
        author: 'Omar S.',
        content: 'Looking for 2 more people for the open-water swim next weekend near Lalla Takerkoust.',
        date: '1d ago',
        likes: 12,
        comments: 9,
      },
    ],
  },
  {
    id: 'c2',
    name: 'Guéliz Parents Network',
    members: 1290,
    category: 'Family',
    joined: true,
    cover:
      'https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=1200&auto=format&fit=crop',
    city: 'Marrakech',
    description:
      'A support network for parents in and around Guéliz — sharing recommendations for schools, pediatricians, playdates and everything in between.',
    rules: [
      'No judgment — every parenting style is welcome here.',
      'Keep children\u2019s photos private unless a parent explicitly shares them.',
      'Recommendations only, please — no direct sales pitches.',
    ],
    admins: ['Salma B.'],
    posts: [
      {
        id: 'cp3',
        author: 'Salma B.',
        content: 'Anyone have a good recommendation for a pediatric dentist near Guéliz?',
        date: '6h ago',
        likes: 8,
        comments: 14,
      },
    ],
  },
  {
    id: 'c3',
    name: 'Medina Photography Walkers',
    members: 356,
    category: 'Hobbies',
    joined: false,
    cover:
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop',
    city: 'Marrakech',
    description:
      'Weekly photo walks through the alleys, souks and rooftops of the Medina. All skill levels welcome, from phone photographers to full-frame purists.',
    rules: [
      'Be considerate of residents and shopkeepers when photographing in the Medina.',
      'Share your best shot from each walk in the group feed.',
      'No spam — this is a community, not a marketplace for gear.',
    ],
    admins: ['Youssef A.'],
    posts: [
      {
        id: 'cp4',
        author: 'Youssef A.',
        content: 'Sunday walk starts at Bab Doukkala, 9:00 sharp — golden hour light should be great.',
        date: '2d ago',
        likes: 31,
        comments: 5,
      },
    ],
  },
  {
    id: 'c4',
    name: 'Marrakech Travelers',
    members: 2110,
    category: 'Lifestyle',
    joined: false,
    cover:
      'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?q=80&w=1200&auto=format&fit=crop',
    city: 'Marrakech',
    description:
      'For travelers passing through or newly settled in Marrakech — tips on neighborhoods, visas, day trips and meeting other travelers.',
    rules: [
      'Be welcoming — many members are new to the city.',
      'Tag posts with the relevant neighborhood when possible.',
      'No unsolicited DMs to other members.',
    ],
    admins: ['Ines D.', 'Karim L.'],
    posts: [
      {
        id: 'cp5',
        author: 'Ines D.',
        content: 'Just got back from a day trip to the Ourika Valley — happy to share the route if anyone wants it.',
        date: '4h ago',
        likes: 19,
        comments: 7,
      },
    ],
  },
];

export const activities = [
  {
    id: 'a1',
    title: 'Saturday swimming session',
    category: 'Swimming',
    date: 'Sat · 18:00',
    location: 'Guéliz',
    participants: 7,
    max: 10,
    description:
      'A relaxed weekly swim at a private pool in Guéliz, organized by the Marrakech Swimming Club. All levels welcome — we usually split into a lap-swimming lane and a casual one.',
    host: 'Marrakech Swimming Club',
    equipment: ['Swimwear', 'Towel', 'Goggles (optional)'],
    minParticipants: 4,
    level: 'All levels',
  },
  {
    id: 'a2',
    title: '5-a-side football',
    category: 'Football',
    date: 'Tonight · 20:00',
    location: 'Hivernage',
    participants: 8,
    max: 10,
    description:
      'Friendly 5-a-side match on an artificial pitch in Hivernage. Two spots left — bring indoor or turf shoes, the pitch gets booked for exactly 90 minutes.',
    host: 'Ahmed R.',
    equipment: ['Turf/indoor shoes', 'Water bottle'],
    minParticipants: 6,
    level: 'Intermediate',
  },
  {
    id: 'a3',
    title: 'Photography walk in the Medina',
    category: 'Photography',
    date: 'Sun · 09:00',
    location: 'Medina',
    participants: 4,
    max: 12,
    description:
      'A slow-paced walk through the Medina\u2019s alleys and souks, organized by the Medina Photography Walkers. We\u2019ll stop for mint tea halfway through and share shots at the end.',
    host: 'Medina Photography Walkers',
    equipment: ['Camera or phone', 'Comfortable shoes'],
    minParticipants: 3,
    level: 'All levels',
  },
];

export const providers: {
  id: string;
  name: string;
  category: string;
  title?: string;
  rating: number;
  reviews: number;
  distanceKm: number;
  availability: Availability;
  verified: boolean;
  description?: string;
  specialties?: string[];
  serviceArea?: string;
  priceRange?: string;
  portfolio?: string[];
  reviewsList?: { author: string; rating: number; content: string; date: string }[];
}[] = [
  {
    id: 'p1',
    name: 'Rachid B.',
    category: 'Plumber',
    title: 'Licensed plumber, 12 years experience',
    rating: 4.8,
    reviews: 132,
    distanceKm: 2.3,
    availability: 'available',
    verified: true,
    description:
      'Licensed plumber covering leak repairs, installations and full bathroom fit-outs across Marrakech. Same-day response for emergencies within the service area.',
    specialties: ['Leak repair', 'Water heater installation', 'Bathroom renovation', 'Emergency callouts'],
    serviceArea: 'Guéliz, Hivernage, Medina — within 8 km',
    priceRange: '150–400 MAD / callout',
    portfolio: [
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=800&auto=format&fit=crop',
    ],
    reviewsList: [
      { author: 'Salma B.', rating: 5, content: 'Came within the hour for a burst pipe, very professional.', date: '2 weeks ago' },
      { author: 'Hicham T.', rating: 4.5, content: 'Good work on the bathroom install, slightly late but kept us posted.', date: '1 month ago' },
    ],
  },
  {
    id: 'p2',
    name: 'Amal E.',
    category: 'Electrician',
    title: 'Certified electrician, residential & commercial',
    rating: 4.6,
    reviews: 84,
    distanceKm: 3.1,
    availability: 'later',
    verified: true,
    description:
      'Certified electrician handling wiring, panel upgrades and smart home installations. Comfortable with both older riad wiring and new-build apartments.',
    specialties: ['Panel upgrades', 'Smart home wiring', 'Lighting design', 'Safety inspections'],
    serviceArea: 'Guéliz, Semlalia — within 10 km',
    priceRange: '200–500 MAD / callout',
    portfolio: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop',
    ],
    reviewsList: [
      { author: 'Youssef A.', rating: 5, content: 'Rewired our whole apartment cleanly and on schedule.', date: '3 weeks ago' },
    ],
  },
  {
    id: 'p3',
    name: 'Karim T.',
    category: 'House cleaning',
    title: 'Home cleaning, weekly or one-off',
    rating: 4.9,
    reviews: 201,
    distanceKm: 1.5,
    availability: 'available',
    verified: false,
    description:
      'Thorough home cleaning service for apartments, villas and riads. Offers recurring weekly plans as well as one-off deep cleans before or after events.',
    specialties: ['Deep cleaning', 'Recurring weekly service', 'Move-in / move-out cleaning'],
    serviceArea: 'Marrakech city center — within 6 km',
    priceRange: '120–300 MAD / visit',
    portfolio: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop',
    ],
    reviewsList: [
      { author: 'Nadia K.', rating: 5, content: 'Always on time and incredibly thorough, highly recommend.', date: '1 week ago' },
      { author: 'Ines D.', rating: 5, content: 'Been using Karim weekly for months, never disappointed.', date: '2 months ago' },
    ],
  },
];

export const meetingProfiles = [
  { id: 'm1', name: 'Sara', age: 27, city: 'Marrakech · Guéliz', compatibility: 82, sharedInterests: ['Swimming', 'Travel', 'Photography'], lookingFor: 'Serious relationship' },
  { id: 'm2', name: 'Younes', age: 31, city: 'Marrakech · Medina', compatibility: 74, sharedInterests: ['Cycling', 'Cooking'], lookingFor: 'Marriage' },
];

export const meetingRooms = [
  { id: 'r1', name: 'Marrakech Serious Meetings', topic: 'Serious relationships & marriage', online: 24 },
  { id: 'r2', name: 'Professionals Marrakech', topic: 'Young professionals', online: 17 },
  { id: 'r3', name: 'Travelers Looking to Meet', topic: 'For people who love to travel', online: 9 },
];

export const contacts = [
  { id: 'u1', name: 'Sarah', status: 'online' as const },
  { id: 'u2', name: 'Youssef', status: 'online' as const },
  { id: 'u3', name: 'Amine', status: 'away' as const },
  { id: 'u4', name: 'Lina', status: 'online' as const },
];

export const sampleConversation = [
  { author: 'Sarah', text: 'Hello!', me: false },
  { author: 'Youssef', text: 'Hi 👋', me: true },
  { author: 'Sarah', text: 'Nice to meet you', me: false },
];
