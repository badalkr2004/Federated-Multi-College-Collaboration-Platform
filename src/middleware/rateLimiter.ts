import rateLimit from 'express-rate-limit';
import { CONSTANTS } from '../config/constants.js';

export const authLimiter = rateLimit({
  windowMs: CONSTANTS.AUTH_RATE_LIMIT_WINDOW_MS,
  max: CONSTANTS.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many auth attempts, try again in 1 minute' } },
});

export const apiLimiter = rateLimit({
  windowMs: CONSTANTS.API_RATE_LIMIT_WINDOW_MS,
  max: CONSTANTS.API_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests, please slow down' } },
});

export const onboardingLimiter = rateLimit({
  windowMs: CONSTANTS.ONBOARDING_RATE_LIMIT_WINDOW_MS,
  max: CONSTANTS.ONBOARDING_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many onboarding requests, try again in 1 hour' } },
});
