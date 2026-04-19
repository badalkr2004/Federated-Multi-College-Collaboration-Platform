import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { resolveTenant } from './middleware/resolveTenant.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/errorHandler.js';
import { authLimiter, apiLimiter, onboardingLimiter } from './middleware/rateLimiter.js';

// Module routers
import { router as onboardingRouter } from './modules/onboarding/index.js';
import { router as adminRouter } from './modules/admin/index.js';
import { router as authRouter } from './modules/auth/index.js';
import { router as usersRouter } from './modules/users/index.js';
import { router as projectsRouter } from './modules/projects/index.js';
import { router as matchRouter } from './modules/match/index.js';
import { router as reputationRouter } from './modules/reputation/index.js';
import { router as messagesRouter } from './modules/messages/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(): express.Application {
  const app = express();

  app.set('trust proxy', 1);

  // Security
  app.use(helmet({ contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false }));
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
          cb(null, true);
        } else {
          cb(null, env.NODE_ENV === 'production' ? false : true);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-College-Key'],
    }),
  );

  // Parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  // Health check (no auth, no tenant)
  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() } });
  });

  // ── Platform-level routes (NO resolveTenant) ─────────────────────────────
  // These exist outside any tenant context
  app.use('/api/v1/onboarding', onboardingLimiter, onboardingRouter);
  app.use('/api/v1/admin', adminRouter);

  // ── Tenant-scoped routes (resolveTenant runs on each) ────────────────────
  // resolveTenant resolves Host → college and validates X-College-Key on auth routes
  app.use('/api/v1/auth', resolveTenant, authLimiter, authRouter);
  app.use('/api/v1/users', resolveTenant, apiLimiter, usersRouter);
  app.use('/api/v1/projects', resolveTenant, apiLimiter, projectsRouter);
  app.use('/api/v1/match', resolveTenant, apiLimiter, matchRouter);
  app.use('/api/v1/reputation', resolveTenant, apiLimiter, reputationRouter);
  app.use('/api/v1/messages', resolveTenant, apiLimiter, messagesRouter);

  // Serve frontend dashboard
  const frontendPath = path.join(__dirname, '..', 'frontend');
  app.use(express.static(frontendPath));
  app.get('/', (_req, res) => res.sendFile(path.join(frontendPath, 'index.html')));

  // Error handling (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
