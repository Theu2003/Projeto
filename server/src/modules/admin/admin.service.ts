import { prisma } from '@/config/database';
import { AppError } from '@/middleware/errorHandler';

export async function listUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      cpf: true,
      phone: true,
      email: true,
      role: true,
      active: true,
      points: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listCompanies() {
  return prisma.company.findMany({
    select: {
      id: true,
      name: true,
      cnpj: true,
      responsible: true,
      phone: true,
      email: true,
      approved: true,
      active: true,
      rating: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function approveCompany(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new AppError('Company not found', 404);
  }

  return prisma.company.update({
    where: { id: companyId },
    data: { approved: true },
  });
}

export async function blockUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return prisma.user.update({
    where: { id: userId },
    data: { active: false },
  });
}

export async function blockCompany(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new AppError('Company not found', 404);
  }

  return prisma.company.update({
    where: { id: companyId },
    data: { active: false },
  });
}

export async function getStats() {
  const [totalUsers, totalCompanies, totalRequests, totalReviews, pendingApprovals] =
    await Promise.all([
      prisma.user.count(),
      prisma.company.count(),
      prisma.collectionRequest.count(),
      prisma.review.count(),
      prisma.company.count({ where: { approved: false } }),
    ]);

  return {
    totalUsers,
    totalCompanies,
    totalRequests,
    totalReviews,
    pendingApprovals,
  };
}
