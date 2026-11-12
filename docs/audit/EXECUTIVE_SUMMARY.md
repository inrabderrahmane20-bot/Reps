# Annabid — Executive Audit Summary

**Date:** 11/12/2026  
**Repository:** c:\Users\inrab\Documents\GitHub\Norsalem  
**Branch:** main  

## Overall Assessment

Annabid is a functional Next.js 14.2.35 local services marketplace prototype. It is **not production-ready** in its current state due to critical architectural and security gaps.

## Top 10 Critical Findings

| # | Finding | Severity | Location |
|---|---------|----------|----------|
| 1 | JSON file used as primary datastore (no concurrent-write safety) | CRITICAL | `src/lib/db.ts`, `src/data/db.json` |
| 2 | No rate limiting on auth endpoints (brute-force possible) | CRITICAL | `src/app/api/auth/login/route.ts`, `register/route.ts` |
| 3 | No CSRF protection on any API route | CRITICAL | All API routes |
| 4 | Hardcoded admin password hash in seed file | CRITICAL | `src/data/db.seed.json:6-7` |
| 5 | Default weak password `medina1234` for admin-created users | CRITICAL | `src/app/api/admin/users/route.ts:33` |
| 6 | Image proxy allows any HTTPS host (`**`) — SSRF risk | CRITICAL | `next.config.mjs:16-17` |
| 7 | No backup strategy for data | CRITICAL | `src/data/db.json` |
| 8 | No email verification on registration | HIGH | `src/app/api/auth/register/route.ts` |
| 9 | No password reset flow | HIGH | Missing endpoint |
| 10 | Weak password policy (6 chars minimum) | HIGH | `src/app/api/auth/register/route.ts:18` |

## Technology Stack

- **Framework:** Next.js 14.2.35 (App Router), React 18.3.1
- **Language:** TypeScript 5.6.3 (strict)
- **Styling:** Tailwind CSS 3.4.15
- **i18n:** next-intl 3.26.5 (en, fr, ar — Arabic RTL)
- **Database:** PostgreSQL via `pg` (Supabase), with JSON file fallback
- **Authentication:** Custom session-based (scrypt hashing, 30-day cookies)
- **Testing:** None (zero test files)
- **CI/CD:** None configured

## Immediate Actions Required (Priority 0)

1. Migrate from JSON file to PostgreSQL with proper schema and indexes
2. Add rate limiting to `/api/auth/login` and `/api/auth/register`
3. Implement CSRF protection
4. Remove hardcoded admin credentials from `db.seed.json`
5. Remove default weak password in admin user creation
6. Restrict `images.remotePatterns` from `**` to specific domains
7. Implement automated database backups with tested restoration
