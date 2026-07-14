import { Router } from 'express';
import * as requestController from './request.controller';
import { authenticateToken, requireRole } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import {
  createRequestSchema,
  updateRequestSchema,
  rescheduleRequestSchema,
  completeRequestSchema,
} from './request.validation';

const router = Router();

router.use(authenticateToken);

// CRUD básico
router.post('/', validate(createRequestSchema), requestController.createRequest);
router.get('/', requestController.listRequests);
router.get('/:id', requestController.getRequestById);

// Edição da solicitação (morador)
router.put('/:id', validate(updateRequestSchema), requestController.updateRequest);

// Ações da empresa
router.put('/:id/accept', requestController.acceptRequest);
router.put('/:id/reject', requestController.rejectRequest);
router.put('/:id/on-the-way', requestController.onTheWay);
router.put('/:id/complete', validate(completeRequestSchema), requestController.completeRequest);

// Ações do morador/empresa
router.put('/:id/cancel', requestController.cancelRequest);
router.put('/:id/reschedule', validate(rescheduleRequestSchema), requestController.rescheduleRequest);

export default router;
