import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { prisma } from '@/config/database';

describe('User Controller - Role-Based Access', () => {
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
        name: 'Role Resident',
        cpf: '66666666661',
        phone: '11999999999',
        email: 'role-resident-test@email.com',
        password: '123456',
      });
    residentToken = resResident.body.token;

    // Register a company
    const resCompany = await request(app)
      .post('/api/auth/register/company')
      .send({
        name: 'Role Company',
        cnpj: '66666666000195',
        responsible: 'Pedro Lima',
        phone: '11999999999',
        email: 'role-company-test@email.com',
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

  describe('GET /api/users/me - role enforcement', () => {
    it('should allow resident to access their profile', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Role Resident');
      expect(res.body).toHaveProperty('email', 'role-resident-test@email.com');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('should reject company from accessing user endpoints', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/users/me - role enforcement', () => {
    it('should allow resident to update their profile', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ name: 'Updated Role Resident' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated Role Resident');
    });

    it('should reject company from updating user profile', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/users/dashboard - role enforcement', () => {
    it('should allow resident to access dashboard', async () => {
      const res = await request(app)
        .get('/api/users/dashboard')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalRequests');
    });

    it('should reject company from accessing user dashboard', async () => {
      const res = await request(app)
        .get('/api/users/dashboard')
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/users/points - role enforcement', () => {
    it('should allow resident to access points', async () => {
      const res = await request(app)
        .get('/api/users/points')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalPoints');
    });

    it('should reject company from accessing user points', async () => {
      const res = await request(app)
        .get('/api/users/points')
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(403);
    });
  });
});
