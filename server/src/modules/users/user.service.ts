import { prisma } from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { UpdateUserInput } from './user.validation';

function excludePassword<T extends { passwordHash: string }>(obj: T): Omit<T, 'passwordHash'> {
  const { passwordHash, ...rest } = obj;
  return rest;
}

export async function getProfile(userId: string, role: string) {
  if (role === 'company') {
    const company = await prisma.company.findUnique({ where: { id: userId } });
    if (!company) throw new AppError('User not found', 404);
    return excludePassword(company);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);
  return excludePassword(user);
}

export async function updateProfile(userId: string, role: string, data: UpdateUserInput) {
  if (role === 'company') {
    const company = await prisma.company.findUnique({ where: { id: userId } });
    if (!company) throw new AppError('User not found', 404);
    const updated = await prisma.company.update({ where: { id: userId }, data });
    return excludePassword(updated);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);
  const updated = await prisma.user.update({ where: { id: userId }, data });
  return excludePassword(updated);
}

export async function getDashboard(userId: string) {
  const [totalRequests, completedRequests, pendingRequests, user, recentRequests] =
    await Promise.all([
      prisma.collectionRequest.count({ where: { userId } }),
      prisma.collectionRequest.count({ where: { userId, status: 'completed' } }),
      prisma.collectionRequest.count({ where: { userId, status: 'pending' } }),
      prisma.user.findUnique({ where: { id: userId }, select: { points: true } }),
      prisma.collectionRequest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

  return {
    totalRequests,
    completedRequests,
    pendingRequests,
    points: user?.points ?? 0,
    recentRequests,
  };
}

export async function getPoints(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { points: true } });
  if (!user) throw new AppError('User not found', 404);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyRequests = await prisma.collectionRequest.findMany({
    where: {
      userId,
      status: 'completed',
      completedAt: { gte: startOfMonth },
    },
  });
  const monthlyPoints = monthlyRequests.reduce((sum, r) => sum + (r.realWeight ?? 0) * 10, 0);

  const allUsers = await prisma.user.findMany({
    select: { points: true },
    orderBy: { points: 'desc' },
  });
  const ranking = allUsers.findIndex((u) => u.points < (user.points ?? 0)) + 1;

  return {
    totalPoints: user.points,
    monthlyPoints,
    ranking: ranking || allUsers.length,
  };
}
