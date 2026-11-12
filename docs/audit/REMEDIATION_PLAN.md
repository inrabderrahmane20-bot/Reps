# Annabid — Prioritized Remediation Plan

## Priority 0 — Critical Security and Data Risks (Week 1)

| # | Action | Files Affected | Migration? | Downtime? | Rollback |
|---|--------|---------------|------------|-----------|----------|
| 1 | Migrate from JSON to PostgreSQL | `src/lib/db.ts`, `src/data/db.json`, migration SQL | YES | Possible (data migration) | Restore from backup |
| 2 | Add rate limiting to auth endpoints | `src/app/api/auth/login/route.ts`, `register/route.ts` | NO | No | Revert code |
| 3 | Implement CSRF protection | All API routes, middleware | NO | No | Revert code |
| 4 | Remove hardcoded admin credentials | `src/data/db.seed.json` | NO | No | Restore from git |
| 5 | Remove default weak password | `src/app/api/admin/users/route.ts:33` | NO | No | Revert code |
| 6 | Restrict image proxy hosts | `next.config.mjs:16-17` | NO | No | Revert config |
| 7 | Implement database backups | Infrastructure (Supabase/Vercel) | NO | No | N/A |

## Priority 1 — Production Stability (Week 2-3)

| # | Action | Files Affected | Migration? | Downtime? |
|---|--------|---------------|------------|-----------|
| 8 | Add email verification | `src/app/api/auth/register/route.ts`, new route | NO | No |
| 9 | Add password reset flow | New API routes | NO | No |
| 10 | Strengthen password policy | `src/app/api/auth/register/route.ts` | NO | No |
| 11 | Add RLS policies | Migration SQL | YES (schema) | No |
| 12 | Add database indexes | Migration SQL | YES (schema) | No |
| 13 | Fix N+1 queries | `src/app/api/providers/route.ts` | NO | No |
| 14 | Add security headers | `next.config.mjs`, middleware | NO | No |

## Priority 2 — Architecture and Maintainability (Week 4-6)

| # | Action | Files Affected | Migration? |
|---|--------|---------------|------------|
| 15 | Implement testing suite | New `src/__tests__/` directory | NO |
| 16 | Add CI/CD pipeline | `.github/workflows/` | NO |
| 17 | Create design system | `src/lib/theme.ts`, component refactors | NO |
| 18 | Add error boundaries | React components | NO |
| 19 | Add structured logging | `src/lib/logger.ts` | NO |
| 20 | Remove debug scripts | Repository root files | NO |

## Priority 3 — Performance and UX (Week 7-8)

| # | Action | Files Affected | Migration? |
|---|--------|---------------|------------|
| 21 | Enable image optimization | `next.config.mjs`, Image components | NO |
| 22 | Add CDN for images | Infrastructure config | NO |
| 23 | Add search index | Search infrastructure | NO |
| 24 | Accessibility improvements | Components, layout | NO |
| 25 | Add loading skeletons | UI components | NO |

## Priority 4 — Future Scalability (Ongoing)

| # | Action | Files Affected | Migration? |
|---|--------|---------------|------------|
| 26 | Structured data (SEO JSON-LD) | Pages, `src/lib/seo.ts` | NO |
| 27 | Privacy compliance (GDPR/Moroccan) | New pages, API routes | NO |
| 28 | Monitoring and alerting | Infrastructure | NO |
| 29 | Admin MFA | Auth system | NO |
| 30 | Real-time features | WebSockets/SSE | NO |

## Issues Requiring User Approval

Before implementing, explicit approval required for:
1. **Database migration** — replacing JSON file with PostgreSQL
2. **Removing seed file** — deletes hardcoded admin account
3. **Default password removal** — changes admin user creation flow
4. **Image host restrictions** — may break existing image URLs
5. **Security headers (CSP)** — may break inline scripts or external resources
6. **Rate limiting** — may affect legitimate users behind shared IPs

## Issues That Could Not Be Verified

- Production database access (no credentials available)
- Production infrastructure access (no Vercel/Supabase access)
- Actual RLS policy enforcement
- Actual security headers in production
- Dependency vulnerabilities (`npm audit` not run)
- Core Web Vitals (Lighthouse not run)
- Accessibility compliance (no screen reader testing)
- Penetration testing (not authorized)
