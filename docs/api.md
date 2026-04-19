# CollabHub — Federated Multi-College Platform API Documentation

> **Base URL:** `http://localhost:8000`
> **Version:** v2.0
> **Architecture:** Modular Monolith | Multi-tenant via subdomain + row-level isolation

---

## Table of Contents

1. [Authentication Model](#1-authentication-model)
2. [Tenant Routing](#2-tenant-routing)
3. [Response Format](#3-response-format)
4. [Platform: Onboarding](#4-platform-onboarding)
5. [Platform: Admin](#5-platform-admin)
6. [Tenant: Auth](#6-tenant-auth)
7. [Tenant: Users](#7-tenant-users)
8. [Tenant: Projects](#8-tenant-projects)
9. [Tenant: Matchmaking](#9-tenant-matchmaking)
10. [Tenant: Reputation](#10-tenant-reputation)
11. [Tenant: Messages](#11-tenant-messages)
12. [Local Development Setup](#12-local-development-setup)
13. [Demo Flow](#13-demo-flow)
14. [Error Codes Reference](#14-error-codes-reference)

---

## 1. Authentication Model

The platform uses a **three-layer trust chain**:

```
Subdomain → DB lookup (resolveTenant)
         → X-College-Key header validation (on register/login)
         → JWT.collegeId cross-check (on all other protected routes)
```

### JWT Payload

```json
{
  "userId": "uuid",
  "collegeId": "uuid | null",
  "collegeSlug": "string | null",
  "email": "string",
  "role": "user | super_admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

- `collegeId` is `null` only for `super_admin`
- Every request to a tenant route cross-validates `JWT.collegeId === resolved tenant.id`
- A College A JWT is **cryptographically rejected** on `projects.b.localhost`

### Authorization Headers

| Route type                   | Required header                                                   |
| ---------------------------- | ----------------------------------------------------------------- |
| Super admin routes           | `Authorization: Bearer <super_admin_jwt>`                         |
| Tenant auth (register/login) | `Host: projects.a.localhost` + `X-College-Key: cc_live_...`       |
| All other tenant routes      | `Host: projects.a.localhost` + `Authorization: Bearer <user_jwt>` |

---

## 2. Tenant Routing

In **development** (DOMAIN_SUFFIX=localhost):

```
College A domain: projects.a.localhost:8000
College B domain: projects.b.localhost:8000
```

In **production** (DOMAIN_SUFFIX=ac.in):

```
College A domain: projects.a.ac.in
College B domain: projects.b.ac.in
```

### Required hosts file entry (one-time, Windows)

```
# C:\Windows\System32\drivers\etc\hosts  (run Notepad as Administrator)
127.0.0.1   projects.a.localhost
127.0.0.1   projects.b.localhost
```

### Postman/curl: Send requests with explicit Host header

```bash
curl -H "Host: projects.a.localhost" \
     -H "X-College-Key: cc_live_collegea000000000000000000000000000" \
     http://localhost:8000/api/v1/auth/register
```

---

## 3. Response Format

### Success

```json
{
  "success": true,
  "data": { ... },
  "message": "optional human-readable status"
}
```

### Paginated

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Project not found",
    "details": {}
  }
}
```

---

## 4. Platform: Onboarding

> **No authentication required. No tenant context. Rate limit: 5 req/hour.**

### POST `/api/v1/onboarding/request`

Submit a college registration request. An admin reviews and approves/rejects.

**Request body:**

```json
{
  "name": "College C",
  "domain": "projects.c.localhost",
  "emailDomain": "@c.ac.in",
  "contactName": "Dr. Smith",
  "contactEmail": "smith@c.ac.in"
}
```

| Field          | Type   | Validation                            |
| -------------- | ------ | ------------------------------------- |
| `name`         | string | 3–100 chars                           |
| `domain`       | string | Must match `projects.<name>.<suffix>` |
| `emailDomain`  | string | Must match `@<name>.<suffix>`         |
| `contactName`  | string | 2–100 chars                           |
| `contactEmail` | string | Valid email                           |

**Response `201`:**

```json
{
  "success": true,
  "data": {
    "id": "db42ad1a-4d17-4fab-9ad6-f9c5f2cb3810",
    "status": "pending",
    "requestedAt": "2026-04-19T08:52:47.558Z"
  },
  "message": "College request submitted. You will receive an email once reviewed."
}
```

---

### GET `/api/v1/onboarding/request/:id/status`

Poll the status of a previously submitted request.

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "db42ad1a-...",
    "status": "pending | approved | rejected",
    "rejectionReason": null,
    "requestedAt": "2026-04-19T...",
    "reviewedAt": null
  }
}
```

---

## 5. Platform: Admin

> **Requires `super_admin` JWT via `Authorization: Bearer <token>`.**
> **No tenant context (no Host header needed).**

### POST `/api/v1/admin/auth/login`

Super admin login — no tenant required.

**Request body:**

```json
{
  "email": "superadmin@platform.ac.in",
  "password": "SuperSecurePass123!"
}
```

**Response `200`:**

```json
{
  "success": true,
  "data": { "token": "<super_admin_jwt>" },
  "message": "Super admin login successful"
}
```

---

### GET `/api/v1/admin/requests`

List college onboarding requests.

**Query params:** `?status=pending` (optional, omit for all)

**Response `200`:** Array of `CollegeRequest` objects

---

### POST `/api/v1/admin/requests/:id/approve`

Approve a pending request. This **auto-provisions** the college:

- Generates cryptographic API key (`cc_live_<32hex>`)
- Creates college record in DB
- Invalidates tenant cache
- Emails API key to contact (one-time reveal)

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "College C",
    "slug": "college_c",
    "domain": "projects.c.localhost",
    "emailDomain": "@c.ac.in",
    "apiKey": "cc_live_2273af0...",
    "isActive": true,
    "createdAt": "2026-04-19T..."
  },
  "message": "College approved and provisioned"
}
```

---

### POST `/api/v1/admin/requests/:id/reject`

Reject a pending request with a reason.

**Request body:**

```json
{ "reason": "Domain format does not meet requirements." }
```

---

### GET `/api/v1/admin/colleges`

List all colleges (API keys masked).

---

### PATCH `/api/v1/admin/colleges/:id/deactivate`

Deactivate a college. Its domain immediately gets `403` on next request (cache evicted).

---

## 6. Tenant: Auth

> **Tenant-scoped. Host header required. Rate limit: 10 req/min.**

### POST `/api/v1/auth/register`

Register a new user for a college.

**Headers:**

```
Host: projects.a.localhost
X-College-Key: cc_live_collegea000000000000000000000000000
Content-Type: application/json
```

**Request body:**

```json
{
  "name": "Alice",
  "email": "alice@a.ac.in",
  "password": "Pass1234!"
}
```

**Response `201`:**

```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "uuid",
      "name": "Alice",
      "email": "alice@a.ac.in",
      "collegeId": "uuid",
      "collegeSlug": "college_a",
      "role": "user"
    }
  },
  "message": "Registration successful"
}
```

---

### POST `/api/v1/auth/login`

Login to a college tenant.

**Headers:** Same as register (`Host` + `X-College-Key`)

**Request body:**

```json
{
  "email": "alice@a.ac.in",
  "password": "Pass1234!"
}
```

**Response `200`:** Same shape as register response.

---

### POST `/api/v1/auth/logout`

Stateless JWT logout — client discards the token.

**Headers:** `Authorization: Bearer <jwt>` + `Host: projects.a.localhost`

---

### GET `/api/v1/auth/me`

Get current authenticated user's full profile.

**Headers:** `Authorization: Bearer <jwt>` + `Host: projects.a.localhost`

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Alice",
    "email": "alice@a.ac.in",
    "skills": ["React", "TypeScript"],
    "bio": null,
    "role": "user",
    "reputation": 45,
    "avgRating": "4.50",
    "projectsCompleted": 2,
    "collegeId": "uuid",
    "createdAt": "2026-04-19T..."
  }
}
```

---

## 7. Tenant: Users

> **All routes require `Authorization: Bearer <jwt>` + `Host: <college-domain>`. Rate: 100/min.**

### GET `/api/v1/users/me`

Get own profile.

### PATCH `/api/v1/users/me`

Update name and bio.

**Request body:**

```json
{
  "name": "Alice Smith",
  "bio": "Full-stack developer at College A"
}
```

---

### PATCH `/api/v1/users/me/skills`

Replace skills array. **Invalidates match cache for this user.**

**Request body:**

```json
{
  "skills": ["React", "Python", "TypeScript", "Node.js"]
}
```

---

### GET `/api/v1/users/:id`

Get public profile of any user (same college or cross-college if you have their ID).

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Dave",
    "email": "dave@b.ac.in",
    "skills": ["Python", "ML", "FastAPI"],
    "reputation": 88,
    "avgRating": "4.40",
    "projectsCompleted": 3,
    "collegeId": "uuid"
  }
}
```

---

## 8. Tenant: Projects

> **All routes require JWT + Host header.**

### POST `/api/v1/projects`

Create a new project. Sets `collegeId` from JWT (never from body).

**Request body:**

```json
{
  "title": "AI Study Assistant",
  "description": "A smart student assistant using ML.",
  "requiredSkills": ["Python", "ML", "React"],
  "crossCollege": true,
  "maxMembers": 5
}
```

**Response `201`:** Full project object

---

### GET `/api/v1/projects`

List projects visible to this college: own college + all cross-college projects.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `status` | string | `open`, `in_progress`, `completed`, `cancelled` |
| `skill` | string | Filter by required skill (case-insensitive contains) |

---

### GET `/api/v1/projects/:id`

Get project detail with team members.

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "AI Study Assistant",
    "requiredSkills": ["Python", "ML", "React"],
    "crossCollege": true,
    "status": "open",
    "maxMembers": 5,
    "members": [{ "userId": "uuid", "userCollegeId": "uuid", "role": "owner" }]
  }
}
```

---

### PATCH `/api/v1/projects/:id`

Update project (owner only). Same body fields as create (all optional).

---

### POST `/api/v1/projects/:id/join`

Join a project team. Cross-college users can join cross-college projects from any tenant.

---

### DELETE `/api/v1/projects/:id/leave`

Leave a team (non-owners only).

---

## 9. Tenant: Matchmaking

> **All routes require JWT + Host header. Results cached in Redis for 5 minutes.**

### GET `/api/v1/match/projects`

Get top 10 projects ranked for the current user based on skill overlap (Jaccard) + repu score.

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "projectId": "uuid",
      "title": "AI Study Assistant",
      "requiredSkills": ["Python", "ML", "React"],
      "crossCollege": true,
      "score": 0.82,
      "skillOverlap": 0.67
    }
  ]
}
```

**Score formula:**

```
compositeScore = skillOverlap × 0.7 + (reputation / 100) × 0.3
```

Cache eviction: Automatically cleared when user updates skills.

---

### GET `/api/v1/match/users/:projectId`

Get top 10 users ranked for a specific project.

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "userId": "uuid",
      "name": "Dave",
      "email": "dave@b.ac.in",
      "skills": ["Python", "ML", "FastAPI"],
      "reputation": 88,
      "collegeId": "uuid",
      "skillOverlap": 0.67,
      "score": 0.73
    }
  ]
}
```

Cache eviction: Cleared when a user's reputation changes after rating.

---

## 10. Tenant: Reputation

### POST `/api/v1/reputation/projects/:id/rate`

Rate a project collaborator (1–5 stars). Both rater and rated must be project members.

**Request body:**

```json
{
  "ratedUserId": "uuid",
  "score": 5,
  "comment": "Excellent ML skills and great communication"
}
```

**Constraints:**

- Cannot rate yourself
- Cannot rate twice on the same project
- Both users must be team members

**Reputation formula (recalculated synchronously):**

```
reputation = round((avgRating / 5) × 60) + (projectsCompleted × 2)
```

---

### GET `/api/v1/reputation/users/:id`

Get a user's full rating history.

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "raterId": "uuid",
      "score": 5,
      "comment": "Excellent ML skills",
      "createdAt": "2026-04-19T..."
    }
  ]
}
```

---

## 11. Tenant: Messages

### POST `/api/v1/messages/projects/:id`

Send a message to a project channel. Must be a team member.

**Request body:**

```json
{ "content": "Hey team, let's sync on the ML model tomorrow." }
```

---

### GET `/api/v1/messages/projects/:id`

Get paginated messages for a project.

**Query params:** `?page=1&limit=50`

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "senderId": "uuid",
      "senderCollegeId": "uuid",
      "content": "Hey team...",
      "createdAt": "2026-04-19T..."
    }
  ]
}
```

---

## 12. Local Development Setup

### Prerequisites

```bash
# 1. Install dependencies
bun install

# 2. Set up environment
cp .env.example .env   # Fill in DATABASE_URL

# 3. Add hosts entries (run PowerShell as Administrator)
Add-Content "C:\Windows\System32\drivers\etc\hosts" "127.0.0.1   projects.a.localhost"
Add-Content "C:\Windows\System32\drivers\etc\hosts" "127.0.0.1   projects.b.localhost"

# 4. Push schema and seed data
bun run db:push
bun run db:seed

# 5. (Optional) Start Redis for caching
docker compose up -d redis

# 6. Start dev server
bun run dev
```

### Demo Credentials

| Role        | Email                     | Password            | Notes                        |
| ----------- | ------------------------- | ------------------- | ---------------------------- |
| Super Admin | superadmin@platform.ac.in | SuperSecurePass123! | No host/key needed           |
| Alice (A)   | alice@a.ac.in             | Pass1234!           | Host: `projects.a.localhost` |
| Bob (A)     | bob@a.ac.in               | Pass1234!           | Host: `projects.a.localhost` |
| Carol (A)   | carol@a.ac.in             | Pass1234!           | Host: `projects.a.localhost` |
| Dave (B)    | dave@b.ac.in              | Pass1234!           | Host: `projects.b.localhost` |
| Eve (B)     | eve@b.ac.in               | Pass1234!           | Host: `projects.b.localhost` |
| Frank (B)   | frank@b.ac.in             | Pass1234!           | Host: `projects.b.localhost` |

### API Keys

| College   | Domain               | API Key                                       |
| --------- | -------------------- | --------------------------------------------- |
| College A | projects.a.localhost | `cc_live_collegea000000000000000000000000000` |
| College B | projects.b.localhost | `cc_live_collegeb000000000000000000000000000` |

---

## 13. Demo Flow

```bash
# Step 0: Super Admin logs in
POST /api/v1/admin/auth/login
Body: { "email": "superadmin@platform.ac.in", "password": "SuperSecurePass123!" }
→ { data: { token: "<admin_jwt>" } }

# Step 1: Submit College C onboarding
POST /api/v1/onboarding/request
Body: { "name": "College C", "domain": "projects.c.localhost", ... }
→ { data: { id: "<request_id>", status: "pending" } }

# Step 2: Admin approves — College C is instantly live
POST /api/v1/admin/requests/<request_id>/approve
Auth: Bearer <admin_jwt>
→ College C created with generated API key

# Step 3: Log in as Alice (College A)
POST /api/v1/auth/login
Host: projects.a.localhost
X-College-Key: cc_live_collegea000000000000000000000000000
Body: { "email": "alice@a.ac.in", "password": "Pass1234!" }
→ { data: { token: "<alice_jwt>" } }

# Step 4: Alice updates skills
PATCH /api/v1/users/me/skills
Host: projects.a.localhost
Auth: Bearer <alice_jwt>
Body: { "skills": ["React", "Python", "TypeScript"] }

# Step 5: Alice sees matched projects
GET /api/v1/match/projects
Host: projects.a.localhost
Auth: Bearer <alice_jwt>
→ Ranked projects with Jaccard scores

# Step 6: Dave (College B) logs in
POST /api/v1/auth/login
Host: projects.b.localhost
X-College-Key: cc_live_collegeb000000000000000000000000000
Body: { "email": "dave@b.ac.in", "password": "Pass1234!" }

# Step 7: Dave joins Alice's cross-college project
POST /api/v1/projects/<ai_project_id>/join
Host: projects.b.localhost
Auth: Bearer <dave_jwt>

# Step 8: Alice rates Dave
POST /api/v1/reputation/projects/<ai_project_id>/rate
Auth: Bearer <alice_jwt>
Body: { "ratedUserId": "<dave_id>", "score": 5, "comment": "Excellent ML skills" }
→ Dave's reputation recalculated

# ISOLATION CHECK
GET /api/v1/projects?crossCollege=false
Host: projects.a.localhost
Auth: Bearer <alice_jwt>
→ ONLY College A's private projects. Zero from College B.
```

---

## 14. Error Codes Reference

| HTTP | Code                  | Description                                    |
| ---- | --------------------- | ---------------------------------------------- |
| 400  | `BAD_REQUEST`         | Invalid input or business rule violation       |
| 400  | `VALIDATION_ERROR`    | Zod schema validation failed                   |
| 401  | `UNAUTHORIZED`        | Missing or invalid JWT                         |
| 403  | `FORBIDDEN`           | Insufficient permissions                       |
| 403  | `UNKNOWN_TENANT`      | Host domain not registered                     |
| 403  | `TENANT_MISMATCH`     | JWT collegeId ≠ resolved tenant                |
| 403  | `TENANT_KEY_MISMATCH` | X-College-Key doesn't match domain             |
| 404  | `NOT_FOUND`           | Resource does not exist                        |
| 409  | `CONFLICT`            | Duplicate resource (email, college slug, etc.) |
| 429  | `RATE_LIMIT`          | Too many requests                              |
| 500  | `INTERNAL_ERROR`      | Unexpected server error                        |

---

## Architecture Notes for Frontend Integration

### Making Tenant Requests

```javascript
// Always include Host header for tenant routes
const collegeAApi = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  headers: {
    Host: "projects.a.localhost",
    "X-College-Key": "cc_live_collegea000000000000000000000000000",
  },
});

// After login, add JWT
const authedApi = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  headers: {
    Host: "projects.a.localhost",
    Authorization: `Bearer ${token}`,
  },
});
```

> **Note:** Browsers enforce Host header restrictions. For production, route requests to the actual subdomain URL (e.g., `http://projects.a.ac.in/api/v1/...`). In development, use a proxy or send requests directly to `http://projects.a.localhost:8000/`.

### Tenant Isolation Guarantee

- A JWT from College A will be **rejected** with `TENANT_MISMATCH` if used against College B's host
- All user/project queries are automatically scoped to `college_id` from the JWT — never from request body
- Cross-college projects are the only exception and are explicitly flagged with `crossCollege: true`
