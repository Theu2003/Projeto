import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Request Endpoints', () => {
  let residentToken: string;
  let residentId: string;
  let companyToken: string;
  let companyId: string;

  beforeAll(async () => {
    await prisma.collectionRequest.deleteMany();
    await prisma.review.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.material.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    // Create resident
    const regRes = await request(app)
      .post('/api/auth/register/resident')
      .send({
        name: 'Request Resident',
        cpf: '12121212121',
        phone: '11988887777',
        email: 'req-resident@test.com',
        password: 'pass123',
      });
    residentToken = regRes.body.token;
    residentId = regRes.body.user.id;

    // Create company
    const compRes = await request(app)
      .post('/api/auth/register/company')
      .send({
        name: 'Request Company',
        cnpj: '12121212000191',
        responsible: 'Carlos',
        phone: '11988887777',
        email: 'req-company@test.com',
        password: 'pass123',
      });
    companyToken = compRes.body.token;
    companyId = compRes.body.company.id;

    // Approve company
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

  describe('create and retrieve', () => {
    it('creates a request with full data and retrieves it', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          materialType: 'plastic',
          quantityKg: 15,
          address: 'Rua das Flores, 456',
          latitude: -23.56,
          longitude: -46.64,
          observations: 'Leave at the gate',
          desiredDate: '2026-09-01',
          desiredTime: '10:00',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.status).toBe('pending');
      expect(createRes.body.quantityKg).toBe(15);
      expect(createRes.body.address).toBe('Rua das Flores, 456');

      const getRes = await request(app)
        .get(`/api/requests/${createRes.body.id}`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.materialType).toBe('plastic');
      expect(getRes.body.user).toBeDefined();
    });

    it('returns 404 for non-existent request', async () => {
      const res = await request(app)
        .get('/api/requests/non-existent-id')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('status transitions', () => {
    it('full lifecycle: create → accept → on_the_way → complete', async () => {
      // Create
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'glass', quantityKg: 8 });

      const reqId = createRes.body.id;
      expect(createRes.body.status).toBe('pending');

      // Accept
      const acceptRes = await request(app)
        .put(`/api/requests/${reqId}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.status).toBe('accepted');

      // On the way
      const onWayRes = await request(app)
        .put(`/api/requests/${reqId}/on-the-way`)
        .set('Authorization', `Bearer ${companyToken}`);

      expect(onWayRes.status).toBe(200);
      expect(onWayRes.body.status).toBe('on_the_way');

      // Complete
      const completeRes = await request(app)
        .put(`/api/requests/${reqId}/complete`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ realWeight: 7.5 });

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.status).toBe('completed');
      expect(completeRes.body.realWeight).toBe(7.5);
    });

    it('rejects completing a pending request', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'paper', quantityKg: 3 });

      const res = await request(app)
        .put(`/api/requests/${createRes.body.id}/complete`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ realWeight: 2.8 });

      expect(res.status).toBe(400);
    });

    it('rejects accepting an already accepted request', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'metal', quantityKg: 5 });

      await request(app)
        .put(`/api/requests/${createRes.body.id}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);

      const res = await request(app)
        .put(`/api/requests/${createRes.body.id}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('cancel and reschedule', () => {
    it('resident can cancel their own pending request', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'plastic', quantityKg: 2 });

      const res = await request(app)
        .put(`/api/requests/${createRes.body.id}/cancel`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('cancelled');
    });

    it('resident can reschedule with new date and time', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          materialType: 'paper',
          quantityKg: 4,
          desiredDate: '2026-10-01',
          desiredTime: '09:00',
        });

      const res = await request(app)
        .put(`/api/requests/${createRes.body.id}/reschedule`)
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ desiredDate: '2026-10-15', desiredTime: '14:00' });

      expect(res.status).toBe(200);
      expect(res.body.desiredDate).toBe('2026-10-15');
      expect(res.body.desiredTime).toBe('14:00');
    });
  });

  describe('authorization', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/requests');
      expect(res.status).toBe(401);
    });

    it('returns 400 for invalid request data', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: '', quantityKg: -5 });

      expect(res.status).toBe(400);
    });

    it('lists only resident own requests', async () => {
      const res = await request(app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((r: any) => {
        expect(r.userId).toBe(residentId);
      });
    });

    it('lists only company assigned requests', async () => {
      const res = await request(app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
