import { Router } from 'express';
import { getDashboardStats } from '../controllers/stats.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/dashboard', getDashboardStats);

export default router;
