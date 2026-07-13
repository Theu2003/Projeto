import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/config/database';

describe('NotificationService', () => {
  let userId: string;
  let companyId: string;
  let userNotificationId: string;
  let companyNotificationId: string;

  beforeAll(async () => {
    await prisma.review.deleteMany();
    await prisma.collectionRequest.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.material.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    const user = await prisma.user.create({
      data: {
        name: 'Notification Test Resident',
        cpf: '99999999981',
        phone: '11999999999',
        email: 'notification-svc-test@email.com',
        passwordHash: 'hashedpassword',
        role: 'resident',
      },
    });
    userId = user.id;

    const company = await prisma.company.create({
      data: {
        name: 'Notification Test Company',
        cnpj: '99999999000195',
        responsible: 'Pedro Santos',
        phone: '11999999999',
        email: 'notification-company-svc-test@email.com',
        passwordHash: 'hashedpassword',
        approved: true,
      },
    });
    companyId = company.id;

    const userNotif = await prisma.notification.create({
      data: {
        userId,
        type: 'request_update',
        message: 'Your request has been accepted',
        read: false,
      },
    });
    userNotificationId = userNotif.id;

    const companyNotif = await prisma.notification.create({
      data: {
        companyId,
        type: 'new_request',
        message: 'You have a new collection request',
        read: false,
      },
    });
    companyNotificationId = companyNotif.id;
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

  describe('listNotifications', () => {
    it('should list notifications for a user', async () => {
      const { listNotifications } = await import('@/modules/notifications/notification.service');

      const result = await listNotifications(userId, 'resident');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0]).toHaveProperty('userId', userId);
      expect(result[0]).toHaveProperty('message');
    });

    it('should list notifications for a company', async () => {
      const { listNotifications } = await import('@/modules/notifications/notification.service');

      const result = await listNotifications(companyId, 'company');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0]).toHaveProperty('companyId', companyId);
    });

    it('should return empty array for user with no notifications', async () => {
      const { listNotifications } = await import('@/modules/notifications/notification.service');

      const result = await listNotifications('non-existent-user', 'resident');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const { markAsRead } = await import('@/modules/notifications/notification.service');

      const result = await markAsRead(userNotificationId, userId, 'resident');

      expect(result).toHaveProperty('read', true);
    });

    it('should throw when marking non-existent notification', async () => {
      const { markAsRead } = await import('@/modules/notifications/notification.service');

      await expect(markAsRead('non-existent-id', userId, 'resident')).rejects.toThrow();
    });

    it('should throw when marking another user notification', async () => {
      const { markAsRead } = await import('@/modules/notifications/notification.service');

      await expect(markAsRead(companyNotificationId, userId, 'resident')).rejects.toThrow();
    });
  });
});
