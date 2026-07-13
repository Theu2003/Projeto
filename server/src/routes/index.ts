import { Router } from 'express';
import authRoutes from '@/modules/auth/auth.routes';
import userRoutes from '@/modules/users/user.routes';
import companyRoutes from '@/modules/companies/company.routes';
import requestRoutes from '@/modules/requests/request.routes';
import reviewRoutes from '@/modules/reviews/review.routes';
import notificationRoutes from '@/modules/notifications/notification.routes';
import adminRoutes from '@/modules/admin/admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/companies', companyRoutes);
router.use('/requests', requestRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export default router;
