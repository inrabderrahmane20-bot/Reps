import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
});

export const config = {
  // Skip Next internals, API routes and static/image files
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
