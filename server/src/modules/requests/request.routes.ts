import { Router } from 'express';
import * as requestController from './request.controller';
import { authenticateToken } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { createRequestSchema, rescheduleRequestSchema, completeRequestSchema } from './request.validation';

const router = Router();

router.use(authenticateToken);

router.post('/', validate(createRequestSchema), requestController.createRequest);
router.get('/', requestController.listRequests);
router.get('/:id', requestController.getRequestById);
router.put('/:id/accept', requestController.acceptRequest);
router.put('/:id/reject', requestController.rejectRequest);
router.put('/:id/on-the-way', requestController.onTheWay);
router.put('/:id/complete', validate(completeRequestSchema), requestController.completeRequest);
router.put('/:id/cancel', requestController.cancelRequest);
router.put('/:id/reschedule', validate(rescheduleRequestSchema), requestController.rescheduleRequest);

export default router;
