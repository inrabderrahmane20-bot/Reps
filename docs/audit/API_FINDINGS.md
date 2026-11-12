# Annabid — API Findings

## API Endpoint Inventory

### Authentication
| Endpoint | Method | Auth | Rate Limit | Risk |
|----------|--------|------|------------|------|
| /api/auth/login | POST | None | No | CRITICAL |
| /api/auth/register | POST | None | No | CRITICAL |
| /api/auth/me | GET | Session | No | LOW |
| /api/auth/logout | POST | Session | No | LOW |

### Public
| Endpoint | Method | Auth | Rate Limit | Risk |
|----------|--------|------|------------|------|
| /api/providers | GET | None | No | MEDIUM |
| /api/search | GET | None | No | MEDIUM |

### Authenticated (User)
| Endpoint | Method | Auth | Rate Limit | Risk |
|----------|--------|------|------------|------|
| /api/favorites | GET/POST/DELETE | Session | No | MEDIUM |

### Admin
| Endpoint | Method | Auth | Rate Limit | Risk |
|----------|--------|------|------------|------|
| /api/admin/users | GET | Admin | No | HIGH |
| /api/admin/users/[id] | PATCH | Admin | No | HIGH |
| /api/admin/providers | GET/PATCH | Admin | No | HIGH |
| /api/admin/campaigns | GET/POST | Admin | No | HIGH |
| /api/admin/activities | GET/POST | Admin | No | HIGH |
| /api/admin/news | GET/POST | Admin | No | HIGH |
| /api/admin/categories | GET/POST | Admin | No | HIGH |
| /api/admin/stats | GET | Admin | No | MEDIUM |

## Security Concerns

### No Rate Limiting on Any Endpoint
Admin endpoints expose sensitive data and allow modifications without rate limits.

### Excessive Data Exposure
`/api/admin/users` returns all user data including emails to any authenticated admin.

### Missing Security Headers
No CORS, no CSP, no rate limit response headers.

### Error Information Leakage (Dev Only)
`api-helpers.ts:111` returns raw error messages when `NODE_ENV === 'development'`.

## Recommendations
1. Add rate limiting middleware to all API routes
2. Field-level response filtering for admin endpoints
3. CORS configuration with specific allowed origins
4. Remove raw error message exposure in production
5. Add API versioning (`/api/v1/`)
6. Add request size limits
7. Add pagination max limits
