import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { prisma } from '@/config/database';

describe('Review Controller', () => {
  let residentToken: string;
  let companyId: string;
  let completedRequestId: string;

  beforeAll(async () => {
    await prisma.review.deleteMany();
    await prisma.collectionRequest.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.material.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    const resResident = await request(app)
      .post('/api/auth/register/resident')
      .send({
        name: 'Review Controller Resident',
        cpf: '33333333371',
        phone: '11999999999',
        email: 'review-ctrl-resident@email.com',
        password: '123456',
      });
    residentToken = resResident.body.token;

    const resCompany = await request(app)
      .post('/api/auth/register/company')
      .send({
        name: 'Review Controller Company',
        cnpj: '33333333000195',
        responsible: 'Ana Costa',
        phone: '11999999999',
        email: 'review-ctrl-company@email.com',
        password: '123456',
      });
    companyId = resCompany.body.company.id;

    await prisma.company.update({
      where: { id: companyId },
      data: { approved: true },
    });

    const requestRes = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({
        materialType: 'plastic',
        quantityKg: 5,
      });

    const reqId = requestRes.body.id;

    await request(app)
      .put(`/api/requests/${reqId}/accept`)
      .set('Authorization', `Bearer ${resCompany.body.token}`);

    await request(app)
      .put(`/api/requests/${reqId}/on-the-way`)
      .set('Authorization', `Bearer ${resCompany.body.token}`);

    await request(app)
      .put(`/api/requests/${reqId}/complete`)
      .set('Authorization', `Bearer ${resCompany.body.token}`)
      .send({ realWeight: 4.5 });

    completedRequestId = reqId;
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

  describe('POST /api/reviews', () => {
    it('should create a review when authenticated', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          companyId,
          requestId: completedRequestId,
          rating: 5,
          comment: 'Excellent service!',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('rating', 5);
      expect(res.body).toHaveProperty('comment', 'Excellent service!');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .send({
          companyId,
          requestId: 'some-id',
          rating: 5,
        });

      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid rating', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          companyId,
          requestId: 'some-id',
          rating: 6,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/reviews/company/:companyId', () => {
    it('should list reviews for a company', async () => {
      const res = await request(app)
        .get(`/api/reviews/company/${companyId}`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get(`/api/reviews/company/${companyId}`);

      expect(res.status).toBe(401);
    });
  });
});
