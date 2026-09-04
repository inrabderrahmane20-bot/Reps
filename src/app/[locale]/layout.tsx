import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, localeDirection, type Locale } from '@/i18n/config';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { MobileTabBar } from '@/components/layout/mobile-tab-bar';
import { DemoStateProvider } from '@/components/layout/demo-state-provider';
import '../globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Medina — Marrakech, all in one place',
  description:
    'Local news, trusted services, communities, activities and meetings — one platform for daily life in Marrakech.',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  const messages = await getMessages();
  const dir = localeDirection[locale as Locale];

  return (
    <html lang={locale} dir={dir}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Cairo:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-sand-50">
        <NextIntlClientProvider messages={messages}>
          <DemoStateProvider>
            <Navbar />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <Footer />
            <MobileTabBar />
          </DemoStateProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
