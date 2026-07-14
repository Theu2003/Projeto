import { prisma } from '@/config/database';
import { AppError } from '@/middleware/errorHandler';

/**
 * Lista notificações do usuário ou empresa logada
 */
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

/**
 * Marca uma notificação como lida
 */
export async function markAsRead(notificationId: string, actorId: string, role: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new AppError('Notificação não encontrada', 404);
  }

  // Verificar permissão
  if (role === 'company' && notification.companyId !== actorId) {
    throw new AppError('Não é sua notificação', 403);
  }
  if (role !== 'company' && notification.userId !== actorId) {
    throw new AppError('Não é sua notificação', 403);
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}
