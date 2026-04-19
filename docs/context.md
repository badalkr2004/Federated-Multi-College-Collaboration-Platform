Federated Multi-College Platform — Context Log

## Status: ✅ Backend Complete ✅ Frontend Complete

## Live at: http://localhost:3000

---

## What's Been Implemented

### Phase 1: Foundation

- `src/config/env.ts` — Zod-validated env (JWT_SECRET, REDIS_URL, COLLEGE_A/B_API_KEY)
- `src/config/constants.ts` — App-wide constants
- `src/lib/logger.ts` — Pino logger with pretty-print in dev
- `src/lib/errors.ts` — AppError class + factory functions
- `src/lib/response.ts` — Standardised `sendSuccess` / `sendError` / `sendPaginated`
- `src/lib/jwt.ts` — `signToken` / `verifyToken` with typed JWTPayload
- `src/lib/redis.ts` — ioredis singleton with graceful fallback

### Phase 2: Database

- All 5 new schemas created: `colleges`, `users`, `projects`, `team_members`, `ratings`, `messages`
- Pushed to Neon PostgreSQL via `drizzle-kit push`
- Old tables (account, session, verification, user) dropped via cleanup script

### Phase 3: Middleware

- `src/middleware/authenticate.ts` — JWT verification, attaches `req.user`
- `src/middleware/validate.ts` — Generic Zod body/query validation factory
- `src/middleware/errorHandler.ts` — Global error handler using AppError
- `src/middleware/rateLimiter.ts` — Auth (10/min), API (100/min)

### Phase 4-9: All 6 Modules

| Module       | Routes                                  | Highlights                                  |
| ------------ | --------------------------------------- | ------------------------------------------- |
| `auth`       | POST /register, /login, /logout         | Argon2id, college API key validation        |
| `users`      | GET/PATCH /me, /me/skills, GET /:id     | Cache invalidation on skill update          |
| `projects`   | CRUD + join/leave                       | Cross-college access control, member limits |
| `match`      | GET /projects, /users/:id               | Jaccard similarity, Redis 5-min cache       |
| `reputation` | POST /projects/:id/rate, GET /users/:id | Synchronous score recalculation             |
| `messages`   | POST/GET /projects/:id                  | Member-only access, pagination              |

### Phase 10: App Wiring

- `src/app.ts` — Express factory, all routers mounted under `/api/v1/`
- `src/index.ts` — Clean entry point

### Phase 11: Seed Data

- 2 colleges (A with `key-college-a`, B with `key-college-b`)
- 6 users: Alice, Bob, Carol (A) | Dave, Eve, Frank (B) — all password: `Pass1234!`
- 3 projects: AI Study Assistant (cross), Campus Event App (A-only), DevOps Pipeline Builder (cross)

---

## API Base URLs

```
Base: http://localhost:3000/api/v1

Auth:       /auth/register | /auth/login | /auth/logout
Users:      /users/me | /users/me/skills | /users/:id
Projects:   /projects | /projects/:id | /projects/:id/join | /projects/:id/leave
Match:      /match/projects | /match/users/:projectId
Reputation: /reputation/projects/:id/rate | /reputation/users/:id
Messages:   /messages/projects/:id
```

---

## Key Decisions

1. **Tenant Isolation**: Used `college_id` column filtering (not `search_path`) — safe on Neon serverless pooled connections
2. **Redis**: Graceful fallback — caching skipped if Redis is unreachable; server stays up
3. **Matchmaking**: Jaccard similarity (70% skill, 30% normalised reputation) with 5-min Redis cache per user
4. **Password**: Argon2id (not bcrypt)
5. **Auth**: Stateless JWT — no sessions/refresh tokens for hackathon simplicity

---

## Files Removed (old template)

- `src/auth/` (OAuth, sessions, passport)
- `src/routes/` (old auth/user/admin routes)
- `src/services/`
- `src/rbac/`
- `src/types/`
- `src/db/schema/sessions.ts`, `roles.ts`, `oauth-accounts.ts`
- `src/utils/` (moved to `src/config/` and `src/lib/`)
- `src/middleware/error-handler.ts`, `rate-limiter.ts`, `validation.ts` (replaced)

---

## Frontend (Next)

Single-page HTML testing dashboard at `frontend/index.html`

- Login as Alice (College A) or Dave (College B)
- Browse projects
- Run matchmaking
- Send messages
- Rate collaborators
