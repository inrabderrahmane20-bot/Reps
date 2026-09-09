// Generates src/data/db.seed.json — plain Node script, no deps beyond built-ins,
// so it can run without `npm install`. Passwords are hashed with the same
// scrypt scheme as src/lib/auth.ts (kept duplicated here to stay dependency-free).
import { randomBytes, scryptSync } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function hash(password) {
  const salt = randomBytes(16).toString('hex');
  const h = scryptSync(password, salt, 64).toString('hex');
  return { salt, hash: h };
}

const now = new Date();
const iso = (daysAgo = 0, hoursAgo = 0) =>
  new Date(now.getTime() - daysAgo * 86400000 - hoursAgo * 3600000).toISOString();

const users = [];
const notifications = [];

function addUser(u) {
  const { salt, hash: h } = hash(u.password);
  const user = {
    id: u.id,
    email: u.email,
    passwordHash: h,
    salt,
    firstName: u.firstName,
    lastName: u.lastName,
    city: u.city ?? 'Marrakech',
    neighborhood: u.neighborhood ?? 'Guéliz',
    avatar: u.avatar ?? `https://i.pravatar.cc/200?u=${u.id}`,
    languages: u.languages ?? ['English', 'French'],
    interests: u.interests ?? [],
    bio: u.bio ?? '',
    role: u.role ?? 'user',
    status: u.status ?? 'active',
    providerStatus: u.providerStatus ?? 'none',
    provider: u.provider ?? null,
    blockedUserIds: [],
    createdAt: u.createdAt ?? iso(30),
  };
  users.push(user);
  return user;
}

// --- Admin ---
addUser({
  id: 'u_admin',
  email: 'admin@medina.ma',
  password: 'admin123',
  firstName: 'Yasmine',
  lastName: 'Admin',
  role: 'admin',
  neighborhood: 'Guéliz',
  bio: 'Platform administrator.',
  createdAt: iso(200),
});

// --- Regular test user (the one you should log in as to click around) ---
addUser({
  id: 'u_demo',
  email: 'demo@medina.ma',
  password: 'demo1234',
  firstName: 'Abdou',
  lastName: 'Demo',
  neighborhood: 'Guéliz',
  interests: ['Swimming', 'Football', 'Photography', 'Travel'],
  bio: 'Just here to try things out.',
  createdAt: iso(60),
});

// --- Approved, visible providers ---
addUser({
  id: 'u_p1',
  email: 'rachid.plumber@medina.ma',
  password: 'demo1234',
  firstName: 'Rachid',
  lastName: 'B.',
  neighborhood: 'Sidi Youssef Ben Ali',
  interests: ['Football'],
  bio: 'Licensed plumber, 12 years in Marrakech.',
  providerStatus: 'approved',
  createdAt: iso(400),
  provider: {
    category: 'Plumbing',
    title: 'Licensed plumber, 12 years experience',
    description:
      'Licensed plumber covering leak repairs, installations and full bathroom fit-outs across Marrakech. Same-day response for emergencies within the service area.',
    specialties: ['Leak repair', 'Water heater installation', 'Bathroom renovation', 'Emergency callouts'],
    serviceArea: 'Guéliz, Hivernage, Medina — within 8 km',
    priceRange: '150–400 MAD / callout',
    availability: 'available',
    lat: 31.6423,
    lng: -8.0089,
    portfolio: [
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=800&auto=format&fit=crop',
    ],
    documents: ['id_card.pdf', 'plumbing_certificate.pdf'],
  },
});

addUser({
  id: 'u_p2',
  email: 'amal.electric@medina.ma',
  password: 'demo1234',
  firstName: 'Amal',
  lastName: 'E.',
  neighborhood: 'Semlalia',
  bio: 'Certified electrician, residential & commercial.',
  providerStatus: 'approved',
  createdAt: iso(300),
  provider: {
    category: 'Electricity',
    title: 'Certified electrician, residential & commercial',
    description:
      'Certified electrician handling wiring, panel upgrades and smart home installations. Comfortable with both older riad wiring and new-build apartments.',
    specialties: ['Panel upgrades', 'Smart home wiring', 'Lighting design', 'Safety inspections'],
    serviceArea: 'Guéliz, Semlalia — within 10 km',
    priceRange: '200–500 MAD / callout',
    availability: 'later',
    lat: 31.6511,
    lng: -8.0126,
    portfolio: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop'],
    documents: ['id_card.pdf', 'electrician_license.pdf'],
  },
});

