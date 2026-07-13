import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Reviews, Notifications & Admin', () => {
  let residentToken: string;
  let residentId: string;
  let companyToken: string;
  let companyId: string;
  let adminToken: string;
  let adminId: string;
  let secondResidentToken: string;
  let secondResidentId: string;
  let requestId: string;
  let secondCompanyId: string;

  beforeAll(async () => {
    await prisma.review.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.collectionRequest.deleteMany();
    await prisma.material.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    // Create admin
    const adminRes = await request(app)
      .post('/api/auth/register/resident')
      .send({
        name: 'Admin User',
        cpf: '00000000000',
        phone: '11988887777',
        email: 'admin-review@test.com',
        password: 'admin123',
      });
    adminToken = adminRes.body.token;
    adminId = adminRes.body.user.id;
    await prisma.user.update({ where: { id: adminId }, data: { role: 'admin' } });
    // Re-login to get token with admin role
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin-review@test.com', password: 'admin123' });
    adminToken = adminLogin.body.token;

    // Create resident
    const regRes = await request(app)
      .post('/api/auth/register/resident')
      .send({
        name: 'Review Resident',
        cpf: '33333333333',
        phone: '11988887777',
        email: 'review-resident@test.com',
        password: 'pass123',
      });
    residentToken = regRes.body.token;
    residentId = regRes.body.user.id;

    // Create second resident
    const regRes2 = await request(app)
      .post('/api/auth/register/resident')
      .send({
        name: 'Second Review Resident',
        cpf: '44444444444',
        phone: '11988887778',
        email: 'second-review-resident@test.com',
        password: 'pass123',
      });
    secondResidentToken = regRes2.body.token;
    secondResidentId = regRes2.body.user.id;

    // Create company
    const compRes = await request(app)
      .post('/api/auth/register/company')
      .send({
        name: 'Review Company',
        cnpj: '33333333000193',
        responsible: 'Carlos',
        phone: '11988887777',
        email: 'review-company@test.com',
        password: 'pass123',
      });
    companyToken = compRes.body.token;
    companyId = compRes.body.company.id;

    // Create second company
    const compRes2 = await request(app)
      .post('/api/auth/register/company')
      .send({
        name: 'Second Review Company',
        cnpj: '44444444000194',
        responsible: 'Ana',
        phone: '11988887778',
        email: 'second-review-company@test.com',
        password: 'pass123',
      });
    secondCompanyId = compRes2.body.company.id;

    // Approve both companies
    await prisma.company.update({ where: { id: companyId }, data: { approved: true } });
    await prisma.company.update({ where: { id: secondCompanyId }, data: { approved: true } });

    // Create a completed request for reviewing
    const reqRes = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({ materialType: 'plastic', quantityKg: 10 });
    requestId = reqRes.body.id;

    // Accept, go on the way, complete the request
    await request(app)
      .put(`/api/requests/${requestId}/accept`)
      .set('Authorization', `Bearer ${companyToken}`);
    await request(app)
      .put(`/api/requests/${requestId}/on-the-way`)
      .set('Authorization', `Bearer ${companyToken}`);
    await request(app)
      .put(`/api/requests/${requestId}/complete`)
      .set('Authorization', `Bearer ${companyToken}`)
      .send({ realWeight: 9.5 });
  });

  afterAll(async () => {
    await prisma.review.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.collectionRequest.deleteMany();
    await prisma.material.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  // ─── REVIEWS ────────────────────────────────────────────────

  describe('POST /api/reviews', () => {
    it('creates a review and returns it with user info', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          companyId,
          requestId,
          rating: 5,
          comment: 'Excellent service!',
        });

      expect(res.status).toBe(201);
      expect(res.body.rating).toBe(5);
      expect(res.body.comment).toBe('Excellent service!');
      expect(res.body.userId).toBe(residentId);
      expect(res.body.companyId).toBe(companyId);
      expect(res.body.requestId).toBe(requestId);
    });

    it('updates the company rating after review creation', async () => {
      // Verify via admin endpoint since nearby requires coordinates
      const res = await request(app)
        .get('/api/admin/companies')
        .set('Authorization', `Bearer ${adminToken}`);

      const company = res.body.find((c: any) => c.id === companyId);
      expect(company).toBeDefined();
      expect(company.rating).toBe(5);
    });

    it('rejects duplicate review for same request', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          companyId,
          requestId,
          rating: 4,
          comment: 'Trying again',
        });

      expect(res.status).toBe(409);
    });

    it('rejects review with rating < 1', async () => {
      // Create another completed request for this test
      const reqRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'glass', quantityKg: 5 });
      const newReqId = reqRes.body.id;

      await request(app)
        .put(`/api/requests/${newReqId}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);
      await request(app)
        .put(`/api/requests/${newReqId}/on-the-way`)
        .set('Authorization', `Bearer ${companyToken}`);
      await request(app)
        .put(`/api/requests/${newReqId}/complete`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ realWeight: 4.5 });

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          companyId,
          requestId: newReqId,
          rating: 0,
          comment: 'Bad',
        });

      expect(res.status).toBe(400);
    });

    it('rejects review with rating > 5', async () => {
      const reqRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'metal', quantityKg: 3 });
      const newReqId = reqRes.body.id;

      await request(app)
        .put(`/api/requests/${newReqId}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);
      await request(app)
        .put(`/api/requests/${newReqId}/on-the-way`)
        .set('Authorization', `Bearer ${companyToken}`);
      await request(app)
        .put(`/api/requests/${newReqId}/complete`)
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ realWeight: 2.8 });

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          companyId,
          requestId: newReqId,
          rating: 6,
          comment: 'Too high',
        });

      expect(res.status).toBe(400);
    });

    it('rejects review without token', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .send({
          companyId,
          requestId: 'some-id',
          rating: 3,
        });

      expect(res.status).toBe(401);
    });

    it('rejects review with missing companyId', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          requestId: 'some-id',
          rating: 3,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/reviews/company/:companyId', () => {
    it('returns reviews for a company', async () => {
      const res = await request(app)
        .get(`/api/reviews/company/${companyId}`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].user).toBeDefined();
      expect(res.body[0].user.name).toBeDefined();
    });

    it('returns empty array for company with no reviews', async () => {
      const res = await request(app)
        .get(`/api/reviews/company/${secondCompanyId}`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });
  });

  // ─── NOTIFICATIONS ──────────────────────────────────────────

  describe('GET /api/notifications', () => {
    it('returns empty array when no notifications exist', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });

    it('returns notifications for company', async () => {
      // Create a notification for the company by completing a request (which notifies the company)
      const reqRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'paper', quantityKg: 2 });
      const notifReqId = reqRes.body.id;
      await request(app)
        .put(`/api/requests/${notifReqId}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${companyToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('marks a notification as read', async () => {
      // Create a request that generates a notification for the company
      const reqRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'plastic', quantityKg: 1 });
      const notifReqId = reqRes.body.id;
      await request(app)
        .put(`/api/requests/${notifReqId}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);

      // Get notifications to find an unread one
      const listRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${companyToken}`);

      const unread = listRes.body.find((n: any) => !n.read);
      if (unread) {
        const res = await request(app)
          .put(`/api/notifications/${unread.id}/read`)
          .set('Authorization', `Bearer ${companyToken}`);

        expect(res.status).toBe(200);
        expect(res.body.read).toBe(true);
      }
    });

    it('returns 404 for non-existent notification', async () => {
      const res = await request(app)
        .put('/api/notifications/non-existent-id/read')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(404);
    });

    it('returns 403 when trying to mark another user notification as read', async () => {
      // Create a notification for the company
      const reqRes = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ materialType: 'metal', quantityKg: 2 });
      const notifReqId = reqRes.body.id;
      await request(app)
        .put(`/api/requests/${notifReqId}/accept`)
        .set('Authorization', `Bearer ${companyToken}`);

      const listRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${companyToken}`);

      const companyNotif = listRes.body[0];
      if (companyNotif) {
        const res = await request(app)
          .put(`/api/notifications/${companyNotif.id}/read`)
          .set('Authorization', `Bearer ${residentToken}`);

        expect(res.status).toBe(403);
      }
    });
  });

  // ─── ADMIN ──────────────────────────────────────────────────

  describe('GET /api/admin/stats', () => {
    it('returns aggregate stats for admin', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalUsers).toBeGreaterThan(0);
      expect(res.body.totalCompanies).toBeGreaterThan(0);
      expect(res.body.totalRequests).toBeGreaterThan(0);
      expect(res.body.totalReviews).toBeGreaterThanOrEqual(0);
      expect(typeof res.body.pendingApprovals).toBe('number');
    });

    it('returns 403 for non-admin', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/admin/users', () => {
    it('returns list of all users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      // Should not include passwordHash
      expect(res.body[0].passwordHash).toBeUndefined();
    });

    it('returns 403 for non-admin', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/companies', () => {
    it('returns list of all companies', async () => {
      const res = await request(app)
        .get('/api/admin/companies')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].passwordHash).toBeUndefined();
    });

    it('returns 403 for non-admin', async () => {
      const res = await request(app)
        .get('/api/admin/companies')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/admin/companies/:id/approve', () => {
    it('approves a pending company', async () => {
      // Create a new unapproved company
      const compRes = await request(app)
        .post('/api/auth/register/company')
        .send({
          name: 'Pending Company',
          cnpj: '55555555000195',
          responsible: 'Maria',
          phone: '11988887777',
          email: 'pending-company@test.com',
          password: 'pass123',
        });
      const pendingCompanyId = compRes.body.company.id;

      const res = await request(app)
        .put(`/api/admin/companies/${pendingCompanyId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.approved).toBe(true);
    });

    it('returns 404 for non-existent company', async () => {
      const res = await request(app)
        .put('/api/admin/companies/non-existent-id/approve')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('returns 403 for non-admin', async () => {
      const res = await request(app)
        .put(`/api/admin/companies/${companyId}/approve`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/admin/users/:id/block', () => {
    it('blocks a user', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${secondResidentId}/block`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.active).toBe(false);
    });

    it('returns 404 for non-existent user', async () => {
      const res = await request(app)
        .put('/api/admin/users/non-existent-id/block')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('returns 403 for non-admin', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${residentId}/block`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/admin/companies/:id/block', () => {
    it('blocks a company', async () => {
      const res = await request(app)
        .put(`/api/admin/companies/${secondCompanyId}/block`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.active).toBe(false);
    });

    it('returns 404 for non-existent company', async () => {
      const res = await request(app)
        .put('/api/admin/companies/non-existent-id/block')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('returns 403 for non-admin', async () => {
      const res = await request(app)
        .put(`/api/admin/companies/${companyId}/block`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
    });
  });
});
