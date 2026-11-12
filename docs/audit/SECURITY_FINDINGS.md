# Annabid — Security Findings

## Authentication Security

### CRITICAL: No Rate Limiting on Auth Endpoints
**Location:** `src/app/api/auth/login/route.ts`, `src/app/api/auth/register/route.ts`  
**Impact:** Unlimited brute-force attempts on login. Spam registration possible.  
**Fix:** IP-based rate limiting (5 attempts per 15 min per IP).

### CRITICAL: No CSRF Protection
**Location:** All API routes  
**Impact:** State-changing operations can be triggered by malicious sites via forged requests. Session cookie auto-sent by browser.  
**Fix:** CSRF token verification or strict Origin/Referer header validation.

### HIGH: No Email Verification
**Location:** `src/app/api/auth/register/route.ts`  
**Impact:** Accounts active instantly without email confirmation. Fake emails accepted.  
**Fix:** Email verification flow with time-limited tokens before activation.

### HIGH: No Password Reset Flow
**Location:** Missing endpoint  
**Impact:** Users cannot recover forgotten passwords. Permanent lockout.  
**Fix:** Implement password-reset-request and password-reset-confirm with time-limited tokens.

### MEDIUM: Weak Password Policy (6 chars)
**Location:** `src/app/api/auth/register/route.ts:18`  
**Fix:** Minimum 12 characters with complexity requirements.

### MEDIUM: 30-Day Session Duration
**Location:** `src/lib/auth.ts:7`  
**Fix:** Reduce to 7 days, add sliding expiration or idle timeout.

### MEDIUM: SameSite=Lax (not Strict)
**Location:** `src/lib/auth.ts:41`  
**Fix:** Consider Strict for sensitive operations, or implement CSRF tokens.

### MEDIUM: Secure Cookie Only in Production
**Location:** `src/lib/auth.ts:42`  
**Fix:** Always use secure flag with HTTPS in all environments.

## Authorization and Access Control

### CRITICAL: Admin Authorization Relies Solely on Session
**Location:** `src/lib/admin-api.ts:17-22`, `src/app/api/admin/*/route.ts`  
**Impact:** Stolen session = full admin compromise. No step-up auth.  
**Fix:** MFA or step-up authentication for sensitive admin actions.

### HIGH: Admin Can Modify Any User
**Location:** `src/app/api/admin/users/[id]/route.ts`  
**Fix:** Audit logging for admin actions. Re-authentication for role changes.

## OWASP Top 10

### A05 Security Misconfiguration — CRITICAL
Missing: CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy  
**Location:** `next.config.mjs` — only Cache-Control configured  
**Fix:** Add security headers middleware.

### A07 Identification & Auth Failures — CRITICAL
No rate limiting, no email verification, weak passwords, no MFA, no account lockout.

### A04 Insecure Design — HIGH
JSON file as production datastore, no backup, no concurrency control.

### A10 SSRF — MEDIUM
**Location:** `next.config.mjs:16-17` — `remotePatterns: [{ protocol: 'https', hostname: '**' }]`  
**Fix:** Restrict to specific trusted domains.

## API Security Summary

| Endpoint | Auth | Rate Limit | Risk |
|----------|------|------------|------|
| /api/auth/login | No | No | CRITICAL |
| /api/auth/register | No | No | CRITICAL |
| /api/providers | No | No | MEDIUM |
| /api/search | No | No | MEDIUM |
| /api/favorites | Yes | No | MEDIUM |
| /api/admin/* | Admin | No | HIGH |

## Secrets Management

### CRITICAL: Hardcoded Admin Credentials
**Location:** `src/data/db.seed.json:6-7`  
**Fix:** Remove seed file. Use secure setup script with env-provided credentials.

### GOOD: No `.env` Committed
Only `.env.example` with placeholders.

### GOOD: Supabase CA Certificate Bundled
`supabase/prod-ca-2021.crt` for TLS verification.
