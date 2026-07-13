import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/config/database';

describe('UserService', () => {
  let residentToken: string;
  let companyId: string;

  beforeAll(async () => {
    await prisma.collectionRequest.deleteMany();
    await prisma.review.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.address.deleteMany();
    await prisma.material.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    // Create a resident user via auth service
    const { registerResident } = await import('@/modules/auth/auth.service');
    const residentResult = await registerResident({
      name: 'Resident User',
      cpf: '55555555551',
      phone: '11999999999',
      email: 'user-svc-test-5@email.com',
      password: '123456',
    });
    residentToken = residentResult.token;

    // Create a company
    const { registerCompany } = await import('@/modules/auth/auth.service');
    const companyResult = await registerCompany({
      name: 'EcoRecicla Test',
      cnpj: '55555555000195',
      responsible: 'Maria Santos',
      phone: '11999999999',
      email: 'company-svc-test-5@email.com',
      password: '123456',
    });
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
    it('should return user profile without password', async () => {
      const { getProfile } = await import('@/modules/users/user.service');
      const user = await prisma.user.findFirst({ where: { email: 'user-svc-test-5@email.com' } });

      const result = await getProfile(user.id, 'resident');

      expect(result).toHaveProperty('name', 'Resident User');
      expect(result).toHaveProperty('email', 'user-svc-test-5@email.com');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw error for non-existent user', async () => {
      const { getProfile } = await import('@/modules/users/user.service');

      await expect(getProfile('non-existent-id', 'resident')).rejects.toThrow();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const { updateProfile } = await import('@/modules/users/user.service');
      const user = await prisma.user.findFirst({ where: { email: 'user-svc-test-5@email.com' } });

      const result = await updateProfile(user.id, 'resident', {
        name: 'Updated Name',
        phone: '11888888888',
      });

      expect(result).toHaveProperty('name', 'Updated Name');
      expect(result).toHaveProperty('phone', '11888888888');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should update user address and coordinates', async () => {
      const { updateProfile } = await import('@/modules/users/user.service');
      const user = await prisma.user.findFirst({ where: { email: 'user-svc-test-5@email.com' } });

      const result = await updateProfile(user.id, 'resident', {
        address: 'Rua Teste, 123',
        latitude: -23.5505,
        longitude: -46.6333,
      });

      expect(result).toHaveProperty('address', 'Rua Teste, 123');
      expect(result).toHaveProperty('latitude', -23.5505);
      expect(result).toHaveProperty('longitude', -46.6333);
    });
  });

  describe('getDashboard', () => {
    it('should return user dashboard stats', async () => {
      const { getDashboard } = await import('@/modules/users/user.service');
      const user = await prisma.user.findFirst({ where: { email: 'user-svc-test-5@email.com' } });

      const result = await getDashboard(user.id);

      expect(result).toHaveProperty('totalRequests');
      expect(result).toHaveProperty('completedRequests');
      expect(result).toHaveProperty('pendingRequests');
      expect(result).toHaveProperty('points');
      expect(result).toHaveProperty('recentRequests');
      expect(Array.isArray(result.recentRequests)).toBe(true);
    });
  });

  describe('getPoints', () => {
    it('should return user points', async () => {
      const { getPoints } = await import('@/modules/users/user.service');
      const user = await prisma.user.findFirst({ where: { email: 'user-svc-test-5@email.com' } });

      const result = await getPoints(user.id);

      expect(result).toHaveProperty('totalPoints');
      expect(result).toHaveProperty('monthlyPoints');
      expect(result).toHaveProperty('ranking');
    });
  });
});
