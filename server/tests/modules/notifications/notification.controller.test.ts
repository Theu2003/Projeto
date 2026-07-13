import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { prisma } from '@/config/database';

describe('Notification Controller', () => {
  let residentToken: string;
  let userId: string;
  let notificationId: string;

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
        name: 'Notification Controller Resident',
        cpf: '44444444461',
        phone: '11999999999',
        email: 'notification-ctrl-resident@email.com',
        password: '123456',
      });
    residentToken = resResident.body.token;
    userId = resResident.body.user.id;

    const notif = await prisma.notification.create({
      data: {
        userId,
        type: 'request_update',
        message: 'Your request status changed',
        read: false,
      },
    });
    notificationId = notif.id;
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

  describe('GET /api/notifications', () => {
    it('should list notifications when authenticated', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/notifications');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const res = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('read', true);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .put(`/api/notifications/${notificationId}/read`);

      expect(res.status).toBe(401);
    });
  });
});
