import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '@/middleware/validate';
import {
  registerResidentSchema,
  registerCompanySchema,
  loginSchema,
  refreshTokenSchema,
  googleLoginSchema,
} from './auth.validation';

const router = Router();

router.post('/register/resident', validate(registerResidentSchema), authController.registerResident);
router.post('/register/company', validate(registerCompanySchema), authController.registerCompany);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/google', validate(googleLoginSchema), authController.googleLogin);

export default router;
