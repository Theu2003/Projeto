import { prisma } from '@/config/database';
import { AppError } from '@/middleware/errorHandler';

/**
 * Lista todos os usuários do sistema
 */
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

/**
 * Lista todas as empresas cadastradas
 */
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

/**
 * Aprova uma empresa para atuar na plataforma
 */
export async function approveCompany(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new AppError('Empresa não encontrada', 404);

  return prisma.company.update({
    where: { id: companyId },
    data: { approved: true },
  });
}

/**
 * Alterna status ativo/inativo de um usuário
 */
export async function toggleUserActive(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('Usuário não encontrado', 404);

  return prisma.user.update({
    where: { id: userId },
    data: { active: !user.active },
  });
}

/**
 * Alterna status ativo/inativo de uma empresa
 */
export async function toggleCompanyActive(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new AppError('Empresa não encontrada', 404);

  return prisma.company.update({
    where: { id: companyId },
    data: { active: !company.active },
  });
}

/**
 * Bloqueia um usuário (desativa)
 */
export async function blockUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('Usuário não encontrado', 404);

  return prisma.user.update({
    where: { id: userId },
    data: { active: false },
  });
}

/**
 * Bloqueia uma empresa (desativa)
 */
export async function blockCompany(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new AppError('Empresa não encontrada', 404);

  return prisma.company.update({
    where: { id: companyId },
    data: { active: false },
  });
}

/**
 * Estatísticas gerais da plataforma
 */
export async function getStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    activeUsers,
    totalCompanies,
    approvedCompanies,
    totalRequests,
    completedRequests,
    pendingRequests,
    totalPoints,
    totalReviews,
    pendingApprovals,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { active: true } }),
    prisma.company.count(),
    prisma.company.count({ where: { approved: true } }),
    prisma.collectionRequest.count(),
    prisma.collectionRequest.count({ where: { status: 'completed' } }),
    prisma.collectionRequest.count({ where: { status: 'pending' } }),
    prisma.user.aggregate({ _sum: { points: true } }),
    prisma.review.count(),
    prisma.company.count({ where: { approved: false } }),
  ]);

  return {
    totalUsers,
    activeUsers,
    totalCompanies,
    approvedCompanies,
    totalRequests,
    completedRequests,
    pendingRequests,
    totalPoints: totalPoints._sum.points ?? 0,
    totalReviews,
    pendingApprovals,
  };
}

/**
 * Relatórios mensais para o dashboard administrativo
 */
export async function getMonthlyReports() {
  // Agrupar solicitações por mês
  const requests = await prisma.collectionRequest.findMany({
    select: { createdAt: true, status: true, realWeight: true },
  });

  // Agrupar usuários por mês
  const users = await prisma.user.findMany({
    select: { createdAt: true },
  });

  // Agrupar empresas por mês
  const companies = await prisma.company.findMany({
    select: { createdAt: true },
  });

  // Criar mapa de meses
  const monthMap = new Map<
    string,
    { newUsers: number; newCompanies: number; completedRequests: number; totalWeight: number }
  >();

  for (const user of users) {
    const key = `${user.createdAt.getFullYear()}-${String(user.createdAt.getMonth() + 1).padStart(2, '0')}`;
    const entry = monthMap.get(key) || {
      newUsers: 0,
      newCompanies: 0,
      completedRequests: 0,
      totalWeight: 0,
    };
    entry.newUsers++;
    monthMap.set(key, entry);
  }

  for (const company of companies) {
    const key = `${company.createdAt.getFullYear()}-${String(company.createdAt.getMonth() + 1).padStart(2, '0')}`;
    const entry = monthMap.get(key) || {
      newUsers: 0,
      newCompanies: 0,
      completedRequests: 0,
      totalWeight: 0,
    };
    entry.newCompanies++;
    monthMap.set(key, entry);
  }

  for (const request of requests) {
    if (request.status === 'completed') {
      const key = `${request.createdAt.getFullYear()}-${String(request.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthMap.get(key) || {
        newUsers: 0,
        newCompanies: 0,
        completedRequests: 0,
        totalWeight: 0,
      };
      entry.completedRequests++;
      entry.totalWeight += request.realWeight ?? 0;
      monthMap.set(key, entry);
    }
  }

  return Array.from(monthMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => b.month.localeCompare(a.month));
}
