import { z } from 'zod';

export const registerResidentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  cpf: z.string().length(11, 'CPF must be 11 digits'),
  phone: z.string().min(10, 'Phone is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerCompanySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  cnpj: z.string().length(14, 'CNPJ must be 14 digits'),
  responsible: z.string().min(1, 'Responsible person is required'),
  phone: z.string().min(10, 'Phone is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const googleLoginSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
});

export type RegisterResidentInput = z.infer<typeof registerResidentSchema>;
export type RegisterCompanyInput = z.infer<typeof registerCompanySchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