addUser({
  id: 'u_p3',
  email: 'karim.cleaning@medina.ma',
  password: 'demo1234',
  firstName: 'Karim',
  lastName: 'T.',
  neighborhood: 'Medina',
  bio: 'Home cleaning, weekly or one-off.',
  providerStatus: 'approved',
  createdAt: iso(250),
  provider: {
    category: 'Cleaning',
    title: 'Home cleaning, weekly or one-off',
    description:
      'Thorough home cleaning service for apartments, villas and riads. Offers recurring weekly plans as well as one-off deep cleans before or after events.',
    specialties: ['Deep cleaning', 'Recurring weekly service', 'Move-in / move-out cleaning'],
    serviceArea: 'Marrakech city center — within 6 km',
    priceRange: '120–300 MAD / visit',
    availability: 'available',
    lat: 31.6295,
    lng: -7.9811,
    portfolio: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop'],
    documents: ['id_card.pdf'],
  },
});

// --- A provider application still pending admin review (to test the verification queue) ---
addUser({
  id: 'u_p4',
  email: 'nadia.photo@medina.ma',
  password: 'demo1234',
  firstName: 'Nadia',
  lastName: 'K.',
  neighborhood: 'Guéliz',
  bio: 'Freelance photographer, just applied to become a provider.',
  providerStatus: 'pending',
  createdAt: iso(5),
  provider: {
    category: 'Photography',
    title: 'Event & portrait photographer',
    description: 'Weddings, portraits and small events around Marrakech.',
    specialties: ['Weddings', 'Portraits', 'Events'],
    serviceArea: 'Marrakech — within 15 km',
    priceRange: '800–3000 MAD / session',
    availability: 'available',
    lat: 31.6398,
    lng: -8.0089,
    portfolio: [],
    documents: ['id_card.pdf', 'portfolio_link.pdf'],
  },
});

// --- A provider application that was rejected (to test that path) ---
addUser({
  id: 'u_p5',
  email: 'hicham.moving@medina.ma',
  password: 'demo1234',
  firstName: 'Hicham',
  lastName: 'L.',
  neighborhood: 'Sidi Ghanem',
  providerStatus: 'rejected',
  createdAt: iso(20),
  provider: {
    category: 'Moving',
    title: 'Moving & transport',
    description: 'Moving services, small truck available.',
    specialties: ['Furniture moving'],
    serviceArea: 'Marrakech',
    priceRange: '300-900 MAD',
    availability: 'offline',
    lat: 31.6675,
    lng: -8.0325,
    portfolio: [],
    documents: ['id_card.pdf'],
    rejectionReason: 'Missing valid business registration document — please resubmit.',
  },
});

// --- A few more plain community members, for join counts / posts / chat ---
[
  ['u_sarah', 'Sarah', 'M.', 'Guéliz', ['Swimming', 'Travel', 'Photography']],
  ['u_youssef', 'Youssef', 'A.', 'Medina', ['Cycling', 'Cooking']],
  ['u_amine', 'Amine', 'R.', 'Hivernage', ['Football', 'Gaming']],
  ['u_lina', 'Lina', 'D.', 'Guéliz', ['Books', 'Cinema']],
  ['u_salma', 'Salma', 'B.', 'Guéliz', ['Parenting']],
  ['u_omar', 'Omar', 'S.', 'Medina', ['Swimming']],
  ['u_ines', 'Ines', 'D.', 'Hivernage', ['Travel']],
  ['u_younes', 'Younes', 'K.', 'Medina', ['Cycling', 'Cooking']],
].forEach(([id, first, last, hood, interests]) => {
  addUser({
    id,
    email: `${id.slice(2)}@medina.ma`,
    password: 'demo1234',
    firstName: first,
    lastName: last,
    neighborhood: hood,
    interests,
    createdAt: iso(90),
  });
});

