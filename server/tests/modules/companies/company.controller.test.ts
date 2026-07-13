import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { prisma } from '@/config/database';

describe('Company Controller', () => {
  let companyToken: string;

  beforeAll(async () => {
    await prisma.collectionRequest.deleteMany();
    await prisma.review.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.address.deleteMany();
    await prisma.material.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    // Register a company
    const res = await request(app)
      .post('/api/auth/register/company')
      .send({
        name: 'Controller Company',
        cnpj: '44444444000195',
        responsible: 'Ana Costa',
        phone: '11999999999',
        email: 'company-controller-test@email.com',
        password: '123456',
      });
    companyToken = res.body.token;
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

  describe('GET /api/companies/me', () => {
    it('should return company profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/companies/me')
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Controller Company');
      expect(res.body).toHaveProperty('email', 'company-controller-test@email.com');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/companies/me');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/companies/me', () => {
    it('should update company profile', async () => {
      const res = await request(app)
        .put('/api/companies/me')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          name: 'Updated Controller Company',
          phone: '11888888888',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated Controller Company');
      expect(res.body).toHaveProperty('phone', '11888888888');
    });
  });

  describe('GET /api/companies/dashboard', () => {
    it('should return company dashboard stats', async () => {
      const res = await request(app)
        .get('/api/companies/dashboard')
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalRequests');
      expect(res.body).toHaveProperty('pendingRequests');
      expect(res.body).toHaveProperty('completedRequests');
      expect(res.body).toHaveProperty('rating');
    });
  });

  describe('GET /api/companies/nearby', () => {
    it('should return nearby companies', async () => {
      const res = await request(app)
        .get('/api/companies/nearby?lat=-23.5505&lng=-46.6333&radius=50');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 400 without coordinates', async () => {
      const res = await request(app)
        .get('/api/companies/nearby');

      expect(res.status).toBe(400);
    });
  });
});
