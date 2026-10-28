import type { Metadata } from 'next';
import { Cairo, Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, localeDirection, type Locale } from '@/i18n/config';
import { buildMetadata } from '@/lib/seo';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { MobileTabBar } from '@/components/layout/mobile-tab-bar';
import { FirstVisitLanguageModal } from '@/components/layout/first-visit-language-modal';
import { FloatingSearch } from '@/components/search/floating-search';
import { CategorySearchRoot } from '@/components/search/category-search-root';
import { AuthProvider } from '@/context/auth-context';
import '../globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['opsz'],
});
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-arabic',
  display: 'swap',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};

  return buildMetadata({
    locale,
    path: '/',
    title: 'defaultTitle',
    description: 'defaultDescription',
    includeSiteName: false,
  });
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  const dir = localeDirection[locale as Locale];

  return (
    <html lang={locale} dir={dir}>
      <body className={`${fraunces.variable} ${plusJakartaSans.variable} ${cairo.variable} flex min-h-screen flex-col bg-sand-50`}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <Navbar />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <Footer />
            <MobileTabBar />
            <FloatingSearch />
            <CategorySearchRoot />
            <FirstVisitLanguageModal />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
