import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { sendSuccess, sendPaginated } from '../../lib/response.js';
import { SendMessageSchema } from './messages.schema.js';
import * as messagesService from './messages.service.js';
import { CONSTANTS } from '../../config/constants.js';

const router = Router();
router.use(authenticate);

// POST /api/v1/messages/projects/:id
router.post(
  '/projects/:id',
  validate(SendMessageSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const message = await messagesService.sendMessage(
        req.params.id,
        req.user!.userId,
        req.user!.collegeId,
        req.body,
      );
      sendSuccess(res, message, 201, 'Message sent');
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/messages/projects/:id
router.get(
  '/projects/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(String(req.query.page ?? '1'), 10);
      const limit = Math.min(
        parseInt(String(req.query.limit ?? '50'), 10),
        CONSTANTS.MAX_LIMIT,
      );
      const result = await messagesService.getMessages(
        req.params.id,
        req.user!.userId,
        req.user!.collegeId,
        page,
        limit,
      );
      sendPaginated(res, result.messages, page, limit, result.total);
    } catch (err) {
      next(err);
    }
  },
);

export { router };
