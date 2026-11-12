# Annabid — Database Findings

## Database Architecture

### Hybrid Storage Model
1. **PostgreSQL (Supabase)** via `pg` connection pool — when `POSTGRES_PRISMA_URL` configured
2. **JSON file (`src/data/db.json`)** — fallback when PostgreSQL unavailable

### PostgreSQL Schema
- 23 tables: users, sessions, serviceRequests, reviews, news, communities, communityPosts, activities, meetingProfiles, meetingRequests, conversations, messages, rooms, roomMessages, notifications, reports, favorites, invitations, savedSearches, categories, places, listings, app_meta
- Each: `record_key text PRIMARY KEY`, `data jsonb NOT NULL`
- RLS: Enabled on all tables
- Permissions: REVOKED ALL from anon/authenticated; GRANT ALL to service_role
- **No indexes beyond primary key**
- **No foreign keys**
- **No RLS policies defined**

### JSON File Fallback
- Single file `src/data/db.json`, 23 collections as JSON arrays
- Entire file rewritten on every write
- No indexes, constraints, or transactions

## Critical Findings

### CRITICAL: JSON File as Primary Datastore
**Location:** `src/lib/db.ts:638-671`  
**Impact:** No ACID guarantees. Concurrent writes corrupt data. Not production-safe.  
**Fix:** Migrate to PostgreSQL with proper schema and transactions.

### CRITICAL: No Database Indexes
**Location:** `supabase/migrations/202611030001_create_app_data.sql`  
**Impact:** Full table scans on email, providerStatus, category, userId. Won't scale.  
**Fix:** Add indexes on frequently queried columns.

### HIGH: N+1 Query Pattern
**Location:** `src/app/api/providers/route.ts:83` — reviews filtered per provider  
**Fix:** Batch fetch reviews with single query.

### HIGH: No Foreign Key Enforcement
**Impact:** Orphaned records possible.  
**Fix:** Add FK constraints in PostgreSQL schema.

### MEDIUM: Sessions in Same Store as User Data
**Fix:** Separate sessions table with TTL expiration.

### MEDIUM: No Cascade Delete
**Fix:** Application-level cleanup on user deletion.

## Recommended Indexes
```sql
CREATE INDEX idx_users_email ON users ((data->>'email'));
CREATE INDEX idx_users_provider_status ON users ((data->>'providerStatus'));
CREATE INDEX idx_users_role ON users ((data->>'role'));
CREATE INDEX idx_favorites_user_id ON favorites ((data->>'userId'));
CREATE INDEX idx_reviews_provider_id ON reviews ((data->>'providerId'));
CREATE INDEX idx_categories_parent_id ON categories ((data->>'parentId'));
CREATE INDEX idx_sessions_user_id ON sessions ((data->>'userId'));
CREATE INDEX idx_sessions_expires_at ON sessions ((data->>'expiresAt'));
```
