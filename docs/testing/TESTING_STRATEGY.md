# Annabid — Testing Strategy

## Current State

**Zero test files exist in the repository.** No unit, integration, or end-to-end tests.

## Recommended Test Suite

### Unit Tests
| Module | Tests | Location |
|--------|-------|----------|
| `src/lib/auth.ts` | hashPassword, verifyPassword, createSessionCookie | `src/__tests__/auth.test.ts` |
| `src/lib/search.ts` | matchScore, fuzzy matching | `src/__tests__/search.test.ts` |
| `src/lib/category-tree.ts` | Category tree traversal | `src/__tests__/category.test.ts` |
| `src/lib/marketing-validation.ts` | Promotion/sponsorship validation | `src/__tests__/marketing.test.ts` |
| `src/lib/zones.ts` | Zone classification, Haversine | `src/__tests__/zones.test.ts` |

### Integration Tests
| Endpoint | Tests | Location |
|----------|-------|----------|
| `/api/auth/login` | Valid credentials, invalid credentials, locked account | `src/__tests__/auth-login.test.ts` |
| `/api/auth/register` | Valid registration, duplicate email, weak password | `src/__tests__/auth-register.test.ts` |
| `/api/auth/me` | Authenticated, unauthenticated | `src/__tests__/auth-me.test.ts` |
| `/api/providers` | Public access, filters, pagination | `src/__tests__/providers.test.ts` |
| `/api/favorites` | Add, remove, list, duplicates | `src/__tests__/favorites.test.ts` |
| `/api/admin/users` | Admin access, non-admin rejection | `src/__tests__/admin-users.test.ts` |

### End-to-End Tests (Playwright)
| Journey | Steps |
|---------|-------|
| New visitor | Open homepage → explore categories → view provider |
| User registration | Register → verify email → login |
| Search | Search for service → filter by category → view results |
| Favorites | Login → add to favorites → view favorites |
| Listing management | Create listing → edit own listing → access another user's listing (should fail) |
| Logout | Login → logout → access protected page (should fail) |
| Mobile navigation | Open mobile menu → navigate → close |
| Language switching | Switch locale → verify content changes |
| Direct URL access | Access protected page without login → redirect to login |

### Security Tests
| Test | Description |
|------|-------------|
| Rate limiting | 10 rapid login attempts → should be blocked |
| CSRF | Cross-site form submission → should be rejected |
| Auth bypass | Access `/api/admin/users` without admin session → 403 |
| SQL injection | Malicious input in search query → should not crash |

## Testing Tools

- **Unit/Integration:** Vitest or Jest (already has TypeScript)
- **E2E:** Playwright (single framework, no Cypress needed)
- **Security:** Manual + automated dependency scanning (`npm audit`)

## CI/CD Integration

Add to `.github/workflows/test.yml`:
1. Run `npm run typecheck` (tsc --noEmit)
2. Run `npm run lint` (next lint)
3. Run unit tests
4. Run E2E tests against preview deployment
5. Run `npm audit` for dependency vulnerabilities
