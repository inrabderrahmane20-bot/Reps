import { NextRequest, NextResponse } from 'next/server';
import { updateDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const EVENTS = ['impressions', 'clicks', 'views', 'requests'] as const;
type EventName = (typeof EVENTS)[number];

function sanitize(event: string | undefined): EventName | null {
  return EVENTS.includes(event as EventName) ? (event as EventName) : null;
}

/**
 * Lightweight counter for marketing/engagement events. This is intentionally
 * minimal — the event model (impressions/clicks/views/requests per provider)
 * is the contract; a real BI pipeline can replace this route later.
 *
 * POST { providerId, event[] } — event[] is a list of event names to apply.
 */
export async function POST(req: NextRequest) {
  let body: { providerId?: string; event?: string; events?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const providerId = body.providerId;
  if (!providerId || typeof providerId !== 'string') {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const names = (Array.isArray(body.events) ? body.events : body.event ? [body.event] : []).map(sanitize).filter(Boolean) as EventName[];
  if (names.length === 0) return NextResponse.json({ ok: true });

  const result = updateDb((db) => {
    const u = db.users.find((x) => x.id === providerId);
    if (!u?.provider) return null;
    u.provider.insights ??= { impressions: 0, clicks: 0, views: 0, requests: 0 };
    for (const name of names) {
      u.provider.insights[name] = (u.provider.insights[name] ?? 0) + 1;
    }
    return { ok: true };
  });

  return NextResponse.json(result ?? { ok: false }, { status: result ? 200 : 404 });
}