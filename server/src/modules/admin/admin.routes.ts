import { Router } from 'express';
import * as adminController from './admin.controller';
import { authenticateToken, requireRole } from '@/middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(requireRole('admin'));

// Usuários
router.get('/users', adminController.listUsers);
router.put('/users/:id/block', adminController.blockUser);
router.put('/users/:id/toggle-active', adminController.toggleUserActive);

// Empresas
router.get('/companies', adminController.listCompanies);
router.put('/companies/:id/approve', adminController.approveCompany);
router.put('/companies/:id/block', adminController.blockCompany);
router.put('/companies/:id/toggle-active', adminController.toggleCompanyActive);

// Estatísticas e relatórios
router.get('/stats', adminController.getStats);
router.get('/reports', adminController.getReports);

export default router;
