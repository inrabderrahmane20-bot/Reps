// SEO helpers shared by the locale layout, the individual pages and the
// sitemap / robots route handlers.
//
// This module is server-side only: it reads the next-intl message files
// through `getTranslations` and builds absolute URLs from the canonical
// origin of the site.

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { defaultLocale, locales, type Locale } from '@/i18n/config';

/** Canonical origin of the site (never ends with a slash). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://reps-five-theta.vercel.app'
).replace(/\/+$/, '');

/** `og:locale` value for every app locale. */
export const OG_LOCALE: Record<Locale, string> = {
  en: 'en_US',
  fr: 'fr_FR',
  ar: 'ar_MA',
};

/** Fallback social preview image (1200x630). */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.svg`;

/**
 * hreflang map for a single path: every app locale plus `x-default`, which
 * points at the default locale.
 */
export type AlternateLanguages = Record<'fr' | 'ar' | 'en' | 'x-default', string>;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

/** Falls back to the default locale for anything unknown. */
export function normalizeLocale(value: string): Locale {
  return isLocale(value) ? value : defaultLocale;
}

/**
 * Normalises a locale-less path: always a leading slash, never a trailing
 * one. The root path is represented by an empty string so that the URL
 * becomes `https://site/<locale>` and not `https://site/<locale>/`.
 */
function localeLessPath(path: string): string {
  const clean = (path ?? '').trim();
  if (!clean || clean === '/') return '';
  const withSlash = clean.startsWith('/') ? clean : `/${clean}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash;
}

/** Absolute, locale-prefixed URL of a locale-less path. */
export function localizedUrl(locale: string, path: string): string {
  const loc = normalizeLocale(locale);
  return `${SITE_URL}/${loc}${localeLessPath(path)}`;
}

/**
 * hreflang alternates for a locale-less path — the very same path in every
 * locale, plus `x-default` pointing at the default locale.
 */
export function hreflangFor(path: string): AlternateLanguages {
  const suffix = localeLessPath(path);
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = `${SITE_URL}/${locale}${suffix}`;
  }
  languages['x-default'] = `${SITE_URL}/${defaultLocale}${suffix}`;
  return languages as AlternateLanguages;
}

/** `alternates.languages` for next-intl / Next.js metadata. */
export function localizedAlternates(pathWithoutLocale: string): {
  languages: AlternateLanguages;
} {
  return { languages: hreflangFor(pathWithoutLocale) };
}

/** `metadataBase` — lets Next.js resolve relative OG/canonical URLs. */
export function metadataBase(): URL | undefined {
  try {
    return new URL(SITE_URL);
  } catch {
    return undefined;
  }
}

export interface BuildMetadataOptions {
  /** Locale of the current route segment (`en`, `fr` or `ar`). */
  locale: string;
  /** Locale-less path of the page, e.g. `/news`. */
  path: string;
  /**
   * Message key inside the `seo` namespace (e.g. `title.news`) or a literal
   * string. Keys are resolved per locale through `getTranslations`.
   */
  title: string;
  /** Message key inside the `seo` namespace (e.g. `description.news`). */
  description: string;
  /** Absolute URL of the social preview image. */
  image?: string;
  /** Open Graph type of the page. */
  type?: 'website' | 'article';
  /** Robots directives (e.g. `{ index: false, follow: true }`). */
  robots?: Metadata['robots'];
  /** Append ` | <siteName>` to the document title (default: `true`). */
  includeSiteName?: boolean;
  /** Publication date — only used with `type: 'article'`. */
  publishedTime?: string;
  /** Authors — only used with `type: 'article'`. */
  authors?: string[];
}

type Translator = (key: string) => string;

/**
 * Resolves a value that is either a message key of the `seo` namespace or a
 * literal string. Unknown keys fall back to the literal value instead of
 * throwing, so a missing translation never breaks a page render.
 */
function resolveText(t: Translator, value: string): string {
  if (!value) return '';
  try {
    const has = (t as unknown as { has?: (key: string) => boolean }).has;
    const exists = typeof has === 'function' ? has.call(t, value) : true;
    if (exists) {
      const resolved = t(value);
      if (typeof resolved === 'string' && resolved.length > 0) return resolved;
    }
  } catch {
    /* fall through to the literal value */
  }
  return value;
}

/**
 * Builds a complete, locale-aware Next.js `Metadata` object: title,
 * description, canonical URL, hreflang alternates, Open Graph and Twitter
 * cards.
 */
export async function buildMetadata({
  locale,
  path,
  title,
  description,
  image,
  type = 'website',
  robots,
  includeSiteName = true,
  publishedTime,
  authors,
}: BuildMetadataOptions): Promise<Metadata> {
  const loc = normalizeLocale(locale);
  const t = await getTranslations({ locale: loc, namespace: 'seo' });

  const siteName = t('siteName');
  const resolvedTitle = resolveText(t, title);
  const resolvedDescription = resolveText(t, description);
  const documentTitle = includeSiteName
    ? `${resolvedTitle} | ${siteName}`
    : resolvedTitle;

  const canonical = localizedUrl(loc, path);
  const imageUrl = image ?? DEFAULT_OG_IMAGE;
  const images = [{ url: imageUrl, width: 1200, height: 630, alt: documentTitle }];
  const alternateLocale = locales
    .filter((entry) => entry !== loc)
    .map((entry) => OG_LOCALE[entry]);

  const openGraph: Metadata['openGraph'] =
    type === 'article'
      ? {
          type: 'article',
          title: documentTitle,
          description: resolvedDescription,
          url: canonical,
          siteName,
          locale: OG_LOCALE[loc],
          alternateLocale,
          images,
          publishedTime,
          authors,
        }
      : {
          type: 'website',
          title: documentTitle,
          description: resolvedDescription,
          url: canonical,
          siteName,
          locale: OG_LOCALE[loc],
          alternateLocale,
          images,
        };

  return {
    metadataBase: metadataBase(),
    title: documentTitle,
    description: resolvedDescription,
    alternates: {
      canonical,
      languages: hreflangFor(path),
    },
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title: documentTitle,
      description: resolvedDescription,
      images: [imageUrl],
    },
    ...(robots ? { robots } : {}),
  };
}