// --- News ---
const news = [
  {
    id: 'n1',
    title: 'New tramway line to connect Guéliz and the Medina by 2027',
    category: 'Transportation',
    city: 'Marrakech',
    neighborhood: 'Guéliz',
    date: iso(0, 2),
    image: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?q=80&w=800&auto=format&fit=crop',
    author: 'Medina Local Desk',
    summary:
      'The city council confirmed funding for a new tramway line linking Guéliz to the Medina, with construction expected to begin next year.',
    content: [
      'Marrakech’s city council has confirmed funding for a new tramway line that will connect Guéliz to the Medina, aiming to ease congestion along one of the city’s busiest corridors.',
      'Construction is expected to begin next year, with the first phase covering roughly six kilometers and eight stations.',
      'A public consultation period will open in the coming weeks, giving residents the chance to review the proposed station locations before final approval.',
    ],
    tags: ['Tramway', 'Guéliz', 'Medina', 'Infrastructure'],
    status: 'published',
  },
  {
    id: 'n2',
    title: 'Jemaa el-Fna weekend market extends opening hours for the summer',
    category: 'Local Life',
    city: 'Marrakech',
    neighborhood: 'Medina',
    date: iso(0, 5),
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop',
    author: 'Medina Local Desk',
    summary: 'Stalls and food vendors around Jemaa el-Fna will stay open later through the summer months.',
    content: [
      'The weekend market around Jemaa el-Fna will extend its opening hours through the summer, following a request from local merchants.',
      'The extended hours will apply on Fridays, Saturdays and Sundays.',
    ],
    tags: ['Medina', 'Market', 'Jemaa el-Fna'],
    status: 'published',
  },
  {
    id: 'n3',
    title: 'Hivernage business district opens applications for new shopfronts',
    category: 'New Businesses',
    city: 'Marrakech',
    neighborhood: 'Hivernage',
    date: iso(1),
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=800&auto=format&fit=crop',
    author: 'Medina Local Desk',
    summary: 'A new stretch of retail units in Hivernage is now open for applications.',
    content: [
      'The Hivernage business district has opened applications for a new stretch of ground-floor retail units.',
      'Applications will remain open for the next month.',
    ],
    tags: ['Hivernage', 'Business', 'Opening'],
    status: 'published',
  },
];

// --- Communities ---
const communities = [
  {
    id: 'c1',
    name: 'Marrakech Swimming Club',
    description:
      'For anyone who swims for fun, fitness or competition. We organize weekly pool sessions, open-water meetups and the occasional early-morning swim.',
    city: 'Marrakech',
    category: 'Hobbies',
    cover: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=1200&auto=format&fit=crop',
    rules: [
      'Be respectful to other members, in the pool and in chat.',
      'No promotion of unrelated businesses or services.',
      'Confirm your spot before joining a session — cancel early if plans change.',
    ],
    creatorId: 'u_omar',
    adminIds: ['u_omar'],
    memberIds: ['u_omar', 'u_demo', 'u_sarah'],
    lat: 31.6435,
    lng: -8.0126,
    createdAt: iso(180),
  },
  {
    id: 'c2',
    name: 'Guéliz Parents Network',
    description: 'A support network for parents in and around Guéliz.',
    city: 'Marrakech',
    category: 'Family',
    cover: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=1200&auto=format&fit=crop',
    rules: ['No judgment — every parenting style is welcome here.', 'Recommendations only, please.'],
    creatorId: 'u_salma',
    adminIds: ['u_salma'],
    memberIds: ['u_salma', 'u_lina'],
    lat: 31.6511,
    lng: -8.0089,
    createdAt: iso(150),
  },
  {
    id: 'c3',
    name: 'Medina Photography Walkers',
    description: 'Weekly photo walks through the alleys, souks and rooftops of the Medina.',
    city: 'Marrakech',
    category: 'Hobbies',
    cover: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop',
    rules: ['Be considerate of residents and shopkeepers.', 'No spam.'],
    creatorId: 'u_youssef',
    adminIds: ['u_youssef'],
    memberIds: ['u_youssef'],
    lat: 31.6295,
    lng: -7.9897,
    createdAt: iso(120),
  },
  {
    id: 'c4',
    name: 'Marrakech Travelers',
    description: 'For travelers passing through or newly settled in Marrakech.',
    city: 'Marrakech',
    category: 'Lifestyle',
    cover: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?q=80&w=1200&auto=format&fit=crop',
    rules: ['Be welcoming.', 'No unsolicited DMs to other members.'],
    creatorId: 'u_ines',
    adminIds: ['u_ines'],
    memberIds: ['u_ines', 'u_younes'],
    lat: 31.6216,
    lng: -8.0022,
    createdAt: iso(100),
  },
];

