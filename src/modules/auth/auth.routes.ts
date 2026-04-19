import { Router, type Request, type Response, type NextFunction } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import { RegisterSchema, LoginSchema } from './auth.schema.js';
import * as authService from './auth.service.js';
import { sendSuccess } from '../../lib/response.js';

const router = Router();

// POST /api/v1/auth/register
router.post(
  '/register',
  authLimiter,
  validate(RegisterSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.register(req.body);
      sendSuccess(res, result, 'Registration successful', 201);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/auth/login
router.post(
  '/login',
  authLimiter,
  validate(LoginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/auth/logout (stateless JWT — just acknowledge)
router.post('/logout', authenticate, (_req: Request, res: Response): void => {
  sendSuccess(res, null, 'Logged out successfully');
});

export { router };
