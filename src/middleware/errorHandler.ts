import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors.js';
import { sendError } from '../lib/response.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path, method: req.method }, 'Application error');
    }
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // Unknown error
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  sendError(
    res,
    500,
    'INTERNAL_ERROR',
    env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  );
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`);
}
