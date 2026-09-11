// Core data model for the Medina demo backend.
// Persisted as JSON (see lib/db.ts) — good enough for local dev/testing,
// not a production datastore (no transactions, no concurrent-write safety).

export type ProviderStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type Availability = 'available' | 'later' | 'offline';
export type Role = 'user' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'banned';

export interface ProviderProfile {
  category: string;
  title: string;
  description: string;
  specialties: string[];
  serviceArea: string;
  priceRange: string;
  availability: Availability;
  lat: number;
  lng: number;
  portfolio: string[];
  documents: string[]; // filenames/descriptions submitted for verification
  rejectionReason?: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  firstName: string;
  lastName: string;
  city: string;
  neighborhood: string;
  avatar: string;
  languages: string[];
  interests: string[];
  bio: string;
  role: Role;
  status: AccountStatus;
  providerStatus: ProviderStatus;
  provider: ProviderProfile | null;
  blockedUserIds: string[];
  homeLat?: number;
  homeLng?: number;
  zoneId?: string;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  providerId: string; // user id of provider
  category: string;
  description: string;
  location: string;
  date: string;
  status: 'pending' | 'accepted' | 'refused' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Review {
  id: string;
  providerId: string;
  authorId: string;
  requestId: string | null;
  rating: number;
  content: string;
  createdAt: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  category: string;
  city: string;
  neighborhood: string;
  date: string;
  image: string;
  author: string;
  summary: string;
  content: string[];
  tags: string[];
  status: 'published' | 'draft';
}

export interface Community {
  id: string;
  name: string;
  description: string;
  city: string;
  category: string;
  cover: string;
  rules: string[];
  creatorId: string;
  adminIds: string[];
  memberIds: string[];
  lat: number;
  lng: number;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  communityId: string;
  authorId: string;
  content: string;
  createdAt: string;
  likeUserIds: string[];
  comments: { id: string; authorId: string; content: string; createdAt: string }[];
}

export interface Activity {
  id: string;
  creatorId: string;
  title: string;
  category: string;
  description: string;
  date: string;
  location: string;
  city: string;
  lat: number;
  lng: number;
  max: number;
  min: number;
  equipment: string[];
  level: string;
  visibility: 'public' | 'private';
  status: 'open' | 'cancelled' | 'completed';
  participantIds: string[];
  pendingParticipantIds: string[];
  createdAt: string;
}

export interface MeetingProfile {
  userId: string;
  age: number;
  gender: string;
  maritalStatus: string;
  profession: string;
  lookingFor: string;
  preferredAgeMin: number;
  preferredAgeMax: number;
  visibility: 'everyone' | 'registered' | 'nobody';
  active: boolean;
}

export interface MeetingRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'meeting' | 'activity' | 'community';
  participantIds: string[];
  relatedId: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readBy: string[];
}

export interface Room {
  id: string;
  name: string;
  topic: string;
  city: string;
  memberIds: string[];
}

export interface RoomMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  content: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'user' | 'provider' | 'community' | 'activity' | 'post' | 'message' | 'room';
  targetId: string;
  reason: string;
  details: string;
  status: 'new' | 'under_review' | 'resolved' | 'rejected';
  createdAt: string;
}

export interface Db {
  users: User[];
  sessions: Session[];
  serviceRequests: ServiceRequest[];
  reviews: Review[];
  news: NewsArticle[];
  communities: Community[];
  communityPosts: CommunityPost[];
  activities: Activity[];
  meetingProfiles: MeetingProfile[];
  meetingRequests: MeetingRequest[];
  conversations: Conversation[];
  messages: Message[];
  rooms: Room[];
  roomMessages: RoomMessage[];
  notifications: Notification[];
  reports: Report[];
}

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  city: string;
  neighborhood: string;
  avatar: string;
  languages: string[];
  interests: string[];
  bio: string;
  role: Role;
  status: AccountStatus;
  providerStatus: ProviderStatus;
  provider: ProviderProfile | null;
  homeLat?: number;
  homeLng?: number;
  zoneId?: string;
  createdAt: string;
}

export function toPublicUser(u: User): PublicUser {
  const { passwordHash, salt, blockedUserIds, email, ...rest } = u;
  return rest;
}
