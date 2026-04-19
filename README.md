# Hackathon Backend - Production-Grade Authentication System

A complete Node.js/Express backend with Drizzle ORM, PostgreSQL (Neon), multi-method authentication (JWT, Sessions, OAuth), and Role-Based Access Control (RBAC).

## 🚀 Features

- **JWT Authentication** with access/refresh token rotation
- **OAuth 2.0** integration (Google & GitHub)
- **Session Management** with secure HTTP-only cookies
- **RBAC** (Role-Based Access Control) with permissions
- **Email Verification** & Password Reset (via Resend)
- **Rate Limiting** on sensitive endpoints
- **Input Validation** with Zod
- **Security Headers** with Helmet
- **Request Logging** with Pino

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- (Optional) Google OAuth credentials
- (Optional) GitHub OAuth credentials
- (Optional) Resend API key for emails

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

Required environment variables:

| Variable             | Description                              |
| -------------------- | ---------------------------------------- |
| `DATABASE_URL`       | Neon PostgreSQL connection string        |
| `JWT_ACCESS_SECRET`  | Secret for access tokens (min 32 chars)  |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (min 32 chars) |
| `SESSION_SECRET`     | Secret for sessions (min 32 chars)       |

### 3. Generate Migrations

```bash
npm run db:generate
```

### 4. Push Schema to Database

```bash
npm run db:push
```

### 5. Seed Default Data

```bash
npm run db:seed
```

This creates:

- Default roles (user, moderator, admin)
- Default permissions
- Admin user: `admin@example.com` / `Admin@123456`

### 6. Start Development Server

```bash
npm run dev
```

Server runs at: http://localhost:3000

## 🔐 OAuth Setup Instructions

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or select existing)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
7. Copy Client ID and Client Secret to `.env`

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - Application name: Your app name
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `http://localhost:3000/api/auth/github/callback`
4. Copy Client ID and generate a Client Secret
5. Add to `.env`

## 📡 API Endpoints

### Authentication

| Method | Endpoint                    | Description               |
| ------ | --------------------------- | ------------------------- |
| POST   | `/api/auth/register`        | Create new account        |
| POST   | `/api/auth/login`           | Login with email/password |
| POST   | `/api/auth/refresh`         | Refresh access token      |
| POST   | `/api/auth/logout`          | Logout current session    |
| POST   | `/api/auth/logout-all`      | Logout all devices        |
| POST   | `/api/auth/verify-email`    | Verify email address      |
| POST   | `/api/auth/forgot-password` | Request password reset    |
| POST   | `/api/auth/reset-password`  | Reset password            |
| GET    | `/api/auth/google`          | Start Google OAuth        |
| GET    | `/api/auth/github`          | Start GitHub OAuth        |

### User Profile

| Method | Endpoint                        | Description              |
| ------ | ------------------------------- | ------------------------ |
| GET    | `/api/users/me`                 | Get current user profile |
| PATCH  | `/api/users/me`                 | Update profile           |
| POST   | `/api/users/me/change-password` | Change password          |
| GET    | `/api/users/me/sessions`        | List active sessions     |
| DELETE | `/api/users/me/sessions/:id`    | Revoke session           |
| DELETE | `/api/users/me`                 | Delete account           |

### Admin (requires admin role)

| Method | Endpoint                      | Description              |
| ------ | ----------------------------- | ------------------------ |
| GET    | `/api/admin/users`            | List all users           |
| GET    | `/api/admin/users/:id`        | Get user details         |
| PATCH  | `/api/admin/users/:id/roles`  | Update user roles        |
| PATCH  | `/api/admin/users/:id/status` | Activate/deactivate user |
| GET    | `/api/admin/roles`            | List all roles           |
| GET    | `/api/admin/permissions`      | List all permissions     |
| GET    | `/api/admin/stats`            | Dashboard statistics     |

## 🗄️ Database Schema

```
users
├── id (uuid)
├── email (unique)
├── passwordHash
├── name
├── avatarUrl
├── emailVerified
├── isActive
└── timestamps

sessions
├── id (uuid)
├── userId (fk → users)
├── refreshToken
├── userAgent
├── ipAddress
└── expiresAt

roles
├── id (uuid)
├── name (unique)
└── description

permissions
├── id (uuid)
├── name (unique)
├── resource
└── action

user_roles (junction)
├── userId (fk)
├── roleId (fk)
└── assignedBy

oauth_accounts
├── id (uuid)
├── userId (fk)
├── provider
├── providerAccountId
└── tokens
```

## 🔒 Security Features

- **Password Hashing**: Argon2id with OWASP-recommended settings
- **JWT**: Short-lived access tokens (15min) + refresh token rotation
- **Rate Limiting**: 10 attempts/15min for auth endpoints
- **HTTP-Only Cookies**: Refresh tokens stored securely
- **CORS**: Strict origin checking
- **Helmet**: Security headers (CSP, HSTS, etc.)
- **Input Validation**: All inputs validated with Zod

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed database
```

## 📁 Project Structure

```
src/
├── auth/
│   ├── jwt.ts           # JWT utilities
│   ├── password.ts      # Password hashing
│   ├── session.ts       # Session management
│   ├── middleware.ts    # Auth middleware
│   └── oauth/           # OAuth strategies
├── db/
│   ├── index.ts         # Database connection
│   ├── schema/          # Drizzle schema
│   └── seed.ts          # Seed script
├── middleware/
│   ├── error-handler.ts # Error handling
│   ├── rate-limiter.ts  # Rate limiting
│   └── validation.ts    # Request validation
├── rbac/
│   ├── roles.ts         # Role definitions
│   ├── permissions.ts   # Permission definitions
│   └── middleware.ts    # RBAC middleware
├── routes/
│   ├── auth.ts          # Auth routes
│   ├── users.ts         # User routes
│   └── admin.ts         # Admin routes
├── services/
│   └── email.ts         # Email service
├── types/
│   └── index.ts         # TypeScript types
├── utils/
│   ├── env.ts           # Environment validation
│   └── logger.ts        # Logging
└── index.ts             # App entry point
```

## 🚢 Production Deployment

1. Set `NODE_ENV=production`
2. Update all secrets with strong random values
3. Configure your production database URL
4. Set up proper CORS origins
5. Enable HTTPS
6. Configure production email service

---

Built for CIMAGE 2026 Hackathon 🏆
