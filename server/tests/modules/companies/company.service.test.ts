import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/config/database';

describe('CompanyService', () => {
  let companyToken: string;
  let companyId: string;

  beforeAll(async () => {
    await prisma.collectionRequest.deleteMany();
    await prisma.review.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.address.deleteMany();
    await prisma.material.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    // Create a company via auth service
    const { registerCompany } = await import('@/modules/auth/auth.service');
    const companyResult = await registerCompany({
      name: 'Company Service Test',
      cnpj: '33333333000195',
      responsible: 'Carlos Silva',
      phone: '11999999999',
      email: 'company-service-test@email.com',
      password: '123456',
    });
    companyToken = companyResult.token;
    companyId = companyResult.company.id;
  });

  afterAll(async () => {
    await prisma.collectionRequest.deleteMany();
    await prisma.review.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.address.deleteMany();
    await prisma.material.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  describe('getProfile', () => {
    it('should return company profile without password', async () => {
      const { getProfile } = await import('@/modules/companies/company.service');

      const result = await getProfile(companyId);

      expect(result).toHaveProperty('name', 'Company Service Test');
      expect(result).toHaveProperty('email', 'company-service-test@email.com');
      expect(result).toHaveProperty('cnpj', '33333333000195');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw error for non-existent company', async () => {
      const { getProfile } = await import('@/modules/companies/company.service');

      await expect(getProfile('non-existent-id')).rejects.toThrow();
    });
  });

  describe('updateProfile', () => {
    it('should update company profile', async () => {
      const { updateProfile } = await import('@/modules/companies/company.service');

      const result = await updateProfile(companyId, {
        name: 'Updated Company Name',
        phone: '11888888888',
      });

      expect(result).toHaveProperty('name', 'Updated Company Name');
      expect(result).toHaveProperty('phone', '11888888888');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should update company location', async () => {
      const { updateProfile } = await import('@/modules/companies/company.service');

      const result = await updateProfile(companyId, {
        address: 'Av Paulista, 1000',
        latitude: -23.5613,
        longitude: -46.6560,
        serviceAreaRadius: 20,
      });

      expect(result).toHaveProperty('address', 'Av Paulista, 1000');
      expect(result).toHaveProperty('latitude', -23.5613);
      expect(result).toHaveProperty('serviceAreaRadius', 20);
    });
  });

  describe('getDashboard', () => {
    it('should return company dashboard stats', async () => {
      const { getDashboard } = await import('@/modules/companies/company.service');

      const result = await getDashboard(companyId);

      expect(result).toHaveProperty('totalRequests');
      expect(result).toHaveProperty('pendingRequests');
      expect(result).toHaveProperty('completedRequests');
      expect(result).toHaveProperty('rating');
      expect(result).toHaveProperty('recentRequests');
      expect(Array.isArray(result.recentRequests)).toBe(true);
    });
  });

  describe('findNearby', () => {
    it('should find nearby companies', async () => {
      const { findNearby } = await import('@/modules/companies/company.service');

      // São Paulo coordinates
      const result = await findNearby(-23.5505, -46.6333, 50);

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
