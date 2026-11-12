# Annabid — Route Inventory

## Public Routes (No Auth Required)

| Path | Page | Purpose | Locale | Robots |
|------|------|---------|--------|--------|
| `/[locale]/` | Homepage | Landing page | en, fr, ar | Allow |
| `/[locale]/search` | Search | Global search results | en, fr, ar | Disallow |
| `/[locale]/services` | Services | Browse providers | en, fr, ar | Allow |
| `/[locale]/services/[id]` | Provider detail | Individual provider page | en, fr, ar | Allow |
| `/[locale]/promotions` | Promotions | Active promotions | en, fr, ar | Allow |
| `/[locale]/news` | News | News articles | en, fr, ar | Allow |
| `/[locale]/communities` | Communities | Community listings | en, fr, ar | Allow |
| `/[locale]/activities` | Activities | Activity listings | en, fr, ar | Allow |
| `/[locale]/map` | Map | Geographic map view | en, fr, ar | Allow |
| `/[locale]/discover` | Discover | Discovery page | en, fr, ar | Allow |
| `/[locale]/meet` | Meet | Meetups | en, fr, ar | Allow |
| `/[locale]/login` | Login | User login | en, fr, ar | Disallow |
| `/[locale]/register` | Register | User registration | en, fr, ar | Disallow |

## Private Routes (User Auth Required)

| Path | Page | Purpose | Auth |
|------|------|---------|------|
| `/[locale]/favorites` | Favorites | User's saved items | Session |
| `/[locale]/messages` | Messages | User messages | Session |
| `/[locale]/profile` | Profile | User profile | Session |
| `/[locale]/provider/*` | Provider dashboard | Provider management | Session |

## Private Routes (Admin Auth Required)

| Path | Page | Purpose | Auth |
|------|------|---------|------|
| `/admin/` | Admin dashboard | Admin overview | Admin session |
| `/admin/users` | User management | User CRUD | Admin session |
| `/admin/providers` | Provider management | Provider approval | Admin session |
| `/admin/campaigns` | Campaign management | Sponsored placements | Admin session |
| `/admin/activities` | Activity management | Activity CRUD | Admin session |
| `/admin/news` | News management | News CRUD | Admin session |
| `/admin/categories` | Category management | Category CRUD | Admin session |
| `/admin/positions` | Position management | Job positions | Admin session |
| `/admin/reports` | Reports | Moderation reports | Admin session |
| `/admin/login` | Admin login | Admin authentication | None |

## API Routes

| Path | Method | Auth | Purpose |
|------|--------|------|---------|
| /api/auth/login | POST | None | User login |
| /api/auth/register | POST | None | User registration |
| /api/auth/me | GET | Session | Get current user |
| /api/auth/logout | POST | Session | Logout |
| /api/providers | GET | None | Public provider listings |
| /api/search | GET | None | Global search |
| /api/favorites | GET/POST/DELETE | Session | User favorites |
| /api/admin/* | Various | Admin session | Admin operations |

## Route Security Assessment

| Finding | Severity | Location |
|---------|----------|----------|
| No route-level auth middleware | MEDIUM | `src/middleware.ts` — only locale, no auth |
| Private pages accessible without redirect | MEDIUM | Frontend AuthContext handles, no server redirect |
| Admin routes not excluded from public middleware | HIGH | `src/middleware.ts` matcher doesn't exclude `/admin` |

## Locale Configuration

- Locales: en, fr, ar
- Default: en
- Prefix: always (`/en/`, `/fr/`, `/ar/`)
- Direction: en=LTR, fr=LTR, ar=RTL
