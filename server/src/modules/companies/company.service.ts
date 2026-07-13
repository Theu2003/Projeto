import { prisma } from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { UpdateCompanyInput } from './company.validation';

function excludePassword<T extends { passwordHash: string }>(obj: T): Omit<T, 'passwordHash'> {
  const { passwordHash, ...rest } = obj;
  return rest;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getProfile(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new AppError('Company not found', 404);
  return excludePassword(company);
}

export async function updateProfile(companyId: string, data: UpdateCompanyInput) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new AppError('Company not found', 404);
  const updated = await prisma.company.update({ where: { id: companyId }, data });
  return excludePassword(updated);
}

export async function getDashboard(companyId: string) {
  const [totalRequests, pendingRequests, completedRequests, company, recentRequests] =
    await Promise.all([
      prisma.collectionRequest.count({ where: { companyId } }),
      prisma.collectionRequest.count({ where: { companyId, status: 'pending' } }),
      prisma.collectionRequest.count({ where: { companyId, status: 'completed' } }),
      prisma.company.findUnique({ where: { id: companyId }, select: { rating: true } }),
      prisma.collectionRequest.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

  return {
    totalRequests,
    pendingRequests,
    completedRequests,
    rating: company?.rating ?? 0,
    recentRequests,
  };
}

export async function findNearby(lat: number, lng: number, radius: number) {
  const companies = await prisma.company.findMany({
    where: { approved: true, active: true, latitude: { not: null }, longitude: { not: null } },
  });

  return companies
    .map((c) => ({
      ...excludePassword(c),
      distance: haversineDistance(lat, lng, c.latitude!, c.longitude!),
    }))
    .filter((c) => c.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
}
