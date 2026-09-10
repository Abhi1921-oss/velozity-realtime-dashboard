import { Router } from 'express';
import { login, refreshToken, logout, getMe } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { loginSchema } from '../validators';

const router = Router();

router.post('/login', validateRequest({ body: loginSchema }), login);
router.post('/refresh', refreshToken);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getMe);

export default router;
