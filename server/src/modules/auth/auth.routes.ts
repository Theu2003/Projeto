import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '@/middleware/validate';
import {
  registerResidentSchema,
  registerCompanySchema,
  loginSchema,
  refreshTokenSchema,
  googleLoginSchema,
  forgotPasswordSchema,
  verifyResetCodeSchema,
  resetPasswordSchema,
} from './auth.validation';

const router = Router();

// Rotas públicas de autenticação
router.post('/register/resident', validate(registerResidentSchema), authController.registerResident);
router.post('/register/company', validate(registerCompanySchema), authController.registerCompany);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/google', validate(googleLoginSchema), authController.googleLogin);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/verify-code', validate(verifyResetCodeSchema), authController.verifyResetCode);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

export default router;
