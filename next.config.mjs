import createNextIntlPlugin from 'next-intl/plugin';
import { fileURLToPath } from 'node:url';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const isGithubPages = process.env.GITHUB_PAGES === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /node_modules[\\/]@measured[\\/]puck[\\/]dist[\\/]index\.css$/,
      enforce: 'pre',
      use: [{ loader: fileURLToPath(new URL('./scripts/puck-css-loader.cjs', import.meta.url)) }],
    });
    return config;
  },
  // NOTE: `output: 'export'` must stay off. This app relies on middleware
  // (locale routing, auth) and on API routes (/api/search, /api/promotions,
  // /api/providers, ...), and `src/i18n/request.ts` reads `headers()`. Static
  // export disables all of that and makes every page return HTTP 500.
  trailingSlash: true,
  basePath: isGithubPages ? '/Reps' : '',
  assetPrefix: isGithubPages ? '/Reps/' : undefined,
  images: {
    unoptimized: isGithubPages,
    remotePatterns: ['images.unsplash.com','i.pravatar.cc','upload.wikimedia.org','thumb.wikimedia.org',...(process.env.SUPABASE_URL?[new URL(process.env.SUPABASE_URL).hostname]:[])].map(hostname=>({protocol:'https',hostname,port:'',pathname:'/**'})),
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'none'; sandbox;",
  },
    // The PostgreSQL pool reads the pinned Supabase CA certificate at runtime.
    // Include it in every traced server bundle so TLS verification works on Vercel.
    outputFileTracingIncludes: {
      '/*': ['./supabase/prod-ca-2021.crt'],
    },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
      {
        // API responses are per-user/admin data and can expose transient
        // failures. Never let a browser or shared cache replay them.
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' },{key:'Content-Security-Policy',value:"default-src 'none'; frame-ancestors 'none'; sandbox;"}],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
