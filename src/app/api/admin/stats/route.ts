import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { readDb } from '@/lib/db';
import { withErrors } from '@/lib/api-helpers';

export async function GET() {
  return withErrors(async () => {
    requireAdmin();
    const db = readDb();
    return NextResponse.json({
      totalUsers: db.users.length,
      activeUsers: db.users.filter((u) => u.status === 'active').length,
      providers: db.users.filter((u) => u.provider).length,
      verifiedProviders: db.users.filter((u) => u.providerStatus === 'approved').length,
      pendingProviders: db.users.filter((u) => u.providerStatus === 'pending').length,
      serviceRequests: db.serviceRequests.length,
      completedMissions: db.serviceRequests.filter((r) => r.status === 'completed').length,
      communities: db.communities.length,
      activities: db.activities.length,
      meetingProfiles: db.meetingProfiles.length,
      chatRooms: db.rooms.length,
      newsArticles: db.news.length,
      openReports: db.reports.filter((r) => r.status === 'new' || r.status === 'under_review').length,
      bannedUsers: db.users.filter((u) => u.status === 'banned').length,
    });
  });
}
