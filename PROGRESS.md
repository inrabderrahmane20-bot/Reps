# Medina — Build Progress

Tracking against the Master SRS. Legend: ✅ done · 🟡 partial/mocked · ⬜ not started

Project lives at `/medina` (Next.js 14, App Router, TypeScript, Tailwind v3, next-intl v3).

---

## Phase 1 — Foundation

| Item | Status | Notes |
|---|---|---|
| Next.js + TypeScript + Tailwind architecture | ✅ | `src/` layout, path alias `@/*` |
| Design system (tokens) | ✅ | `tailwind.config.ts` — Majorelle blue, Kasbah clay, saffron, zellige green, sand neutrals; Fraunces + Plus Jakarta Sans + Cairo |
| EN / FR / AR i18n | ✅ | `next-intl`, routes `/en`, `/fr`, `/ar`, message files in `src/messages/*.json` |
| Arabic RTL | ✅ | `dir="rtl"` set on `<html>`, logical CSS properties (`ms-`/`me-`/`start-`/`end-`) used throughout, `.flip-rtl` for directional icons, Arabic font swap |
| Responsive design | ✅ | Mobile-first; bottom tab bar on mobile, full nav + footer on desktop |
| Core navigation | ✅ | `Navbar`, `MobileTabBar`, `LanguageSwitcher`, `Footer` |
| Component library (base) | ✅ | Rating, AvailabilityBadge, EmptyState, SectionHeader, ComingSoon |
| Language persistence | ⬜ | Currently no cookie/account persistence — switching language only changes the current page's locale prefix |
| Accessibility baseline | 🟡 | Focus-visible ring, aria-labels on icon buttons, reduced-motion respected. Not yet audited with a screen reader or automated tooling |

## Phase 2 — Local ecosystem

| Item | Status | Notes |
|---|---|---|
| Home page (hero, personalized feed) | ✅ | Mocked data — news, communities, activities, services sections |
| News listing page | ✅ | Category chips + card grid, mocked data. Cards now link to article detail |
| News article detail page | ✅ | `/news/[id]` — hero image, tags, author, related articles. `notFound()` for bad ids |
| Services listing page | ✅ | Search bar, category chips, provider list, mocked data |
| Service provider profile page | ✅ | `/services/[id]` — about, specialties, portfolio, service area, price range, reviews |
| Service request workflow (steps 1–13) | ⬜ | "Request service" / "Contact provider" buttons are still visual only |
| Interactive map | ⬜ | Placeholder page only (`/map`) |
| Cities / neighborhoods as data entities | ⬜ | Currently hardcoded to Marrakech in copy |
| Search (global, cross-category) | 🟡 | `/search` page filters mocked services/news/communities/activities/meeting profiles client-side by keyword. Wired from the home hero, services page search bar, and navbar search icon. Not yet backed by a real search index/API |

## Phase 3 — Community

| Item | Status | Notes |
|---|---|---|
| Communities listing page | ✅ | Grid of group cards, join/joined state (visual only), mocked data. Cards now link to group detail |
| Community group page (posts, chat, members) | 🟡 | `/communities/[id]` — cover image, about, rules, admins list and a posts feed (like/comment counts, visual only). No dedicated chat room or full member list yet |
| Community posts / feed | 🟡 | Read-only feed rendered on the group page from mocked posts; no composer, no like/comment persistence |
| Activities listing page | ✅ | Card grid with participants/spots, mocked data. Cards now link to activity detail |
| Activity detail page + participation | 🟡 | `/activities/[id]` — stats grid, description, equipment, min/max participants. "Join activity" / "Group chat" buttons are still visual only |
| Community/Activity → chat connection | ⬜ | |

## Phase 4 — Communication

| Item | Status | Notes |
|---|---|---|
| General messaging UI | 🟡 | Placeholder page only (`/messages`) |
| Notifications center | ⬜ | Bell icon in navbar is decorative; no panel yet |
| Real-time infrastructure | ⬜ | No websocket/live layer — everything is static/mocked |
| Meeting requests flow | ⬜ | "Send meeting request" button is visual only |

## Phase 5 — Meetings

| Item | Status | Notes |
|---|---|---|
| Meetings landing page | ✅ | "Not a swipe app" positioning, suggested matches, room discovery |
| Meeting profile cards + compatibility | ✅ | Mocked compatibility scoring, shared interests, intentions |
| Meeting profile creation/edit form | ⬜ | |
| **MSN-style retro chat room** | ✅ | `components/meetings/msn-chat-room.tsx` — contact list, presence dots, retro title bar, chat bubbles, distinct visual language from the rest of the app, as required |
| Room discovery cards | ✅ | Mocked room list with online counts |
| Private meeting conversation (post-acceptance) | ⬜ | |
| Meeting moderation tools | ⬜ | |

