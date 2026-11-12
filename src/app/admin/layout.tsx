import type { Metadata } from 'next';
import { AdminNav } from './admin-nav';
import { AdminLogin } from './admin-login';
import { getSessionUser } from '@/lib/auth';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Medina Admin',
};

// The admin panel is intentionally a completely separate surface from the
// public, localized interface (SRS §45) — its own root layout and English-only.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const isAdmin = user?.role === 'admin';
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen bg-ink-50 text-ink-900 antialiased" style={{ background: '#F4F3F0' }}>
        {isAdmin ? <div className="flex min-h-screen">
          <AdminNav />
          <main className="flex-1 p-6 md:p-10">{children}</main>
        </div> : <AdminLogin signedInNonAdmin={Boolean(user)} />}
      </body>
    </html>
  );
}
