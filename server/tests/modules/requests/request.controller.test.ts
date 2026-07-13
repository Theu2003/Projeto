import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { prisma } from '@/config/database';

describe('Request Controller', () => {
  let residentToken: string;
  let companyToken: string;
  let companyId: string;

  beforeAll(async () => {
    await prisma.collectionRequest.deleteMany();
    await prisma.review.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.material.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    const resResident = await request(app)
      .post('/api/auth/register/resident')
      .send({
        name: 'Request Controller Resident',
        cpf: '66666666661',
        phone: '11999999999',
        email: 'request-ctrl-resident@email.com',
        password: '123456',
      });
    residentToken = resResident.body.token;

    const resCompany = await request(app)
      .post('/api/auth/register/company')
      .send({
        name: 'Request Controller Company',
        cnpj: '66666666000195',
        responsible: 'Ana Souza',
        phone: '11999999999',
        email: 'request-ctrl-company@email.com',
        password: '123456',
      });
    companyToken = resCompany.body.token;
    companyId = resCompany.body.company.id;

    // Approve the company via direct DB update
    await prisma.company.update({
      where: { id: companyId },
      data: { approved: true },
    });
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

  describe('POST /api/requests', () => {
    it('should create a request when authenticated as resident', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          materialType: 'plastic',
          quantityKg: 5,
          address: 'Rua Teste, 123',
          latitude: -23.55,
          longitude: -46.63,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('status', 'pending');
      expect(res.body).toHaveProperty('materialType', 'plastic');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/requests')
        .send({
          materialType: 'plastic',
          quantityKg: 5,
        });

      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid data', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          materialType: '',
          quantityKg: -1,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/requests', () => {
    it('should list requests for resident', async () => {
      const res = await request(app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should list requests for company', async () => {
      const res = await request(app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/requests/:id', () => {
    it('should return request details', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          materialType: 'paper',
          quantityKg: 3,
        });

      const res = await request(app)
        .get(`/api/requests/${createRes.body.id}`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createRes.body.id);
      expect(res.body).toHaveProperty('user');
    });
  });

  describe('PUT /api/requests/:id/accept', () => {
    it('should accept a request as company', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          materialType: 'glass',
          quantityKg: 4,
        });

      const res = await request(app)
        .put(`/api/requests/${createRes.body.id}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'accepted');
    });
  });

  describe('PUT /api/requests/:id/on-the-way', () => {
    it('should update to on_the_way', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          materialType: 'metal',
          quantityKg: 2,
        });

      await request(app)
        .put(`/api/requests/${createRes.body.id}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);

      const res = await request(app)
        .put(`/api/requests/${createRes.body.id}/on-the-way`)
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'on_the_way');
    });
  });

  describe('PUT /api/requests/:id/complete', () => {
    it('should complete a request with real weight', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          materialType: 'plastic',
          quantityKg: 6,
        });

      await request(app)
        .put(`/api/requests/${createRes.body.id}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);

      await request(app)
        .put(`/api/requests/${createRes.body.id}/on-the-way`)
        .set('Authorization', `Bearer ${companyToken}`);

      const res = await request(app)
        .put(`/api/requests/${createRes.body.id}/complete`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ realWeight: 5.5 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'completed');
      expect(res.body).toHaveProperty('realWeight', 5.5);
    });
  });

  describe('PUT /api/requests/:id/cancel', () => {
    it('should cancel a pending request', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          materialType: 'paper',
          quantityKg: 1,
        });

      const res = await request(app)
        .put(`/api/requests/${createRes.body.id}/cancel`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'cancelled');
    });
  });

  describe('PUT /api/requests/:id/reschedule', () => {
    it('should reschedule a request', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          materialType: 'glass',
          quantityKg: 2,
          desiredDate: '2026-08-01',
          desiredTime: '10:00',
        });

      const res = await request(app)
        .put(`/api/requests/${createRes.body.id}/reschedule`)
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          desiredDate: '2026-08-10',
          desiredTime: '14:00',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('desiredDate', '2026-08-10');
      expect(res.body).toHaveProperty('desiredTime', '14:00');
    });
  });
});
