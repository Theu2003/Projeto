import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('AuthService', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  describe('registerResident', () => {
    it('should create a new resident user', async () => {
      const { registerResident } = await import('@/modules/auth/auth.service');
      
      const result = await registerResident({
        name: 'João Silva',
        cpf: '88888888881',
        phone: '11999999999',
        email: 'service-test-1@email.com',
        password: '123456',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('service-test-1@email.com');
      expect(result.user.name).toBe('João Silva');
      expect(result.user.role).toBe('resident');
      expect(result.user.passwordHash).toBeUndefined();
    });

    it('should throw error for duplicate email', async () => {
      const { registerResident } = await import('@/modules/auth/auth.service');
      
      await registerResident({
        name: 'João Silva',
        cpf: '88888888882',
        phone: '11999999999',
        email: 'service-test-2@email.com',
        password: '123456',
      });

      await expect(
        registerResident({
          name: 'Outro João',
          cpf: '88888888883',
          phone: '11888888888',
          email: 'service-test-2@email.com',
          password: '123456',
        })
      ).rejects.toThrow();
    });
  });

  describe('registerCompany', () => {
    it('should create a new company', async () => {
      const { registerCompany } = await import('@/modules/auth/auth.service');
      
      const result = await registerCompany({
        name: 'EcoRecicla LTDA',
        cnpj: '12345678000195',
        responsible: 'Maria Santos',
        phone: '11999999999',
        email: 'service-company-1@email.com',
        password: '123456',
      });

      expect(result).toHaveProperty('company');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.company.email).toBe('service-company-1@email.com');
      expect(result.company.approved).toBe(false);
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const { registerResident, login } = await import('@/modules/auth/auth.service');
      
      await registerResident({
        name: 'João Silva',
        cpf: '88888888884',
        phone: '11999999999',
        email: 'service-test-4@email.com',
        password: '123456',
      });

      const result = await login({
        email: 'service-test-4@email.com',
        password: '123456',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw error for invalid password', async () => {
      const { registerResident, login } = await import('@/modules/auth/auth.service');
      
      await registerResident({
        name: 'João Silva',
        cpf: '88888888885',
        phone: '11999999999',
        email: 'service-test-5@email.com',
        password: '123456',
      });

      await expect(
        login({
          email: 'service-test-5@email.com',
          password: 'wrong-password',
        })
      ).rejects.toThrow();
    });

    it('should throw error for non-existent email', async () => {
      const { login } = await import('@/modules/auth/auth.service');

      await expect(
        login({
          email: 'nonexistent@email.com',
          password: '123456',
        })
      ).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token with valid refresh token', async () => {
      const { registerResident, refreshToken } = await import('@/modules/auth/auth.service');
      
      const { refreshToken: oldRefreshToken } = await registerResident({
        name: 'João Silva',
        cpf: '88888888886',
        phone: '11999999999',
        email: 'service-test-6@email.com',
        password: '123456',
      });

      const result = await refreshToken(oldRefreshToken);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw error for invalid refresh token', async () => {
      const { refreshToken } = await import('@/modules/auth/auth.service');

      await expect(refreshToken('invalid-token')).rejects.toThrow();
    });
  });
});
