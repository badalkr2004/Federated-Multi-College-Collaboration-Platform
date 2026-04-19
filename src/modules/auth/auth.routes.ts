import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { RegisterSchema, LoginSchema } from './auth.schema.js';
import { register, login, getMe } from './auth.service.js';
import { success } from '../../lib/response.js';

export const router = Router();

// POST /api/v1/auth/register
// Headers: X-College-Key: <apiKey> (validated by resolveTenant)
router.post('/register', validate(RegisterSchema), async (req, res, next) => {
  try {
    const result = await register(req.body, req.tenant!);
    success(res, result, 201, 'Registration successful');
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/login
// Headers: X-College-Key: <apiKey> (validated by resolveTenant)
router.post('/login', validate(LoginSchema), async (req, res, next) => {
  try {
    const result = await login(req.body, req.tenant!);
    success(res, result, 200, 'Login successful');
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticate, (_req, res) => {
  success(res, null, 200, 'Logout successful — discard the JWT client-side');
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await getMe(req.user!.userId);
    success(res, user);
  } catch (err) {
    next(err);
  }
});
