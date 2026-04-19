import rateLimit from 'express-rate-limit';
import { CONSTANTS } from '../config/constants.js';

export const authLimiter = rateLimit({
  windowMs: CONSTANTS.AUTH_RATE_LIMIT_WINDOW_MS,
  max: CONSTANTS.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many auth attempts, please try again later' },
  },
});

export const apiLimiter = rateLimit({
  windowMs: CONSTANTS.API_RATE_LIMIT_WINDOW_MS,
  max: CONSTANTS.API_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please slow down' },
  },
});
