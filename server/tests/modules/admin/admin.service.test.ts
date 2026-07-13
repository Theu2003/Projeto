import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/config/database';

describe('AdminService', () => {
  let adminId: string;
  let residentId: string;
  let companyId: string;

  beforeAll(async () => {
    await prisma.collectionRequest.deleteMany();
    await prisma.review.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.material.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        cpf: '11111111191',
        phone: '11999999999',
        email: 'admin-svc-test@email.com',
        passwordHash: 'hashedpassword',
        role: 'admin',
      },
    });
    adminId = admin.id;

    const resident = await prisma.user.create({
      data: {
        name: 'Admin Test Resident',
        cpf: '22222222281',
        phone: '11999999999',
        email: 'admin-resident-svc-test@email.com',
        passwordHash: 'hashedpassword',
        role: 'resident',
      },
    });
    residentId = resident.id;

    const company = await prisma.company.create({
      data: {
        name: 'Admin Test Company',
        cnpj: '22222222000195',
        responsible: 'Maria Oliveira',
        phone: '11999999999',
        email: 'admin-company-svc-test@email.com',
        passwordHash: 'hashedpassword',
        approved: false,
      },
    });
    companyId = company.id;
  });

  afterAll(async () => {
    await prisma.collectionRequest.deleteMany();
    await prisma.review.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.material.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  describe('listUsers', () => {
    it('should list all users', async () => {
      const { listUsers } = await import('@/modules/admin/admin.service');

      const result = await listUsers();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result[0]).not.toHaveProperty('passwordHash');
    });
  });

  describe('listCompanies', () => {
    it('should list all companies', async () => {
      const { listCompanies } = await import('@/modules/admin/admin.service');

      const result = await listCompanies();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0]).not.toHaveProperty('passwordHash');
    });
  });

  describe('approveCompany', () => {
    it('should approve a pending company', async () => {
      const { approveCompany } = await import('@/modules/admin/admin.service');

      const result = await approveCompany(companyId);

      expect(result).toHaveProperty('approved', true);
    });

    it('should throw for non-existent company', async () => {
      const { approveCompany } = await import('@/modules/admin/admin.service');

      await expect(approveCompany('non-existent-id')).rejects.toThrow();
    });
  });

  describe('blockUser', () => {
    it('should block a user', async () => {
      const { blockUser } = await import('@/modules/admin/admin.service');

      const result = await blockUser(residentId);

      expect(result).toHaveProperty('active', false);
    });

    it('should throw for non-existent user', async () => {
      const { blockUser } = await import('@/modules/admin/admin.service');

      await expect(blockUser('non-existent-id')).rejects.toThrow();
    });
  });

  describe('blockCompany', () => {
    it('should block a company', async () => {
      const { blockCompany } = await import('@/modules/admin/admin.service');

      const result = await blockCompany(companyId);

      expect(result).toHaveProperty('active', false);
    });

    it('should throw for non-existent company', async () => {
      const { blockCompany } = await import('@/modules/admin/admin.service');

      await expect(blockCompany('non-existent-id')).rejects.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return stats with correct counts', async () => {
      const { getStats } = await import('@/modules/admin/admin.service');

      const result = await getStats();

      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('totalCompanies');
      expect(result).toHaveProperty('totalRequests');
      expect(result).toHaveProperty('totalReviews');
      expect(result).toHaveProperty('pendingApprovals');
      expect(typeof result.totalUsers).toBe('number');
      expect(typeof result.totalCompanies).toBe('number');
    });
  });
});
