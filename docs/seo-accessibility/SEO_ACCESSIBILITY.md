# Annabid — SEO and Accessibility Report

## SEO Implementation

### Implemented Features

| Feature | Status | Details |
|---------|--------|---------|
| Page titles | GOOD | `buildMetadata()` in `src/lib/seo.ts` |
| Meta descriptions | GOOD | Per-route descriptions |
| Robots.txt | GOOD | `src/app/robots.ts` — disallows /api, /admin, /search, /login, /register, /messages, /profile, /provider |
| XML Sitemap | GOOD | `src/app/sitemap.ts` — localized sitemap with providers and news |
| Hreflang | GOOD | `hreflangFor()` and `localizedUrl()` for 3 locales |
| Open Graph | GOOD | `og-image.svg` in public |
| Trailing slashes | GOOD | `trailingSlash: true` for URL consistency |
| Locale prefix | GOOD | `localePrefix: 'always'` |

### Missing SEO Features

| Feature | Severity | Details |
|---------|----------|---------|
| Structured data (JSON-LD) | MEDIUM | No LocalBusiness, Organization, BreadcrumbList, or Offer schema |
| Canonical URLs | UNKNOWN | Need to verify `buildMetadata` implementation |
| Image alt text | PARTIAL | Some images use `aria-hidden`, may lack descriptive alt |
| Heading hierarchy | UNKNOWN | Not audited per component |

## Accessibility (WCAG 2.2 AA)

### Implemented
- RTL support for Arabic (`dir="rtl"` on `<html>`)
- `flip-rtl` class on icons for mirroring
- Arabic font (Cairo) for Arabic locale
- Semantic HTML elements in places
- `aria-label` and `aria-hidden` used on some elements

### Missing or Unverified

| Criterion | Status | Details |
|-----------|--------|---------|
| Keyboard navigation | UNKNOWN | Not tested |
| Focus visibility | UNKNOWN | Not tested |
| Screen reader labels | PARTIAL | Inconsistent |
| Form error messages | PARTIAL | API errors returned as JSON |
| Color contrast | UNKNOWN | Burgundy on ivory unverified |
| Touch target sizes | UNKNOWN | Not tested |
| Modal accessibility | UNKNOWN | Focus trap not verified |
| Skip-to-content link | NONE | Not implemented |
| ARIA live regions | NONE | Not implemented |
| Reduced motion | UNKNOWN | Not implemented |

## Recommendations

### SEO
1. Add JSON-LD structured data (LocalBusiness, BreadcrumbList, Offer)
2. Verify canonical URLs in `buildMetadata`
3. Add descriptive alt text to all images
4. Document heading hierarchy standards

### Accessibility
1. Add axe-core to CI for automated a11y testing
2. Implement skip-to-content link
3. Add focus trap to modals and drawers
4. Add ARIA live regions for dynamic content
5. Verify color contrast ratios
6. Test keyboard navigation on all interactive elements
7. Add reduced motion support
