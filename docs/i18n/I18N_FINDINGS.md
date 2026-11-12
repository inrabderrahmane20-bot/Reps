# Annabid — Internationalization Findings

## i18n Architecture

| Feature | Implementation | Assessment |
|---------|---------------|------------|
| Locales | en, fr, ar | Good coverage |
| Locale detection | Browser + URL prefix | `localeDetection: true`, `localePrefix: 'always'` |
| RTL support | Arabic = rtl | `dir` attribute on `<html>`, `flip-rtl` on icons |
| Translation files | `src/messages/{en,fr,ar}.json` | Three separate JSON files |
| Date/number formatting | UNKNOWN | Not audited |
| Currency | MAD (Moroccan Dirham) | Hardcoded as "DH" in some places |

## i18n Configuration

**`src/i18n/config.ts`:**
```typescript
export const locales = ['en', 'fr', 'ar'] as const;
export const defaultLocale: Locale = 'en';
export const localeDirection: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr', fr: 'ltr', ar: 'rtl'
};
```

**`src/i18n/request.ts`:** Uses `next-intl/server` `getRequestConfig` with dynamic import of locale messages.

**`src/middleware.ts`:** Uses `createMiddleware` from `next-intl/middleware` with `localePrefix: 'always'`.

## i18n Concerns

| Issue | Severity | Details |
|-------|----------|---------|
| Hardcoded strings | MEDIUM | Some strings may not use `t()` |
| Missing translations | UNKNOWN | No mechanism to detect missing keys |
| Number formatting | MEDIUM | Arabic-Indic digits may not be handled |
| Date formatting | MEDIUM | Locale-aware date formatting unverified |
| Currency formatting | MEDIUM | MAD formatting may not be locale-aware |
| Arabic search | MEDIUM | Substring matching may not work well with Arabic text |

## Recommendations

1. Audit all components for hardcoded strings
2. Add translation completeness check in CI
3. Implement locale-aware number/date/currency formatting
4. Test Arabic search with Arabic text
5. Add RTL layout testing
