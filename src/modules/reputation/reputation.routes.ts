import { Router, type Request, type Response, type NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { sendSuccess } from '../../lib/response.js';
import { RateSchema } from './reputation.schema.js';
import * as reputationService from './reputation.service.js';

const router = Router();
router.use(authenticate);

// POST /api/v1/reputation/projects/:id/rate
router.post(
  '/projects/:id/rate',
  validate(RateSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rating = await reputationService.rateUser(
        req.params.id,
        req.user!.userId,
        req.body,
      );
      sendSuccess(res, rating, 'Rating submitted', 201);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/reputation/users/:id
router.get(
  '/users/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ratingList = await reputationService.getUserRatings(req.params.id);
      sendSuccess(res, ratingList);
    } catch (err) {
      next(err);
    }
  },
);

export { router };
