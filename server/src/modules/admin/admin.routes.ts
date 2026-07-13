import { Router } from 'express';
import * as adminController from './admin.controller';
import { authenticateToken, requireRole } from '@/middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/users', adminController.listUsers);
router.get('/companies', adminController.listCompanies);
router.put('/companies/:id/approve', adminController.approveCompany);
router.put('/users/:id/block', adminController.blockUser);
router.put('/companies/:id/block', adminController.blockCompany);
router.get('/stats', adminController.getStats);

export default router;
