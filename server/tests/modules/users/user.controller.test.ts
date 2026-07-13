import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { prisma } from '@/config/database';

describe('User Controller', () => {
  let residentToken: string;

  beforeAll(async () => {
    await prisma.collectionRequest.deleteMany();
    await prisma.review.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.address.deleteMany();
    await prisma.material.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    // Register a resident
    const res = await request(app)
      .post('/api/auth/register/resident')
      .send({
        name: 'Controller Resident',
        cpf: '22222222221',
        phone: '11999999999',
        email: 'user-controller-test@email.com',
        password: '123456',
      });
    residentToken = res.body.token;
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

  describe('GET /api/users/me', () => {
    it('should return user profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Controller Resident');
      expect(res.body).toHaveProperty('email', 'user-controller-test@email.com');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/users/me');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/users/me', () => {
    it('should update user profile', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          name: 'Updated Controller Name',
          phone: '11888888888',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated Controller Name');
      expect(res.body).toHaveProperty('phone', '11888888888');
    });

    it('should return 400 for invalid data', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          email: 'not-an-email',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/users/dashboard', () => {
    it('should return dashboard stats', async () => {
      const res = await request(app)
        .get('/api/users/dashboard')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalRequests');
      expect(res.body).toHaveProperty('completedRequests');
      expect(res.body).toHaveProperty('pendingRequests');
      expect(res.body).toHaveProperty('points');
      expect(res.body).toHaveProperty('recentRequests');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/users/dashboard');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users/points', () => {
    it('should return points info', async () => {
      const res = await request(app)
        .get('/api/users/points')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalPoints');
      expect(res.body).toHaveProperty('monthlyPoints');
      expect(res.body).toHaveProperty('ranking');
    });
  });
});
