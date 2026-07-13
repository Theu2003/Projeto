import { Router } from 'express';
import * as notificationController from './notification.controller';
import { authenticateToken } from '@/middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', notificationController.listNotifications);
router.put('/:id/read', notificationController.markAsRead);

export default router;
