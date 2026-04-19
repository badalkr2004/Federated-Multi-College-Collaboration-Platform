# Federated Multi-College Collaboration Platform — Implementation Plan

## Overview

A multi-tenant collaboration platform connecting multiple colleges. Each college is an isolated tenant. Users can post projects, match with collaborators via skill-based Jaccard similarity, message within project threads, and earn reputation scores.

**Time budget: 4–5 hours**  
**Database: Neon PostgreSQL (already connected)**  
**No Docker required** — using existing Neon cloud DB + local Redis.

---

## Current State Assessment

The existing codebase is a generic hackathon backend template with:
- OAuth (Google, GitHub), sessions, RBAC, email verification
- Schema: `users`, `sessions`, `roles`, `oauth-accounts`
- Utils: `env.ts`, `logger.ts`
- Middleware: `error-handler.ts`, `rate-limiter.ts`, `validation.ts`

**What we're doing:** Complete rewrite to the new modular monolith architecture. We keep the Neon DB connection string, `tsconfig.json`, `package.json` (only adding `ioredis`), and `drizzle.config.ts`. Everything else is replaced or rebuilt.

> [!IMPORTANT]
> **Tenant Isolation Simplification:** The original plan uses Postgres schema-per-tenant (`SET search_path`). Since we're on Neon (serverless, pooled connections), `SET search_path` does NOT persist reliably across pooled connections. **We use a single schema with `college_id` column filtering instead**, which is safer and equally demonstrable for a hackathon. Cross-college projects land in the same table with `cross_college = true`.

> [!WARNING]
> The old files (`src/auth/`, `src/routes/`, `src/services/`, `src/rbac/`, `src/types/`) will be **deleted** and replaced with the new `src/modules/` structure. The existing `src/db/schema/` will be fully replaced.

---

## Proposed Changes

### Foundation Layer

#### [MODIFY] `src/utils/env.ts` → moved to `src/config/env.ts`
New fields: `REDIS_URL`, `JWT_SECRET`, `COLLEGE_A_API_KEY`, `COLLEGE_B_API_KEY`. Remove OAuth/session fields.

#### [NEW] `src/config/constants.ts`
Token expiry, cache TTL, pagination defaults.

#### [MODIFY] `src/utils/logger.ts` → move to `src/lib/logger.ts`
Keep pino config as-is.

#### [NEW] `src/lib/errors.ts`
`AppError` class + factory functions (`unauthorized`, `forbidden`, `notFound`, `conflict`, `badRequest`).

#### [NEW] `src/lib/response.ts`
`sendSuccess()`, `sendError()`, `sendPaginated()` helpers.

#### [NEW] `src/lib/jwt.ts`
`signToken(payload)` / `verifyToken(token)` using `jsonwebtoken`.

#### [NEW] `src/lib/redis.ts`
`ioredis` singleton connected to `REDIS_URL`.

---

### Database Layer

#### [MODIFY] `src/db/index.ts` → `src/db/client.ts`
Keep Neon connection. Export `db` singleton. Remove SSL requirement for local testing tolerance.

#### [NEW] `src/db/schema/colleges.ts`
`colleges` table: `id`, `name`, `slug`, `api_key`, `email_domain`, `created_at`.

#### [MODIFY] `src/db/schema/users.ts`
Replace with: `id`, `name`, `email`, `password_hash`, `skills[]`, `bio`, `reputation`, `projects_completed`, `avg_rating`, `college_id`, `created_at`, `updated_at`. Remove OAuth/session columns.

#### [NEW] `src/db/schema/projects.ts`
`projects` + `team_members` tables.

#### [NEW] `src/db/schema/ratings.ts`
`ratings` table.

#### [NEW] `src/db/schema/messages.ts`
`messages` table.

#### [MODIFY] `src/db/schema/index.ts`
Re-export all 5 new schemas. Remove old exports.

#### [MODIFY] `src/db/seed.ts`
2 colleges, 6 users (3 per college), 3 projects per spec.

#### [MODIFY] `drizzle.config.ts`
Point to updated env variable name (`JWT_SECRET` instead of old fields).

---

### Middleware Layer

#### [MODIFY] `src/middleware/error-handler.ts`
Update to use new `AppError` class and `sendError()` helper.

#### [MODIFY] `src/middleware/rate-limiter.ts`
Two limiters: `authLimiter` (10/min), `apiLimiter` (100/min).

#### [MODIFY] `src/middleware/validation.ts`
Generic Zod validation factory — already exists, minor update.

#### [NEW] `src/middleware/authenticate.ts`
Verifies JWT. Attaches `req.user = { userId, collegeId, collegeSlug, email }`.

