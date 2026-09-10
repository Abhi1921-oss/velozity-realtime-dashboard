import { Router } from 'express';
import { getUsers, getClients, createClient } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createClientSchema } from '../validators';
import { Role } from '../types';

const router = Router();

router.use(requireAuth);

router.get('/users', getUsers);
router.get('/clients', getClients);
router.post(
  '/clients',
  requireRole(Role.ADMIN),
  validateRequest({ body: createClientSchema }),
  createClient
);

export default router;
