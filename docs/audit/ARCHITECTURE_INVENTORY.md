# Annabid — Architecture Inventory

## System Architecture Diagram

```
USER/BROWSER
    |
    v (HTTP/HTTPS, locale-prefixed)
VERCEL EDGE / GITHUB PAGES
    Next.js Middleware (next-intl locale detection)
    Matcher: excludes /api, /admin, _next, static
    |
    +--- PUBLIC PAGES (/[locale]/...) ---+
    |   Next.js App Router               |
    |   Server + Client Components       |
    +------------------------------------+
    |
    +--- ADMIN PAGES (/admin/...) -------+
    |   Separate layout, English-only    |
    |   Same session cookie              |
    +------------------------------------+
    |
    v
API ROUTES (Next.js Route Handlers)
    /api/auth/*     login, register, me, logout
    /api/providers  public marketplace
    /api/search     global search
    /api/favorites  user favorites (session)
    /api/admin/*    admin-only (requireAdmin + session)
    ...
    |
    +--- PostgreSQL (Supabase) ---------+
    |   pg pool, RLS enabled            |
    |   service_role only               |
    |   JSONB per collection            |
    +-----------------------------------+
    |
    +--- JSON File (db.json) -----------+
    |   fs read/write fallback          |
    |   NO concurrent write safety      |
    +-----------------------------------+

External: Google Fonts, Unsplash images, Pravatar avatars
```

## Component Inventory

### Public Pages
`/`, `/search`, `/services`, `/services/[id]`, `/promotions`, `/news`, `/communities`, `/activities`, `/map`, `/discover`, `/meet`, `/login`, `/register`

### Private Pages (User)
`/favorites`, `/messages`, `/profile`, `/provider/*`

### Private Pages (Admin)
`/admin/*` — users, providers, campaigns, activities, news, categories, positions, reports

### API Routes
`/api/auth/login` (POST), `/api/auth/register` (POST), `/api/auth/me` (GET), `/api/auth/logout` (POST), `/api/providers` (GET), `/api/search` (GET), `/api/favorites` (GET/POST/DELETE), `/api/admin/*` (admin session)

### Shared Libraries
`src/lib/auth.ts` (scrypt hashing, session cookies), `src/lib/db.ts` (hybrid JSON/PostgreSQL store), `src/lib/api-client.ts` (fetch wrapper), `src/lib/api-helpers.ts` (error wrapping), `src/lib/admin-api.ts` (admin session), `src/lib/search.ts` (fuzzy scoring), `src/lib/types.ts` (data model), `src/lib/zones.ts` (geographic zones), `src/lib/seo.ts` (SEO metadata), `src/lib/notify.ts` (in-app notifications)

### Context Providers
`src/context/auth-context.tsx` — client-side auth state

### Data Files
`src/data/db.json` (datastore), `src/data/db.seed.json` (seed with hardcoded admin), `src/data/category-taxonomy.json`, `src/messages/{en,fr,ar}.json`

## Dependency Map

### Critical Dependencies
- `src/lib/db.ts` → All API routes and server components
- `src/lib/auth.ts` → All protected routes
- `src/lib/api-client.ts` → All client-side API calls
- `src/context/auth-context.tsx` → Client components needing auth

### Single Points of Failure
1. **db.json file** — sole datastore when PostgreSQL unavailable, no concurrent-write safety
2. **Session cookie** — single `medina_session` cookie controls user + admin access
3. **Supabase connection** — misconfiguration silently falls back to JSON file

### Circular Dependencies: None detected
