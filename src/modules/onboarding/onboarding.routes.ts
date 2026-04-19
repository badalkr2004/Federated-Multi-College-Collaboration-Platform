import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { CollegeRequestSchema } from './onboarding.schema.js';
import { submitCollegeRequest, getRequestStatus } from './onboarding.service.js';
import { success } from '../../lib/response.js';

export const router = Router();

// POST /api/v1/onboarding/request
router.post('/request', validate(CollegeRequestSchema), async (req, res, next) => {
  try {
    const request = await submitCollegeRequest(req.body);
    success(res, { id: request.id, status: request.status, requestedAt: request.requestedAt }, 201,
      'College request submitted successfully. You will receive an email once reviewed.');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/onboarding/request/:id/status
router.get('/request/:id/status', async (req, res, next) => {
  try {
    const status = await getRequestStatus(req.params.id!);
    success(res, status);
  } catch (err) {
    next(err);
  }
});
