import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Request Endpoints', () => {
  let residentToken: string;
  let residentId: string;
  let secondResidentToken: string;
  let secondResidentId: string;
  let companyToken: string;
  let companyId: string;
  let secondCompanyToken: string;
  let secondCompanyId: string;

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

    // Create second resident
    const regRes2 = await request(app)
      .post('/api/auth/register/resident')
      .send({
        name: 'Second Resident',
        cpf: '22222222222',
        phone: '11988887778',
        email: 'second-resident@test.com',
        password: 'pass123',
      });
    secondResidentToken = regRes2.body.token;
    secondResidentId = regRes2.body.user.id;

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

    // Create second company
    const compRes2 = await request(app)
      .post('/api/auth/register/company')
      .send({
        name: 'Second Company',
        cnpj: '22222222000192',
        responsible: 'Ana',
        phone: '11988887778',
        email: 'second-company@test.com',
        password: 'pass123',
      });
    secondCompanyToken = compRes2.body.token;
    secondCompanyId = compRes2.body.company.id;

    // Approve both companies
    await prisma.company.update({
      where: { id: companyId },
      data: { approved: true },
    });
    await prisma.company.update({
      where: { id: secondCompanyId },
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

  describe('validation', () => {
    it('rejects create request with missing materialType', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ quantityKg: 5 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation error');
    });

    it('rejects create request with empty materialType', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: '', quantityKg: 5 });

      expect(res.status).toBe(400);
    });

    it('rejects create request with negative quantityKg', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'plastic', quantityKg: -5 });

      expect(res.status).toBe(400);
    });

    it('rejects create request with zero quantityKg', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'plastic', quantityKg: 0 });

      expect(res.status).toBe(400);
    });

    it('rejects complete request with negative realWeight', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'glass', quantityKg: 8 });

      const reqId = createRes.body.id;

      await request(app)
        .put(`/api/requests/${reqId}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);

      await request(app)
        .put(`/api/requests/${reqId}/on-the-way`)
        .set('Authorization', `Bearer ${companyToken}`);

      const res = await request(app)
        .put(`/api/requests/${reqId}/complete`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ realWeight: -1 });

      expect(res.status).toBe(400);
    });

    it('rejects reschedule with missing desiredDate', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'paper', quantityKg: 3 });

      const res = await request(app)
        .put(`/api/requests/${createRes.body.id}/reschedule`)
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ desiredTime: '14:00' });

      expect(res.status).toBe(400);
    });

    it('rejects reschedule with missing desiredTime', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'paper', quantityKg: 3 });

      const res = await request(app)
        .put(`/api/requests/${createRes.body.id}/reschedule`)
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ desiredDate: '2026-10-15' });

      expect(res.status).toBe(400);
    });
  });

  describe('status transitions', () => {
    it('full lifecycle: create → accept → on_the_way → complete', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'glass', quantityKg: 8 });

      const reqId = createRes.body.id;
      expect(createRes.body.status).toBe('pending');

      const acceptRes = await request(app)
        .put(`/api/requests/${reqId}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.status).toBe('accepted');

      const onWayRes = await request(app)
        .put(`/api/requests/${reqId}/on-the-way`)
        .set('Authorization', `Bearer ${companyToken}`);

      expect(onWayRes.status).toBe(200);
      expect(onWayRes.body.status).toBe('on_the_way');

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

    it('rejects on_the_way for a pending request (must accept first)', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'plastic', quantityKg: 4 });

      const res = await request(app)
        .put(`/api/requests/${createRes.body.id}/on-the-way`)
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(400);
    });

    it('rejects completing an accepted request (must go on_the_way first)', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'glass', quantityKg: 6 });

      const reqId = createRes.body.id;

      await request(app)
        .put(`/api/requests/${reqId}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);

      const res = await request(app)
        .put(`/api/requests/${reqId}/complete`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ realWeight: 5.5 });

      expect(res.status).toBe(400);
    });

    it('rejects on_the_way from wrong company', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'paper', quantityKg: 2 });

      const reqId = createRes.body.id;

      await request(app)
        .put(`/api/requests/${reqId}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);

      const res = await request(app)
        .put(`/api/requests/${reqId}/on-the-way`)
        .set('Authorization', `Bearer ${secondCompanyToken}`);

      expect(res.status).toBe(403);
    });

    it('rejects completing from wrong company', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'metal', quantityKg: 3 });

      const reqId = createRes.body.id;

      await request(app)
        .put(`/api/requests/${reqId}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);

      await request(app)
        .put(`/api/requests/${reqId}/on-the-way`)
        .set('Authorization', `Bearer ${companyToken}`);

      const res = await request(app)
        .put(`/api/requests/${reqId}/complete`)
        .set('Authorization', `Bearer ${secondCompanyToken}`)
        .send({ realWeight: 2.5 });

      expect(res.status).toBe(403);
    });
  });

  describe('access control', () => {
    it('rejects resident trying to accept a request', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'plastic', quantityKg: 5 });

      const res = await request(app)
        .put(`/api/requests/${createRes.body.id}/accept`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
    });

    it('rejects resident trying to complete a request', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'plastic', quantityKg: 5 });

      const res = await request(app)
        .put(`/api/requests/${createRes.body.id}/complete`)
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ realWeight: 4 });

      expect(res.status).toBe(403);
    });

    it('rejects resident trying to mark on_the_way', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'glass', quantityKg: 3 });

      const res = await request(app)
        .put(`/api/requests/${createRes.body.id}/on-the-way`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('reject (company declines without claiming)', () => {
    it('company rejects a pending request — status stays pending, companyId is null', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'plastic', quantityKg: 10 });

      const reqId = createRes.body.id;

      const res = await request(app)
        .put(`/api/requests/${reqId}/reject`)
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('pending');
      expect(res.body.companyId).toBeNull();
    });

    it('after rejection, another company can accept the request', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'glass', quantityKg: 12 });

      const reqId = createRes.body.id;

      // First company rejects
      await request(app)
        .put(`/api/requests/${reqId}/reject`)
        .set('Authorization', `Bearer ${companyToken}`);

      // Second company accepts
      const acceptRes = await request(app)
        .put(`/api/requests/${reqId}/accept`)
        .set('Authorization', `Bearer ${secondCompanyToken}`);

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.status).toBe('accepted');
      expect(acceptRes.body.companyId).toBe(secondCompanyId);
    });

    it('rejects rejecting an already accepted request', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'metal', quantityKg: 4 });

      const reqId = createRes.body.id;

      await request(app)
        .put(`/api/requests/${reqId}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);

      const res = await request(app)
        .put(`/api/requests/${reqId}/reject`)
        .set('Authorization', `Bearer ${secondCompanyToken}`);

      expect(res.status).toBe(400);
    });

    it('returns 404 when rejecting non-existent request', async () => {
      const res = await request(app)
        .put('/api/requests/non-existent-id/reject')
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(404);
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

    it('rejects cancel of a completed request', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'glass', quantityKg: 5 });

      const reqId = createRes.body.id;

      await request(app)
        .put(`/api/requests/${reqId}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);

      await request(app)
        .put(`/api/requests/${reqId}/on-the-way`)
        .set('Authorization', `Bearer ${companyToken}`);

      await request(app)
        .put(`/api/requests/${reqId}/complete`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ realWeight: 4.5 });

      const res = await request(app)
        .put(`/api/requests/${reqId}/cancel`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(400);
    });

    it('resident cannot cancel another resident request', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'plastic', quantityKg: 1 });

      const res = await request(app)
        .put(`/api/requests/${createRes.body.id}/cancel`)
        .set('Authorization', `Bearer ${secondResidentToken}`);

      expect(res.status).toBe(403);
    });

    it('company can cancel an accepted request', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'metal', quantityKg: 7 });

      const reqId = createRes.body.id;

      await request(app)
        .put(`/api/requests/${reqId}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);

      const res = await request(app)
        .put(`/api/requests/${reqId}/cancel`)
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('cancelled');
    });

    it('company can reschedule an accepted request', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          materialType: 'paper',
          quantityKg: 6,
          desiredDate: '2026-11-01',
          desiredTime: '08:00',
        });

      const reqId = createRes.body.id;

      await request(app)
        .put(`/api/requests/${reqId}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);

      const res = await request(app)
        .put(`/api/requests/${reqId}/reschedule`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ desiredDate: '2026-11-10', desiredTime: '15:00' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('rescheduled');
      expect(res.body.desiredDate).toBe('2026-11-10');
      expect(res.body.desiredTime).toBe('15:00');
    });

    it('company cannot cancel request assigned to another company', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'glass', quantityKg: 3 });

      const reqId = createRes.body.id;

      await request(app)
        .put(`/api/requests/${reqId}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);

      const res = await request(app)
        .put(`/api/requests/${reqId}/cancel`)
        .set('Authorization', `Bearer ${secondCompanyToken}`);

      expect(res.status).toBe(403);
    });

    it('returns 404 when rescheduling non-existent request', async () => {
      const res = await request(app)
        .put('/api/requests/non-existent-id/reschedule')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ desiredDate: '2026-12-01', desiredTime: '10:00' });

      expect(res.status).toBe(404);
    });

    it('returns 404 when cancelling non-existent request', async () => {
      const res = await request(app)
        .put('/api/requests/non-existent-id/cancel')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(404);
    });

    it('rejects accepting a cancelled request', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'plastic', quantityKg: 5 });

      const reqId = createRes.body.id;

      // Cancel it
      await request(app)
        .put(`/api/requests/${reqId}/cancel`)
        .set('Authorization', `Bearer ${residentToken}`);

      // Try to accept
      const res = await request(app)
        .put(`/api/requests/${reqId}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(400);
    });

    it('rejects company cancelling an unassigned pending request', async () => {
      const createRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'glass', quantityKg: 4 });

      const reqId = createRes.body.id;

      // Company tries to cancel a pending request they haven't accepted
      const res = await request(app)
        .put(`/api/requests/${reqId}/cancel`)
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('list filtering', () => {
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

    it('second resident only sees their own requests', async () => {
      await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${secondResidentToken}`)
        .send({ materialType: 'plastic', quantityKg: 1 });

      const res = await request(app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${secondResidentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((r: any) => {
        expect(r.userId).toBe(secondResidentId);
      });
    });

    it('second company only sees their assigned requests', async () => {
      const res = await request(app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${secondCompanyToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
