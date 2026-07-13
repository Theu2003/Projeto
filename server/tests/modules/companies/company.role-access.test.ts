import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { prisma } from '@/config/database';

describe('Company Controller - Role-Based Access', () => {
  let residentToken: string;
  let companyToken: string;

  beforeAll(async () => {
    await prisma.collectionRequest.deleteMany();
    await prisma.review.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.address.deleteMany();
    await prisma.material.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    // Register a resident
    const resResident = await request(app)
      .post('/api/auth/register/resident')
      .send({
        name: 'Company Role Resident',
        cpf: '77777777771',
        phone: '11999999999',
        email: 'company-role-resident@email.com',
        password: '123456',
      });
    residentToken = resResident.body.token;

    // Register a company
    const resCompany = await request(app)
      .post('/api/auth/register/company')
      .send({
        name: 'Company Role Test',
        cnpj: '77777777000195',
        responsible: 'Lucia Ferreira',
        phone: '11999999999',
        email: 'company-role-test@email.com',
        password: '123456',
      });
    companyToken = resCompany.body.token;
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

  describe('GET /api/companies/me - role enforcement', () => {
    it('should allow company to access their profile', async () => {
      const res = await request(app)
        .get('/api/companies/me')
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Company Role Test');
      expect(res.body).toHaveProperty('email', 'company-role-test@email.com');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('should reject resident from accessing company endpoints', async () => {
      const res = await request(app)
        .get('/api/companies/me')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/companies/me - role enforcement', () => {
    it('should allow company to update their profile', async () => {
      const res = await request(app)
        .put('/api/companies/me')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ name: 'Updated Company Role' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated Company Role');
    });

    it('should reject resident from updating company profile', async () => {
      const res = await request(app)
        .put('/api/companies/me')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ name: 'Hacked Company' });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/companies/dashboard - role enforcement', () => {
    it('should allow company to access dashboard', async () => {
      const res = await request(app)
        .get('/api/companies/dashboard')
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalRequests');
    });

    it('should reject resident from accessing company dashboard', async () => {
      const res = await request(app)
        .get('/api/companies/dashboard')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/companies/nearby - public endpoint', () => {
    it('should allow any authenticated user to search nearby', async () => {
      const res = await request(app)
        .get('/api/companies/nearby?lat=-23.5505&lng=-46.6333&radius=50');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