## Phase 6 — Administration

| Item | Status | Notes |
|---|---|---|
| Admin panel (all of it) | ⬜ | Not started — separate app surface (`/admin`) per spec, out of scope for this pass |

---

## Not yet started (any phase)

- **Backend/API layer** — everything above renders from `src/data/mock.ts`. No database, auth, or API routes yet.
- **Authentication** — sign in / registration flow, session handling.
- **User profile page** — currently a placeholder.
- **Provider dashboard, admin dashboard, admin maps/analytics.**
- **File uploads** (avatars, portfolios, images) and validation.
- **SEO** — no per-page metadata, Open Graph, structured data, or `/marrakech/...` style city routes yet; only `/[locale]/...` exists.
- **Payments architecture.**
- **Search** — `/search` now does real client-side keyword filtering across mocked entities (see Phase 2 table), but there's no server-side/API-backed search, no relevance ranking, and no per-category filters yet.
- **Language persistence** via cookie/account.
- **Full translation coverage** — the three message files cover nav, home, and the pages built so far. Admin, forms, error/empty states beyond what's shown, and email/system copy are not yet translated.

## What was consciously deferred

- All data is mocked in `src/data/mock.ts` (now extended with descriptions, portfolios, rules, tags, reviews, etc. for the new detail pages) — swap this for real API calls once a backend exists.
- Detail pages now exist for all four entity types (provider, news, community, activity), but their action buttons (request service, join activity, join group chat, contact provider, report) are still visual-only — no request/participation workflow, no persistence.
- The interactive map, messages, profile, discover, and legal pages are intentionally simple "coming soon" placeholders so the nav doesn't 404 anywhere.
- `/search` is a client component wrapped in `<Suspense>` (required by Next.js App Router for `useSearchParams`) and filters in-memory mock arrays; there's no debouncing, pagination, or ranking.

## How to run it

```bash
cd medina
npm install
npm run dev     # http://localhost:3000/en, /fr, /ar
npm run build && npm run start   # production build
```

Build verified clean: `npm run build` compiles and prerenders all 14 routes × 3 locales (42 pages) with no errors. (The sandbox this was built in blocks `fonts.googleapis.com`, which only affects Next's build-time font-optimization step — harmless, and won't occur on a normal machine/deploy target with open network access.)

## Suggested next session

1. Service request workflow (steps 1–13 from the SRS) — turn "Request service" / "Contact provider" into an actual multi-step flow, even if still against mock data
2. Community chat room (normal chat UI, distinct from the MSN-style Meetings rooms) + full member list on the group page; wire up "Join activity" / "Group chat" on the activity page
3. Auth (NextAuth or similar) + a real user/profile model
4. Replace `src/data/mock.ts` with API routes backed by a database (per the entity list in the SRS §63), and swap `/search`'s in-memory filtering for a real search API
5. Interactive map (Mapbox/Google Maps) with provider/activity markers and availability colors
6. Notifications panel + basic real-time layer (e.g. Pusher/Ably or a WebSocket server) for chat and presence

## This session (continued build)

- Built detail pages for all four previously-missing entity types: `/news/[id]`, `/communities/[id]`, `/activities/[id]`, `/services/[id]` (all with `generateStaticParams` + `notFound()` handling, matching the project's existing SSG approach).
- Linked every card component (`NewsCard`, `CommunityCard`, `ActivityCard`, `ProviderCard`) to its new detail page via the locale-aware `Link` from `@/i18n/navigation`.
- Extended `src/data/mock.ts` with the additional fields the detail pages need (summaries/content/tags for news; description/rules/admins/posts for communities; description/equipment/level for activities; bio/specialties/portfolio/reviews for providers).
- Added a real client-side global search: `SearchResults` (client component, filters mocked services/news/communities/activities/meeting profiles by keyword) rendered inside a `<Suspense>`-wrapped `/search` page, plus a reusable `GlobalSearchBar` wired into the home hero, the services page search bar, and the navbar search icon.
- Added matching translation keys across `en.json`, `fr.json`, and `ar.json` for all of the above.
- **Not yet verified against a real build** — this sandbox had no network access, so `npm install` / `npm run build` could not be run this session. JSON message files were validated, and every edited/new file was checked for balanced braces/parens and import consistency against existing working patterns in the codebase, but a real `npm run build` should be the first thing done next session to catch anything that slipped through (see note below).
