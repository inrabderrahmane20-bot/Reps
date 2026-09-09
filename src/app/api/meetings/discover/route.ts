import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb } from '@/lib/db';
import { withErrors } from '@/lib/api-helpers';

function score(mine: any, other: any, meInterests: string[], otherInterests: string[]) {
  let s = 0;
  const shared = meInterests.filter((i) => otherInterests.includes(i));
  s += shared.length * 15;
  if (mine.lookingFor === other.lookingFor) s += 25;
  if (other.age >= mine.preferredAgeMin && other.age <= mine.preferredAgeMax) s += 20;
  if (mine.age >= other.preferredAgeMin && mine.age <= other.preferredAgeMax) s += 20;
  return { score: Math.min(99, 40 + s), shared };
}

// Suggested/compatible profiles — deliberately not swipe-based (SRS §29-30).
export async function GET() {
  return withErrors(async () => {
    const me = requireUser();
    const db = readDb();
    const myProfile = db.meetingProfiles.find((p) => p.userId === me.id);
    if (!myProfile) return NextResponse.json({ profiles: [], needsProfile: true });

    const blockedByMe = me.blockedUserIds || [];
    const candidates = db.meetingProfiles.filter(
      (p) =>
        p.userId !== me.id &&
        p.active &&
        p.visibility !== 'nobody' &&
        !blockedByMe.includes(p.userId)
    );

    const results = candidates
      .map((p) => {
        const user = db.users.find((u) => u.id === p.userId)!;
        if (user.blockedUserIds?.includes(me.id)) return null;
        const { score: compat, shared } = score(myProfile, p, me.interests, user.interests);
        return {
          userId: user.id,
          name: user.firstName,
          age: p.age,
          city: `${user.city} · ${user.neighborhood}`,
          compatibility: compat,
          sharedInterests: shared,
          lookingFor: p.lookingFor,
          avatar: user.avatar,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.compatibility - a.compatibility);

    return NextResponse.json({ profiles: results, needsProfile: false });
  });
}
