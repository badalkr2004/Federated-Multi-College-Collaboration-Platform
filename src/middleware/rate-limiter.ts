import rateLimit from 'express-rate-limit';
import { ApiResponse } from '../types';

// Standard rate limiter for API endpoints
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    },
  } as ApiResponse,
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many authentication attempts, please try again later',
    },
  } as ApiResponse,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
});

// Very strict rate limiter for password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many password reset attempts, please try again later',
    },
  } as ApiResponse,
  standardHeaders: true,
  legacyHeaders: false,
});

// Create session rate limiter for OAuth
export const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 OAuth requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many OAuth attempts, please try again later',
    },
  } as ApiResponse,
  standardHeaders: true,
  legacyHeaders: false,
});
