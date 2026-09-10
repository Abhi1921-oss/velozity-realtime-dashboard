import { Router } from 'express';
import { getActivityFeed } from '../controllers/activity.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', getActivityFeed);

export default router;
