import { prisma } from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { CreateReviewInput } from './review.validation';

/**
 * Cria uma avaliação para uma empresa após coleta concluída
 * Atualiza a média de avaliação da empresa automaticamente
 *
 * Se companyId não for informado (frontend nem sempre envia),
 * busca automaticamente a empresa responsável pela coleta
 */
export async function createReview(userId: string, data: CreateReviewInput) {
  if (data.rating < 1 || data.rating > 5) {
    throw new AppError('Avaliação deve ser entre 1 e 5', 400);
  }

  // Verificar se já existe avaliação para esta solicitação
  const existingReview = await prisma.review.findUnique({
    where: { requestId: data.requestId },
  });
  if (existingReview) {
    throw new AppError('Já existe uma avaliação para esta solicitação', 409);
  }

  // Verificar se a solicitação foi concluída
  const request = await prisma.collectionRequest.findUnique({
    where: { id: data.requestId },
  });
  if (!request || request.status !== 'completed') {
    throw new AppError('Solicitação precisa estar concluída para ser avaliada', 400);
  }
  if (request.userId !== userId) {
    throw new AppError('Você só pode avaliar suas próprias solicitações', 403);
  }

  // Buscar companyId da solicitação se não foi informado
  const companyId = data.companyId || request.companyId;
  if (!companyId) {
    throw new AppError('Nenhuma empresa associada a esta solicitação', 400);
  }

  const review = await prisma.review.create({
    data: {
      userId,
      companyId,
      requestId: data.requestId,
      rating: data.rating,
      comment: data.comment,
    },
  });

  // Recalcular média de avaliação da empresa
  const avgResult = await prisma.review.aggregate({
    where: { companyId },
    _avg: { rating: true },
  });

  await prisma.company.update({
    where: { id: companyId },
    data: { rating: avgResult._avg.rating ?? 0 },
  });

  return review;
}

/**
 * Lista avaliações de uma empresa
 */
export async function listReviewsByCompany(companyId: string) {
  return prisma.review.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true } } },
  });
}
