import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { prisma } from '@/config/database';

describe('Admin Controller', () => {
  let adminToken: string;
  let residentToken: string;
  let companyId: string;

  beforeAll(async () => {
    await prisma.review.deleteMany();
    await prisma.collectionRequest.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.material.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    await request(app)
      .post('/api/auth/register/resident')
      .send({
        name: 'Admin Controller User',
        cpf: '55555555551',
        phone: '11999999999',
        email: 'admin-ctrl@email.com',
        password: '123456',
      });

    await prisma.user.update({
      where: { email: 'admin-ctrl@email.com' },
      data: { role: 'admin' },
    });

    const loginAdmin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin-ctrl@email.com',
        password: '123456',
      });
    adminToken = loginAdmin.body.token;

    const resResident = await request(app)
      .post('/api/auth/register/resident')
      .send({
        name: 'Admin Test Resident',
        cpf: '66666666661',
        phone: '11999999999',
        email: 'admin-ctrl-resident@email.com',
        password: '123456',
      });
    residentToken = resResident.body.token;

    const resCompany = await request(app)
      .post('/api/auth/register/company')
      .send({
        name: 'Admin Test Company',
        cnpj: '66666666000195',
        responsible: 'Paulo Mendes',
        phone: '11999999999',
        email: 'admin-ctrl-company@email.com',
        password: '123456',
      });
    companyId = resCompany.body.company.id;
  });

  afterAll(async () => {
    await prisma.review.deleteMany();
    await prisma.collectionRequest.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.material.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /api/admin/users', () => {
    it('should list all users as admin', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/companies', () => {
    it('should list all companies as admin', async () => {
      const res = await request(app)
        .get('/api/admin/companies')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app)
        .get('/api/admin/companies')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/admin/companies/:id/approve', () => {
    it('should approve a company as admin', async () => {
      const res = await request(app)
        .put(`/api/admin/companies/${companyId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('approved', true);
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app)
        .put(`/api/admin/companies/${companyId}/approve`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/admin/users/:id/block', () => {
    it('should block a user as admin', async () => {
      const userRes = await request(app)
        .post('/api/auth/register/resident')
        .send({
          name: 'Blockable User',
          cpf: '77777777771',
          phone: '11999999999',
          email: 'admin-ctrl-blockable@email.com',
          password: '123456',
        });

      const res = await request(app)
        .put(`/api/admin/users/${userRes.body.user.id}/block`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('active', false);
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app)
        .put(`/api/admin/users/some-id/block`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/admin/companies/:id/block', () => {
    it('should block a company as admin', async () => {
      const res = await request(app)
        .put(`/api/admin/companies/${companyId}/block`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('active', false);
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app)
        .put(`/api/admin/companies/some-id/block`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return stats as admin', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalUsers');
      expect(res.body).toHaveProperty('totalCompanies');
      expect(res.body).toHaveProperty('totalRequests');
      expect(res.body).toHaveProperty('totalReviews');
      expect(res.body).toHaveProperty('pendingApprovals');
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
    });
  });
});
