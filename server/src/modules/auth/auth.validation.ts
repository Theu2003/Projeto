import { z } from 'zod';

export const registerResidentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cpf: z.string().length(11, 'CPF deve ter 11 dígitos'),
  phone: z.string().min(10, 'Telefone é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const registerCompanySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cnpj: z.string().length(14, 'CNPJ deve ter 14 dígitos'),
  responsible: z.string().min(1, 'Responsável é obrigatório'),
  phone: z.string().min(10, 'Telefone é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

export const googleLoginSchema = z.object({
  credential: z.string().min(1, 'Credencial Google é obrigatória'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const verifyResetCodeSchema = z.object({
  email: z.string().email('Email inválido'),
  code: z.string().length(6, 'Código deve ter 6 dígitos'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
  code: z.string().length(6, 'Código deve ter 6 dígitos'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export type RegisterResidentInput = z.infer<typeof registerResidentSchema>;
export type RegisterCompanyInput = z.infer<typeof registerCompanySchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyResetCodeInput = z.infer<typeof verifyResetCodeSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
