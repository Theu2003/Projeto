import { describe, it, expect } from 'vitest';
import { registerResidentSchema, registerCompanySchema, loginSchema, refreshTokenSchema } from '@/modules/auth/auth.validation';

describe('Auth Validation', () => {
  describe('registerResidentSchema', () => {
    it('should accept valid resident registration data', () => {
      const result = registerResidentSchema.safeParse({
        name: 'João Silva',
        cpf: '12345678901',
        phone: '11999999999',
        email: 'joao@email.com',
        password: '123456',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = registerResidentSchema.safeParse({
        name: 'João Silva',
        cpf: '12345678901',
        phone: '11999999999',
        email: 'invalid-email',
        password: '123456',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = registerResidentSchema.safeParse({
        name: 'João Silva',
        cpf: '12345678901',
        phone: '11999999999',
        email: 'joao@email.com',
        password: '12345',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const result = registerResidentSchema.safeParse({
        name: 'João Silva',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('registerCompanySchema', () => {
    it('should accept valid company registration data', () => {
      const result = registerCompanySchema.safeParse({
        name: 'EcoRecicla LTDA',
        cnpj: '12345678000195',
        responsible: 'Maria Santos',
        phone: '11999999999',
        email: 'contato@ecorecicla.com',
        password: '123456',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid CNPJ', () => {
      const result = registerCompanySchema.safeParse({
        name: 'EcoRecicla LTDA',
        cnpj: '12345',
        responsible: 'Maria Santos',
        phone: '11999999999',
        email: 'contato@ecorecicla.com',
        password: '123456',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'user@email.com',
        password: '123456',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing email', () => {
      const result = loginSchema.safeParse({
        password: '123456',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const result = loginSchema.safeParse({
        email: 'user@email.com',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('refreshTokenSchema', () => {
    it('should accept valid refresh token', () => {
      const result = refreshTokenSchema.safeParse({
        refreshToken: 'some-jwt-token',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing refresh token', () => {
      const result = refreshTokenSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
