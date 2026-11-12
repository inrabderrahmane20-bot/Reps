# Annabid — Security Policies and Recommendations

## Immediate Security Actions (Priority 0)

1. **Rate Limiting** — Implement on `/api/auth/login` and `/api/auth/register` (5 attempts/15min/IP)
2. **CSRF Protection** — Add CSRF tokens or Origin/Referer validation to all state-changing API routes
3. **Remove Hardcoded Credentials** — Delete `src/data/db.seed.json` or replace with secure setup script
4. **Remove Default Password** — Eliminate `'medina1234'` default in admin user creation
5. **Restrict Image Hosts** — Change `hostname: '**'` to specific trusted domains in `next.config.mjs`
6. **Database Backups** — Implement automated backups with tested restoration

## Security Headers to Implement

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | `default-src 'self'; img-src 'self' https:; script-src 'self'; style-src 'self' 'unsafe-inline'` | XSS prevention |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` | HTTPS enforcement |
| X-Content-Type-Options | `nosniff` | MIME sniffing prevention |
| X-Frame-Options | `DENY` or `SAMEORIGIN` | Clickjacking prevention |
| Referrer-Policy | `strict-origin-when-cross-origin` | Referrer info control |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` | Browser feature restriction |

## Authentication Hardening

| Current | Recommended |
|---------|-------------|
| 6-char min password | 12-char min with complexity |
| 30-day session | 7-day session with sliding expiration |
| SameSite=Lax | SameSite=Strict (with CSRF tokens) |
| Secure only in prod | Secure always (HTTPS everywhere) |
| No email verification | Required email verification |
| No password reset | Time-limited reset tokens |
| No MFA | MFA for admin accounts |

## Session Management

- Cookie: `medina_session`, httpOnly, SameSite, secure
- Token: `randomBytes(24).toString('hex')` (cryptographically secure)
- Storage: Same database as user data (should be separate table with TTL)
- Revocation: Server-side session deletion on logout
- No refresh token rotation (single long-lived token)

## Admin Security

- Same session cookie as regular users (should be separate or step-up)
- No MFA (should add TOTP or email-based)
- No audit logging (should log all admin actions)
- No session management UI (users can't view/revoke sessions)

## File Upload Security

**No file upload functionality currently exists.** Images are external URLs. If uploads are added in future:
- Validate file type server-side (not just extension)
- Validate MIME type
- Enforce file size limits
- Sanitize filenames
- Store outside web root or use signed URLs
- Consider malware scanning

## Secrets Management

- `.env.example` only (no committed secrets)
- `POSTGRES_PRISMA_URL` — server-only, never NEXT_PUBLIC
- Supabase CA certificate bundled
- No secret scanning in CI (should add)

## CORS Configuration

- No explicit CORS headers configured
- Next.js API routes are same-origin by default
- Session cookie is SameSite=Lax (partial CSRF protection)
- **Recommendation:** Add explicit CORS with allowed origins
