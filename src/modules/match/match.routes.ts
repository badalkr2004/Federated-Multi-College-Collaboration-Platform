import { Router, type Request, type Response, type NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { sendSuccess } from '../../lib/response.js';
import * as matchService from './match.service.js';

const router = Router();
router.use(authenticate);

// GET /api/v1/match/projects — ranked projects for current user
router.get('/projects', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const matches = await matchService.matchProjectsForUser(req.user!.userId);
    sendSuccess(res, matches);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/match/users/:projectId — ranked users for a project
router.get(
  '/users/:projectId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const matches = await matchService.matchUsersForProject(
        req.params.projectId,
        req.user!.collegeId,
      );
      sendSuccess(res, matches);
    } catch (err) {
      next(err);
    }
  },
);

export { router };
