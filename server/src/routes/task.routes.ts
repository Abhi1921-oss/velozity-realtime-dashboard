import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask,
} from '../controllers/task.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  createTaskSchema,
  updateTaskStatusSchema,
  updateTaskSchema,
} from '../validators';
import { Role } from '../types';

const router = Router();

router.use(requireAuth);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post(
  '/',
  requireRole(Role.ADMIN, Role.PROJECT_MANAGER),
  validateRequest({ body: createTaskSchema }),
  createTask
);
router.patch(
  '/:id/status',
  validateRequest({ body: updateTaskStatusSchema }),
  updateTaskStatus
);
router.put(
  '/:id',
  requireRole(Role.ADMIN, Role.PROJECT_MANAGER),
  validateRequest({ body: updateTaskSchema }),
  updateTask
);
router.delete('/:id', requireRole(Role.ADMIN, Role.PROJECT_MANAGER), deleteTask);

export default router;
