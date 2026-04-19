import { Router, type Request, type Response, type NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { sendSuccess } from '../../lib/response.js';
import { UpdateProfileSchema, UpdateSkillsSchema } from './users.schema.js';
import * as usersService from './users.service.js';

const router = Router();

// All users routes require auth
router.use(authenticate);

// GET /api/v1/users/me
router.get('/me', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await usersService.getMe(req.user!.userId);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/users/me
router.patch(
  '/me',
  validate(UpdateProfileSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await usersService.updateProfile(req.user!.userId, req.body);
      sendSuccess(res, user, 200, 'Profile updated');
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/v1/users/me/skills
router.patch(
  '/me/skills',
  validate(UpdateSkillsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await usersService.updateSkills(req.user!.userId, req.body);
      sendSuccess(res, user, 200, 'Skills updated');
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/users/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await usersService.getUserById(req.params.id, req.user!.collegeId);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
});

export { router };
