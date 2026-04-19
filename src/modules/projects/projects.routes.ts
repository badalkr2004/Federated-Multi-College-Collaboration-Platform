import { Router, type Request, type Response, type NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { sendSuccess } from '../../lib/response.js';
import { CreateProjectSchema, UpdateProjectSchema } from './projects.schema.js';
import * as projectsService from './projects.service.js';

const router = Router();
router.use(authenticate);

// POST /api/v1/projects
router.post(
  '/',
  validate(CreateProjectSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const project = await projectsService.createProject(
        req.body,
        req.user!.userId,
        req.user!.collegeId,
      );
      sendSuccess(res, project, 201, 'Project created');
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/projects
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const list = await projectsService.listProjects(req.user!.collegeId);
    sendSuccess(res, list);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/projects/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await projectsService.getProject(req.params.id, req.user!.collegeId);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/projects/:id
router.patch(
  '/:id',
  validate(UpdateProjectSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const project = await projectsService.updateProject(req.params.id, req.body, req.user!.userId, req.user!.collegeId);
      sendSuccess(res, project, 200, 'Project updated');
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/projects/:id/join
router.post('/:id/join', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await projectsService.joinProject(req.params.id, req.user!.userId, req.user!.collegeId);
    sendSuccess(res, null, 200, 'Joined project successfully');
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/projects/:id/leave
router.delete('/:id/leave', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await projectsService.leaveProject(req.params.id, req.user!.userId);
    sendSuccess(res, null, 200, 'Left project successfully');
  } catch (err) {
    next(err);
  }
});

export { router };