---

### Delete Old Directories

- `src/auth/` → **DELETE**
- `src/routes/` → **DELETE**  
- `src/services/` → **DELETE**
- `src/rbac/` → **DELETE**
- `src/types/` → **DELETE**
- `src/db/schema/sessions.ts`, `roles.ts`, `oauth-accounts.ts` → **DELETE**

---

### Modules

#### [NEW] `src/modules/auth/`
- `auth.schema.ts`: `RegisterSchema`, `LoginSchema`
- `auth.service.ts`: `register()`, `login()`, `logout()`
- `auth.routes.ts`: `POST /register`, `POST /login`, `POST /logout`
- `auth.types.ts`, `index.ts`

#### [NEW] `src/modules/users/`
- `users.schema.ts`: `UpdateProfileSchema`, `UpdateSkillsSchema`
- `users.service.ts`: `getMe()`, `updateProfile()`, `updateSkills()`, `getUserById()`
- `users.routes.ts`: `GET /me`, `PATCH /me`, `PATCH /me/skills`, `GET /:id`
- `users.types.ts`, `index.ts`

#### [NEW] `src/modules/projects/`
- `projects.schema.ts`: `CreateProjectSchema`, `UpdateProjectSchema`
- `projects.service.ts`: `createProject()`, `listProjects()`, `getProjectById()`, `updateProject()`, `joinProject()`, `leaveProject()`
- `projects.routes.ts`: Full CRUD + join/leave
- `projects.types.ts`, `index.ts`

#### [NEW] `src/modules/match/`
- `match.service.ts`: Jaccard similarity + Redis 5-min cache
- `match.routes.ts`: `GET /projects`, `GET /users/:projectId`
- `match.types.ts`, `index.ts`

#### [NEW] `src/modules/reputation/`
- `reputation.schema.ts`: `RateSchema`
- `reputation.service.ts`: `rateUser()`, `getUserRatings()`
- `reputation.routes.ts`: `POST /projects/:id/rate`, `GET /users/:id`
- `reputation.types.ts`, `index.ts`

#### [NEW] `src/modules/messages/`
- `messages.schema.ts`: `SendMessageSchema`
- `messages.service.ts`: `sendMessage()`, `getMessages()`
- `messages.routes.ts`: `POST /projects/:id`, `GET /projects/:id`
- `messages.types.ts`, `index.ts`

---

### App Wiring

#### [MODIFY] `src/index.ts`
New clean entry point — starts server, calls `createApp()`.

#### [NEW] `src/app.ts`
Express app factory — registers middleware, mounts all module routers under `/api/v1/`.

---

### Frontend (After Backend)

A single-page HTML/CSS/JS testing dashboard to demo the API flows:
- Register/Login as Alice (College A) or Dave (College B)
- View/update profile & skills
- Create/list projects
- Run matchmaking
- Send messages
- Rate collaborators

---

## Implementation Order (Hackathon-Optimized)

```
Phase 1 — Foundation (30 min)
  1. src/config/env.ts + constants.ts
  2. src/lib/{logger,errors,response,jwt,redis}.ts
  3. src/db/client.ts (update import paths)

Phase 2 — Schema + DB (20 min)
  4. Replace all src/db/schema/ files
  5. npm run db:push (apply to Neon)
  6. src/db/seed.ts

Phase 3 — Middleware (15 min)
  7. src/middleware/authenticate.ts
  8. Update error-handler.ts, rate-limiter.ts, validation.ts

Phase 4 — Auth Module (20 min)
  9. Full auth module

Phase 5 — Users Module (15 min)
  10. Full users module

Phase 6 — Projects Module (25 min)
  11. Full projects module

Phase 7 — Match Module (20 min)
  12. Jaccard + Redis cache

Phase 8 — Reputation + Messages (20 min)
  13. reputation module
  14. messages module

Phase 9 — App Wiring (10 min)
  15. src/app.ts + src/index.ts

Phase 10 — Seed + Test (15 min)
  16. Run seed, test all demo flows

Phase 11 — Frontend (30-45 min)
  17. HTML testing dashboard
```

---

## Verification Plan

### Automated (Quick Smoke Tests)
1. `npm run dev` starts cleanly
2. `GET /health` returns 200
3. `npm run db:seed` populates data

### Demo Flow
Run the 8-step demo flow from the prompt ending in Dave's reputation being updated after Alice rates him.

### Security Checks
- College A token cannot access College B users profile list
- Invalid JWT returns 401
- Missing `collegeApiKey` on register returns 400
