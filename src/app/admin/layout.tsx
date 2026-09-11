import type { Metadata } from 'next';
import { getSessionUser } from '@/lib/auth';
import { AdminNav } from './admin-nav';
import { AdminLogin } from './admin-login';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Medina Admin',
};

// The admin panel is intentionally a completely separate surface from the
// public, localized interface (SRS §45) — its own root layout, English-only,
// gated server-side on role === 'admin'. Non-admins see an inline login here
// so the /admin URL itself never redirects elsewhere.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = getSessionUser();
  const isAdmin = !!user && user.role === 'admin';

  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen bg-ink-50 text-ink-900 antialiased" style={{ background: '#F4F3F0' }}>
        {isAdmin ? (
          <div className="flex min-h-screen">
            <AdminNav userName={`${user.firstName} ${user.lastName}`} />
            <main className="flex-1 p-6 md:p-10">{children}</main>
          </div>
        ) : (
          <AdminLogin signedInNonAdmin={!!user} />
        )}
      </body>
    </html>
  );
}
