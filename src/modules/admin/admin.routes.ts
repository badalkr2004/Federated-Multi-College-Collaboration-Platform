import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireSuperAdmin } from '../../middleware/requireSuperAdmin.js';
import { validate } from '../../middleware/validate.js';
import { RejectSchema, AdminLoginSchema } from './admin.schema.js';
import {
  adminLogin,
  listAllRequests,
  listPendingRequests,
  approveCollegeRequest,
  rejectCollegeRequest,
  listColleges,
  deactivateCollege,
} from './admin.service.js';
import { success } from '../../lib/response.js';

export const router = Router();

// POST /api/v1/admin/auth/login — super admin login (no resolveTenant)
router.post('/auth/login', validate(AdminLoginSchema), async (req, res, next) => {
  try {
    const token = await adminLogin(req.body.email, req.body.password);
    success(res, { token }, 200, 'Super admin login successful');
  } catch (err) {
    next(err);
  }
});

// All routes below require super_admin JWT
router.use(authenticate, requireSuperAdmin);

// GET /api/v1/admin/requests?status=pending
router.get('/requests', async (req, res, next) => {
  try {
    const status = req.query['status'] as string | undefined;
    const requests = status === 'pending' ? await listPendingRequests() : await listAllRequests();
    success(res, requests);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/requests/:id/approve
router.post('/requests/:id/approve', async (req, res, next) => {
  try {
    const college = await approveCollegeRequest(req.params.id!, req.user!.userId);
    // Don't expose API key in list response — it's emailed to the contact
    success(res, {
      ...college,
      apiKey: `${college.apiKey.substring(0, 15)}...`, // partial reveal
    }, 200, 'College approved and provisioned');
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/requests/:id/reject
router.post('/requests/:id/reject', validate(RejectSchema), async (req, res, next) => {
  try {
    await rejectCollegeRequest(req.params.id!, req.user!.userId, req.body.reason);
    success(res, null, 200, 'Request rejected');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/colleges
router.get('/colleges', async (_req, res, next) => {
  try {
    const collegeList = await listColleges();
    // Mask API keys in list response
    success(res, collegeList.map(c => ({ ...c, apiKey: `${c.apiKey.substring(0, 15)}...` })));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/admin/colleges/:id/deactivate
router.patch('/colleges/:id/deactivate', async (req, res, next) => {
  try {
    await deactivateCollege(req.params.id!);
    success(res, null, 200, 'College deactivated');
  } catch (err) {
    next(err);
  }
});
