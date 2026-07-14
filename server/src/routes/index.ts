import { Router } from 'express';
import authRoutes from '@/modules/auth/auth.routes';
import userRoutes from '@/modules/users/user.routes';
import companyRoutes from '@/modules/companies/company.routes';
import requestRoutes from '@/modules/requests/request.routes';
import reviewRoutes from '@/modules/reviews/review.routes';
import notificationRoutes from '@/modules/notifications/notification.routes';
import adminRoutes from '@/modules/admin/admin.routes';
import materialRoutes from '@/modules/materials/material.routes';

const router = Router();

// Rotas públicas
router.use('/materials', materialRoutes);

// Rotas de autenticação
router.use('/auth', authRoutes);

// Rotas protegidas
router.use('/users', userRoutes);
router.use('/companies', companyRoutes);
router.use('/requests', requestRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export default router;
