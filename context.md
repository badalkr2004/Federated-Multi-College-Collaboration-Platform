# CollabHub — Federated Multi-College Platform v2 — Implementation Log

## Status: ✅ COMPLETE (v2)

---

## Architecture

- **Pattern:** Modular Monolith — each module owns routes/service/schema/types
- **Tenant isolation:** `college_id` row-level filtering (no search_path; Neon-compatible)
- **Tenant resolution:** Subdomain → DB/cache lookup via `resolveTenant` middleware
- **Auth model:** JWT with `collegeId` + `role`, cross-validated against resolved tenant

---

## What's Implemented

### Platform Layer (no tenant context)

- [x] `POST /api/v1/onboarding/request` — College self-registration with duplicate checks
- [x] `GET /api/v1/onboarding/request/:id/status` — Request status polling
- [x] `POST /api/v1/admin/auth/login` — Super admin JWT (collegeId=null)
- [x] `GET/POST /api/v1/admin/requests` — List/approve/reject pending requests
- [x] `GET /api/v1/admin/colleges` — List all colleges
- [x] `PATCH /api/v1/admin/colleges/:id/deactivate` — Instant deactivation + cache eviction

### Tenant Layer (requires Host + JWT)

- [x] Auth: register, login, logout, /me
- [x] Users: profile, skills update (cache invalidation), get by ID
- [x] Projects: CRUD, join, leave, cross-college support
- [x] Match: Jaccard similarity + composite scoring, Redis cache fallback
- [x] Reputation: submit rating (member check), recalculate synchronously
- [x] Messages: send, paginated list (member-only)

### Infrastructure

- [x] `resolveTenant` middleware: Host → DB → in-memory cache
- [x] `authenticate` middleware: JWT verify + college cross-check (TENANT_MISMATCH)
- [x] `requireSuperAdmin` middleware: role guard
- [x] Rate limiters: auth (10/min), API (100/min), onboarding (5/hour)
- [x] Separate Redis helpers (`cacheGet`, `cacheSet`, `cacheDel`) with error fallback
- [x] Email wrappers (Resend in prod, `logger.info` in dev)
- [x] API key generator: `cc_live_<32hex>`
- [x] In-memory tenant cache (`tenantCache.ts`) with auto-invalidation on approve/deactivate

### Database (Neon PostgreSQL via Drizzle)

- [x] `colleges` — domain, slug, apiKey, isActive
- [x] `college_requests` — full onboarding pipeline
- [x] `users` — role (user/super_admin), collegeId (null for admin)
- [x] `projects` — collegeId + ownerCollegeId + crossCollege
- [x] `team_members` — userCollegeId for cross-college
- [x] `ratings` — raterCollegeId + ratedUserCollegeId
- [x] `messages` — senderCollegeId

### Docs

- [x] `docs/api.md` — Full REST API reference (14 sections)
- [x] `docs/collabhub.postman_collection.json` — Complete Postman collection with auto-token saving and isolation tests

### Frontend

- [x] `frontend/index.html` — Split-pane testing dashboard
  - College A/B tenant switcher
  - Super admin panel with approve/reject
  - Onboarding form
  - Project CRUD + join
  - Matchmaking visualization with Jaccard score bars
  - Messages panel
  - Reputation/ratings panel
  - Quick login buttons for all 6 demo users

---

## Verified Tests ✅

| Test                               | Result                                            |
| ---------------------------------- | ------------------------------------------------- |
| `POST /admin/auth/login`           | ✅ `role: super_admin`, `collegeId: null`         |
| `POST /onboarding/request`         | ✅ Returns request ID                             |
| `POST /admin/requests/:id/approve` | ✅ Provisions college + API key                   |
| `POST /auth/login` (College A)     | ✅ College A user, correct slug                   |
| `POST /auth/login` (College B)     | ✅ College B user, correct slug                   |
| Cross-tenant JWT isolation         | ✅ Alice JWT on B host → `403 TENANT_MISMATCH`    |
| DB seed                            | ✅ 6 users, 3 projects, 2 colleges, 1 super admin |
| Schema push                        | ✅ 7 tables deployed to Neon                      |

---

## Demo Credentials

| Role        | Email                     | Password            | Notes                  |
| ----------- | ------------------------- | ------------------- | ---------------------- |
| Super Admin | superadmin@platform.ac.in | SuperSecurePass123! | No host header         |
| Alice       | alice@a.ac.in             | Pass1234!           | `projects.a.localhost` |
| Bob         | bob@a.ac.in               | Pass1234!           | `projects.a.localhost` |
| Dave        | dave@b.ac.in              | Pass1234!           | `projects.b.localhost` |
| Eve         | eve@b.ac.in               | Pass1234!           | `projects.b.localhost` |

### API Keys

- College A: `cc_live_collegea000000000000000000000000000`
- College B: `cc_live_collegeb000000000000000000000000000`

---

## Running

```bash
bun run dev          # Start server (http://localhost:8000)
bun run db:seed      # Reset seed data
bun run db:push      # Push schema changes
```

## Hosts File (one-time, run Notepad as Admin)

```
127.0.0.1   projects.a.localhost
127.0.0.1   projects.b.localhost
```

---

## Tech Stack

- **Runtime:** Node.js ESM + Bun
- **Web:** Express 5
- **ORM:** Drizzle ORM + postgres.js
- **DB:** Neon PostgreSQL (serverless, PgBouncer pooling)
- **Cache:** ioredis (graceful fallback when unavailable)
- **Auth:** argon2id + JWT (HS256)
- **Validation:** Zod
- **Logging:** Pino
- **Email:** Resend SDK (console fallback in dev)
- **Security:** Helmet, CORS, express-rate-limit
