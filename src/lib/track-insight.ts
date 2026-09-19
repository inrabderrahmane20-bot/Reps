// Client-side engagement tracking with a tiny batched queue.
//
// Fire-and-forget: failures are swallowed, and events are flushed in a batch
// to /api/insights. Kept in one place so a future analytics pipeline can swap
// the transport without touching components.

export type InsightEvent = 'impressions' | 'clicks' | 'views' | 'requests';

const MAX_BATCH = 5;
const FLUSH_MS = 2000;

type Pending = { providerId: string; events: InsightEvent[] };
let queue: Pending[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  try {
    void fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId: batch[0].providerId, events: batch.flatMap((p) => p.events) }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

function schedule() {
  if (timer) return;
  timer = setTimeout(flush, FLUSH_MS);
}

/** Record one or more events for a provider (batched, never throws). */
export function trackProvider(providerId: string, events: InsightEvent | InsightEvent[]) {
  if (typeof window === 'undefined') return;
  const list = Array.isArray(events) ? events : [events];
  if (list.length === 0) return;
  queue.push({ providerId, events: list });
  if (queue.length >= MAX_BATCH) flush();
  else schedule();
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flush);
}