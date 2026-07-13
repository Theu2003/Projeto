import { prisma } from '@/config/database';
import { AppError } from '@/middleware/errorHandler';

export async function listNotifications(actorId: string, role: string) {
  if (role === 'company') {
    return prisma.notification.findMany({
      where: { companyId: actorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  return prisma.notification.findMany({
    where: { userId: actorId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function markAsRead(notificationId: string, actorId: string, role: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  if (role === 'resident' && notification.userId !== actorId) {
    throw new AppError('Not your notification', 403);
  }
  if (role === 'company' && notification.companyId !== actorId) {
    throw new AppError('Not your notification', 403);
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}
