import { Router, Request, Response, NextFunction } from 'express';
import * as companyController from './company.controller';
import { authenticateToken, requireRole } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { updateCompanySchema, nearbySearchSchema } from './company.validation';

const router = Router();

router.get('/nearby', (req: Request, res: Response, next: NextFunction) => {
  const result = nearbySearchSchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ error: 'Validation error', details: result.error.issues });
    return;
  }
  req.query = result.data as any;
  next();
}, companyController.findNearby);

router.use(authenticateToken);
router.use(requireRole('company'));

router.get('/me', companyController.getProfile);
router.put('/me', validate(updateCompanySchema), companyController.updateProfile);
router.get('/dashboard', companyController.getDashboard);

export default router;
