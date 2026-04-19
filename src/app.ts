import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Module routers
import { router as authRouter } from './modules/auth/index.js';
import { router as usersRouter } from './modules/users/index.js';
import { router as projectsRouter } from './modules/projects/index.js';
import { router as matchRouter } from './modules/match/index.js';
import { router as reputationRouter } from './modules/reputation/index.js';
import { router as messagesRouter } from './modules/messages/index.js';

export function createApp(): express.Application {
  const app = express();

  app.set('trust proxy', 1);

  // Security
  app.use(helmet({ contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false }));
  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow any localhost origin in development (covers file://, 5173, 5174, etc.)
        if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === 'null') {
          cb(null, true);
        } else {
          cb(null, env.NODE_ENV === 'production' ? false : true);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // Parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  // Health check (unauthenticated)
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      data: { status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() },
    });
  });

  // API v1
  app.use('/api/v1', apiLimiter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/projects', projectsRouter);
  app.use('/api/v1/match', matchRouter);
  app.use('/api/v1/reputation', reputationRouter);
  app.use('/api/v1/messages', messagesRouter);

  // Serve frontend dashboard
  const frontendPath = path.join(__dirname, '..', 'frontend');
  app.use(express.static(frontendPath));
  app.get('/', (_req, res) => res.sendFile(path.join(frontendPath, 'index.html')));

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
