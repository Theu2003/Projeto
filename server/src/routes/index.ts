import { Router } from 'express';
import authRoutes from '@/modules/auth/auth.routes';
import userRoutes from '@/modules/users/user.routes';
import companyRoutes from '@/modules/companies/company.routes';
import requestRoutes from '@/modules/requests/request.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/companies', companyRoutes);
router.use('/requests', requestRoutes);

export default router;
