import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { SITE_URL } from '@/lib/seo';

/**
 * Public parts of the marketplace are crawlable. Everything that is either
 * technical (API, admin back-office) or personal (account pages, internal
 * search results) is kept out of the index.
 */
const DISALLOWED = [
  '/api/',
  '/admin',
  '/admin/',
  ...locales.flatMap((locale) => [
    `/${locale}/search`,
    `/${locale}/login`,
    `/${locale}/register`,
    `/${locale}/messages`,
    `/${locale}/profile`,
    `/${locale}/provider/`,
  ]),
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOWED,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: safeHost(),
  };
}

/** Bare host of the canonical origin (`example.com`), as the robots spec wants. */
function safeHost(): string | undefined {
  try {
    return new URL(SITE_URL).host;
  } catch {
    return undefined;
  }
}
