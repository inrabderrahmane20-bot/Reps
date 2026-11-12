# Annabid — Frontend Architecture Findings

## Component Inventory

### Layout Components
- `Navbar` — Main navigation
- `Footer` — Site footer
- `MobileTabBar` — Mobile bottom navigation
- `AdminNav` — Admin sidebar navigation
- `FirstVisitLanguageModal` — Language selection on first visit

### Search Components
- `FloatingSearch` — Floating search pill
- `SearchResults` — Full-page search results
- `GlobalSearchBar` — Search input component
- `CategorySearchPanel` — Category search panel
- `CategorySearchRoot` — Category search root

### Service Components
- `LayeredCategoryNavigation` — Nested category navigation
- `MarketingCards` — Promotional service cards
- `MarketingBadges` — Discount/promotion badges
- `SponsoredStrip` — Sponsored placement strip
- `FiltersPanel` — Filter controls
- `MobileFilterDrawer` — Mobile filter drawer

### UI Components
- `EmptyState` — Empty results state
- `FavoriteButton` — Favorite toggle
- `Rating` — Star rating display
- `ReportModal` — Report content modal
- `RequestServiceModal` — Service request modal
- `SectionHeader` — Section title with CTA
- `AvailabilityBadge` — Provider availability indicator
- `ComingSoon` — Coming soon placeholder

## Component Quality Issues

| Issue | Severity | Location |
|-------|----------|----------|
| No design system tokens | MEDIUM | Throughout components |
| Legacy "sunset" color naming | MEDIUM | `tailwind.config.ts` (sunset = wine alias) |
| No error boundaries | MEDIUM | React components |
| No loading skeletons | LOW | Components use spinners |
| Large components | MEDIUM | `search-results.tsx` (158 lines), `floating-search.tsx` |
| Prop drilling | MEDIUM | Search/filter state not centralized |

## State Management

- **Auth:** React Context (`AuthProvider`)
- **Server state:** Direct fetch via `api-client.ts` (no React Query/SWR)
- **Search state:** Local to components
- **No global search/filter state**

## Design System (Missing)

### Current Brand Colors
- Burgundy/Wine: `#650a3d` (--annabid-wine)
- Terracotta: `#FF6E00` (--home-terracotta, --mobile-nav-terracotta)
- Cream/Ivory: `#faf7f4` (--annabid-ivory)
- Forest Green: `#123d2b`

### Required Design System Tokens
- Centralized color palette
- Typography scale
- Spacing scale
- Border radius tokens
- Shadow tokens
- Breakpoint definitions
- Reusable component library (buttons, inputs, cards, modals)

## i18n Frontend

- Locales: en, fr, ar (Arabic RTL)
- `dir` attribute set per locale
- `flip-rtl` class used on icons
- Fonts: Fraunces, Plus Jakarta Sans, Cairo (Arabic), Familjen Grotesk, DM Sans

## Accessibility Gaps

| Issue | Severity |
|-------|----------|
| No accessibility testing | HIGH |
| No skip-to-content link | MEDIUM |
| Focus trap in modals unknown | MEDIUM |
| ARIA live regions missing | MEDIUM |
| Color contrast unverified | MEDIUM |
| Touch target sizes unverified | LOW |

## Recommendations

1. Create centralized design system with theme tokens
2. Add React error boundaries
3. Implement loading skeletons
4. Add accessibility testing (axe-core)
5. Add skip-to-content link
6. Centralize search/filter state
7. Document component API props