const communityPosts = [
  {
    id: 'cp1',
    communityId: 'c1',
    authorId: 'u_omar',
    content: 'Saturday session moved to 18:00 because of the heat — same pool, see you there!',
    createdAt: iso(0, 3),
    likeUserIds: ['u_sarah', 'u_demo'],
    comments: [{ id: 'cm1', authorId: 'u_sarah', content: 'Perfect, see you there!', createdAt: iso(0, 2) }],
  },
  {
    id: 'cp2',
    communityId: 'c1',
    authorId: 'u_demo',
    content: 'Looking for 2 more people for the open-water swim next weekend near Lalla Takerkoust.',
    createdAt: iso(1),
    likeUserIds: ['u_omar'],
    comments: [],
  },
  {
    id: 'cp3',
    communityId: 'c2',
    authorId: 'u_salma',
    content: 'Anyone have a good recommendation for a pediatric dentist near Guéliz?',
    createdAt: iso(0, 6),
    likeUserIds: [],
    comments: [],
  },
];

// --- Activities ---
const activities = [
  {
    id: 'a1',
    creatorId: 'u_omar',
    title: 'Saturday swimming session',
    category: 'Swimming',
    description:
      'A relaxed weekly swim at a private pool in Guéliz, organized by the Marrakech Swimming Club. All levels welcome.',
    date: 'Sat · 18:00',
    location: 'Guéliz',
    city: 'Marrakech',
    lat: 31.6435,
    lng: -8.0126,
    max: 10,
    min: 4,
    equipment: ['Swimwear', 'Towel', 'Goggles (optional)'],
    level: 'All levels',
    visibility: 'public',
    status: 'open',
    participantIds: ['u_omar', 'u_sarah', 'u_demo'],
    pendingParticipantIds: [],
    createdAt: iso(3),
  },
  {
    id: 'a2',
    creatorId: 'u_amine',
    title: '5-a-side football',
    category: 'Football',
    description:
      'Friendly 5-a-side match on an artificial pitch in Hivernage. Bring indoor or turf shoes.',
    date: 'Tonight · 20:00',
    location: 'Hivernage',
    city: 'Marrakech',
    lat: 31.6295,
    lng: -8.0325,
    max: 10,
    min: 6,
    equipment: ['Turf/indoor shoes', 'Water bottle'],
    level: 'Intermediate',
    visibility: 'public',
    status: 'open',
    participantIds: ['u_amine', 'u_youssef'],
    pendingParticipantIds: [],
    createdAt: iso(1),
  },
  {
    id: 'a3',
    creatorId: 'u_youssef',
    title: 'Photography walk in the Medina',
    category: 'Photography',
    description:
      'A slow-paced walk through the Medina’s alleys and souks. We’ll stop for mint tea halfway through.',
    date: 'Sun · 09:00',
    location: 'Medina',
    city: 'Marrakech',
    lat: 31.6295,
    lng: -7.9897,
    max: 12,
    min: 3,
    equipment: ['Camera or phone', 'Comfortable shoes'],
    level: 'All levels',
    visibility: 'public',
    status: 'open',
    participantIds: ['u_youssef'],
    pendingParticipantIds: [],
    createdAt: iso(2),
  },
];

