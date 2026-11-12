# Annabid — Technical Debt and Code Quality

## Code Quality Issues

| Issue | Severity | Location |
|-------|----------|----------|
| Root-level debug scripts | MEDIUM | `addfav.js`, `addnav.js`, `addnav.py`, `add_fav.js`, `check_seed.js`, `eval.js`, `fixen.js`, `fixnav.js`, `fixnav_all.js`, `setnav.js`, `setnav2.js`, `show_tax.js`, `_tmp_add_nav.js` |
| 50,000+ line `last.txt` | MEDIUM | Repository root — may contain sensitive info |
| `tsconfig.tsbuildinfo` committed | LOW | Build artifact in repository |
| No `.gitignore` visible | MEDIUM | May be committing node_modules, .env, build artifacts |
| Hardcoded default password `medina1234` | CRITICAL | `src/app/api/admin/users/route.ts:33` |
| Default avatar from external pravatar.cc | MEDIUM | `src/app/api/auth/register/route.ts:41` |
| Inconsistent error handling | MEDIUM | Some routes use `withErrors`, some use try/catch directly |
| Magic strings scattered | MEDIUM | `'medina_session'`, `'u_'`, `'fav_'`, etc. |

## Duplicate Code

| Issue | Location |
|-------|----------|
| Admin auth check pattern | Every admin API route repeats `await requireAdmin(); await requireAdminSession();` |
| Favorite CRUD pattern | `/api/favorites` GET/POST/DELETE have similar `requireUser` + try/catch |

## Positive Findings

- TypeScript strict mode enabled
- Shared validation in `marketing-validation.ts` (used by both admin UI and API)
- `api-helpers.ts` provides consistent error wrapping
- `withErrors` wrapper standardizes API error responses
- Tailwind config has well-documented color system

## Recommendations

1. Remove all root-level debug scripts (`*.js`, `*.py`, `last.txt`, `_tmp_add_nav.js`)
2. Add `.gitignore` for node_modules, .env, build artifacts
3. Remove `tsconfig.tsbuildinfo` from repository
4. Create shared admin auth middleware to eliminate duplication
5. Centralize magic strings as constants
6. Standardize error handling across all API routes
7. Add barrel exports for cleaner imports
