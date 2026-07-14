import { Router } from 'express';
import * as userController from './user.controller';
import { authenticateToken } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { updateUserSchema } from './user.validation';

const router = Router();

router.use(authenticateToken);

// Rotas acessíveis tanto por moradores quanto empresas
router.get('/me', userController.getProfile);
router.put('/me', validate(updateUserSchema), userController.updateProfile);
router.get('/dashboard', userController.getDashboard);
router.get('/points', userController.getPoints);

export default router;