// --- Meeting profiles ---
const meetingProfiles = [
  {
    userId: 'u_sarah',
    age: 27,
    gender: 'Female',
    maritalStatus: 'Single',
    profession: 'Architect',
    lookingFor: 'Serious relationship',
    preferredAgeMin: 27,
    preferredAgeMax: 36,
    visibility: 'everyone',
    active: true,
  },
  {
    userId: 'u_younes',
    age: 31,
    gender: 'Male',
    maritalStatus: 'Single',
    profession: 'Engineer',
    lookingFor: 'Marriage',
    preferredAgeMin: 24,
    preferredAgeMax: 32,
    visibility: 'everyone',
    active: true,
  },
  {
    userId: 'u_demo',
    age: 29,
    gender: 'Male',
    maritalStatus: 'Single',
    profession: 'Product manager',
    lookingFor: 'Serious relationship',
    preferredAgeMin: 24,
    preferredAgeMax: 33,
    visibility: 'everyone',
    active: true,
  },
];

// --- Meeting requests: one pending, incoming to u_demo ---
const meetingRequests = [
  { id: 'mr1', senderId: 'u_sarah', receiverId: 'u_demo', status: 'pending', createdAt: iso(0, 5) },
];

// --- Rooms (MSN-style meeting rooms) ---
const rooms = [
  { id: 'r1', name: 'Marrakech Serious Meetings', topic: 'Serious relationships & marriage', city: 'Marrakech', memberIds: ['u_sarah', 'u_younes', 'u_demo'] },
  { id: 'r2', name: 'Professionals Marrakech', topic: 'Young professionals', city: 'Marrakech', memberIds: ['u_sarah', 'u_youssef'] },
  { id: 'r3', name: 'Travelers Looking to Meet', topic: 'For people who love to travel', city: 'Marrakech', memberIds: ['u_ines'] },
];

const roomMessages = [
  { id: 'rm1', roomId: 'r1', senderId: 'u_sarah', content: 'Hello!', createdAt: iso(0, 1) },
  { id: 'rm2', roomId: 'r1', senderId: 'u_younes', content: 'Hi 👋', createdAt: iso(0, 1) },
  { id: 'rm3', roomId: 'r1', senderId: 'u_sarah', content: 'Nice to meet you', createdAt: iso(0, 1) },
];

// --- A couple of service requests, in different states ---
const serviceRequests = [
  {
    id: 'sr1',
    clientId: 'u_demo',
    providerId: 'u_p1',
    category: 'Plumbing',
    description: 'Leaking pipe under the kitchen sink.',
    location: 'Guéliz',
    date: iso(0, -24),
    status: 'accepted',
    createdAt: iso(2),
  },
  {
    id: 'sr2',
    clientId: 'u_sarah',
    providerId: 'u_p1',
    category: 'Plumbing',
    description: 'Water heater not turning on.',
    location: 'Guéliz',
    date: iso(10),
    status: 'completed',
    createdAt: iso(12),
  },
];

const reviews = [
  {
    id: 'rv1',
    providerId: 'u_p1',
    authorId: 'u_sarah',
    requestId: 'sr2',
    rating: 5,
    content: 'Came within the hour, very professional.',
    createdAt: iso(9),
  },
];

// --- Notifications for the demo user, so the bell isn't empty ---
notifications.push(
  {
    id: 'nt1',
    userId: 'u_demo',
    type: 'meeting_request',
    content: 'Sarah sent you a meeting request.',
    link: '/meetings',
    read: false,
    createdAt: iso(0, 5),
  },
  {
    id: 'nt2',
    userId: 'u_demo',
    type: 'activity',
    content: 'A new swimming activity was created near you.',
    link: '/activities/a1',
    read: false,
    createdAt: iso(0, 8),
  },
  {
    id: 'nt3',
    userId: 'u_demo',
    type: 'service_request',
    content: 'Rachid B. accepted your service request.',
    link: '/profile',
    read: true,
    createdAt: iso(2),
  }
);

const conversations = [];
const messages = [];

const db = {
  users,
  sessions: [],
  serviceRequests,
  reviews,
  news,
  communities,
  communityPosts,
  activities,
  meetingProfiles,
  meetingRequests,
  conversations,
  messages,
  rooms,
  roomMessages,
  notifications,
  reports: [],
};

const outPath = path.join(process.cwd(), 'src', 'data', 'db.seed.json');
fs.writeFileSync(outPath, JSON.stringify(db, null, 2));
console.log(`Seed written to ${outPath} (${users.length} users, ${communities.length} communities, ${activities.length} activities)`);
