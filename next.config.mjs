import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const isGithubPages = process.env.GITHUB_PAGES === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: `output: 'export'` must stay off. This app relies on middleware
  // (locale routing, auth) and on API routes (/api/search, /api/promotions,
  // /api/providers, ...), and `src/i18n/request.ts` reads `headers()`. Static
  // export disables all of that and makes every page return HTTP 500.
  trailingSlash: true,
  basePath: isGithubPages ? '/Reps' : '',
  assetPrefix: isGithubPages ? '/Reps/' : undefined,
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default withNextIntl(nextConfig);
