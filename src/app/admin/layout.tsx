import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { AdminNav } from './admin-nav';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Medina Admin',
};

// The admin panel is intentionally a completely separate surface from the
// public, localized interface (SRS §45) — its own root layout, English-only,
// gated server-side on role === 'admin'.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = getSessionUser();
  if (!user || user.role !== 'admin') {
    redirect('/en/login');
  }

  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen bg-ink-50 text-ink-900 antialiased" style={{ background: '#F4F3F0' }}>
        <div className="flex min-h-screen">
          <AdminNav userName={`${user.firstName} ${user.lastName}`} />
          <main className="flex-1 p-6 md:p-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
