import { Router, type Request, type Response, type NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { sendSuccess } from '../../lib/response.js';
import * as matchService from './match.service.js';

const router = Router();
router.use(authenticate);

// GET /api/v1/match/projects — ranked projects for current user
router.get('/projects', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, collegeId } = req.user!;
    if (!collegeId) {
      sendSuccess(res, []); // super_admin has no college
      return;
    }
    const matches = await matchService.matchProjectsForUser(userId, collegeId);
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
      const { collegeId } = req.user!;
      if (!collegeId) {
        sendSuccess(res, []);
        return;
      }
      const matches = await matchService.matchUsersForProject(
        req.params.projectId,
        collegeId,
      );
      sendSuccess(res, matches);
    } catch (err) {
      next(err);
    }
  },
);

export { router };
