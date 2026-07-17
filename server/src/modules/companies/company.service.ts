import { prisma } from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { UpdateCompanyInput } from './company.validation';
import { haversineDistance } from '@/utils/distance';
import { excludePassword } from '@/utils/password';

/**
 * Retorna perfil da empresa logada
 */
export async function getProfile(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new AppError('Empresa não encontrada', 404);
  return excludePassword(company);
}

/**
 * Atualiza perfil da empresa
 */
export async function updateProfile(companyId: string, data: UpdateCompanyInput) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new AppError('Empresa não encontrada', 404);
  const updated = await prisma.company.update({ where: { id: companyId }, data });
  return excludePassword(updated);
}

/**
 * Dashboard da empresa: estatísticas e avaliações recentes
 */
export async function getDashboard(companyId: string) {
  const [totalRequests, pendingRequests, completedToday, totalCollected, company, recentReviews] =
    await Promise.all([
      prisma.collectionRequest.count({ where: { companyId } }),
      prisma.collectionRequest.count({ where: { companyId, status: 'pending' } }),
      prisma.collectionRequest.count({
        where: {
          companyId,
          status: 'completed',
          completedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.collectionRequest.aggregate({
        where: { companyId, status: 'completed' },
        _sum: { realWeight: true },
      }),
      prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, name: true, rating: true },
      }),
      prisma.review.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { id: true, name: true } } },
      }),
    ]);

  return {
    company,
    stats: {
      totalRequests,
      pendingRequests,
      completedToday,
      totalCollected: totalCollected._sum.realWeight ?? 0,
    },
    recentReviews,
  };
}

/**
 * Busca empresas próximas a uma localização
 */
export async function findNearby(lat: number, lng: number, radius: number) {
  const companies = await prisma.company.findMany({
    where: {
      approved: true,
      active: true,
      latitude: { not: null },
      longitude: { not: null },
    },
  });

  return companies
    .map((c) => ({
      ...excludePassword(c),
      distance: haversineDistance(lat, lng, c.latitude!, c.longitude!),
    }))
    .filter((c) => c.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
}
