import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb, newId } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { pushNotification } from '@/lib/notify';

// GET ?role=client|provider — list my requests either as the person asking, or the provider receiving them.
export async function GET(req: NextRequest) {
  return withErrors(async () => {
    const me = requireUser();
    const role = new URL(req.url).searchParams.get('role') || 'client';
    const db = readDb();
    const mine = db.serviceRequests.filter((r) => (role === 'provider' ? r.providerId === me.id : r.clientId === me.id));
    const enriched = mine.map((r) => {
      const client = db.users.find((u) => u.id === r.clientId);
      const provider = db.users.find((u) => u.id === r.providerId);
      return {
        ...r,
        clientName: client ? `${client.firstName} ${client.lastName}` : 'Unknown',
        providerName: provider ? `${provider.firstName} ${provider.lastName}` : 'Unknown',
        providerCategory: provider?.provider?.category,
      };
    });
    return NextResponse.json({ requests: enriched.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) });
  });
}

// Step 1-6 of the service request workflow: client describes need, picks provider, sends request.
export async function POST(req: NextRequest) {
  return withErrors(async () => {
    const me = requireUser();
    const { providerId, category, description, location, date } = await req.json();
    if (!providerId || !description || !location || !date) {
      return jsonError('Provider, description, location and date are required.');
    }
    const db = readDb();
    const provider = db.users.find((u) => u.id === providerId && u.providerStatus === 'approved');
    if (!provider) return jsonError('Provider not found.', 404);

    const id = newId('sr');
    updateDb((d) => {
      d.serviceRequests.push({
        id,
        clientId: me.id,
        providerId,
        category: category || provider.provider!.category,
        description,
        location,
        date,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      pushNotification(d, providerId, 'service_request', `${me.firstName} ${me.lastName} sent you a new service request.`, '/provider/dashboard');
    });

    return NextResponse.json({ id }, { status: 201 });
  });
}
