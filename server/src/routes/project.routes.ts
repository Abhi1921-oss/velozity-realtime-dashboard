import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/project.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createProjectSchema, updateProjectSchema } from '../validators';
import { Role } from '../types';

const router = Router();

router.use(requireAuth);

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post(
  '/',
  requireRole(Role.ADMIN, Role.PROJECT_MANAGER),
  validateRequest({ body: createProjectSchema }),
  createProject
);
router.put(
  '/:id',
  requireRole(Role.ADMIN, Role.PROJECT_MANAGER),
  validateRequest({ body: updateProjectSchema }),
  updateProject
);
router.delete('/:id', requireRole(Role.ADMIN, Role.PROJECT_MANAGER), deleteProject);

export default router;
