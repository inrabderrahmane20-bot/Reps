# Public site access and sitemap handoff

Non-secret reference for the public Annabid site. Passwords, `AUTH_SECRET`, MFA seeds and database credentials are **not** stored here — they belong in the deployment secret manager.

## Public sites

| Purpose | URL | Notes |
| --- | --- | --- |
| Production (canonical) | `https://annabid.com` | Canonical origin used for metadata, hreflang, JSON-LD and sitemap URLs (`NEXT_PUBLIC_SITE_URL`). |
| Preview deployment | `https://reps-five-theta.vercel.app` | Deployment preview only. Its canonical tags point at `annabid.com`; do not submit it to Google Search Console. |

## Administration

| Item | Value |
| --- | --- |
| Admin login | `https://annabid.com/admin/` |
| Locale aliases | `/fr/admin/`, `/en/admin/`, `/ar/admin/` and `/admin/login/` redirect to `/admin/`. |
| Admin email | `admin@annabid.com` |
| Password | Supplied through the secret manager as `ADMIN_PASSWORD`; never committed to the repository. |
| Provisioning | Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the secret manager, then run `npm run security:admin`. |
| First login | Email verification and TOTP enrollment are mandatory. Password-only sessions cannot access the back office. |
| Legacy seed account | `admin@medina.ma` is disabled by migration `202611170001` and cannot be used to sign in. |

Passwords are stored as scrypt salt/hash pairs and MFA secrets are encrypted with `AUTH_SECRET`; a stored hash is not a password and cannot be used to log in.

## Google Search Console

Submit this sitemap for the `annabid.com` property:

```
https://annabid.com/sitemap.xml
```

`https://annabid.com/robots.txt` already advertises the same URL via its `Sitemap:` directive. The single sitemap covers all three locales (`en`, `fr`, `ar`) with `hreflang` alternates, so no per-locale sitemap URLs are needed.

## Related documentation

- [Admin access](ADMIN-ACCESS.md)
- [Security remediation](SECURITY-REMEDIATION.md)
- [SEO and accessibility report](seo-accessibility/SEO_ACCESSIBILITY.md)
