# Annabid — Infrastructure and Deployment Assessment

## Deployment Platforms

| Platform | Configuration | Status |
|----------|---------------|--------|
| Vercel | Next.js native, middleware supported | Primary target |
| GitHub Pages | `GITHUB_PAGES=true`, `basePath: '/Reps'` | Alternative (static export disabled) |

## next.config.mjs Configuration

```javascript
trailingSlash: true
basePath: isGithubPages ? '/Reps' : ''
assetPrefix: isGithubPages ? '/Reps/' : undefined
images: { unoptimized: true, remotePatterns: [{ protocol: 'https', hostname: '**' }] }
experimental: { outputFileTracingIncludes: { '/*': ['./supabase/prod-ca-2021.crt'] } }
headers: [{ source: '/api/:path*', Cache-Control: 'no-store, max-age=0' }]
```

## Infrastructure Concerns

| Issue | Severity | Details |
|-------|----------|---------|
| No CI/CD pipeline | HIGH | No automated builds, tests, or deployments |
| No environment separation | HIGH | `.env.example` only, no dev/staging/prod docs |
| No Docker containerization | MEDIUM | No Dockerfile, inconsistent local environments |
| No health check endpoint | MEDIUM | No `/health` or `/ready` endpoint |
| No graceful degradation | MEDIUM | Silent fallback to JSON file if PostgreSQL down |
| Image proxy allows any host (`**`) | CRITICAL | SSRF vector via Next.js Image optimization |
| `unoptimized: true` for images | HIGH | No image compression or resizing |

## Missing Infrastructure

- No Dockerfile
- No docker-compose.yml
- No `.github/workflows/` (CI/CD)
- No `.env` (only `.env.example`)
- No monitoring/alerting configuration
- No load balancer configuration
- No auto-scaling configuration

## Recommendations

1. Set up GitHub Actions CI/CD pipeline
2. Add Dockerfile for containerized deployment
3. Create environment-specific `.env` templates
4. Add health check endpoint `/api/health`
5. Restrict image proxy hosts
6. Enable Next.js image optimization (`unoptimized: false`)
7. Add structured logging and error tracking
