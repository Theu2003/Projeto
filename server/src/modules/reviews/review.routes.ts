import { Router } from 'express';
import * as reviewController from './review.controller';
import { authenticateToken } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { createReviewSchema } from './review.validation';

const router = Router();

router.use(authenticateToken);

router.post('/', validate(createReviewSchema), reviewController.createReview);
router.get('/company/:companyId', reviewController.listReviewsByCompany);

export default router;
