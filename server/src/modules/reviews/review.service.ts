import { prisma } from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { CreateReviewInput } from './review.validation';

export async function createReview(userId: string, data: CreateReviewInput) {
  if (data.rating < 1 || data.rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  const existingReview = await prisma.review.findUnique({
    where: { requestId: data.requestId },
  });
  if (existingReview) {
    throw new AppError('A review already exists for this request', 409);
  }

  const review = await prisma.review.create({
    data: {
      userId,
      companyId: data.companyId,
      requestId: data.requestId,
      rating: data.rating,
      comment: data.comment,
    },
  });

  const avgResult = await prisma.review.aggregate({
    where: { companyId: data.companyId },
    _avg: { rating: true },
  });

  await prisma.company.update({
    where: { id: data.companyId },
    data: { rating: avgResult._avg.rating ?? 0 },
  });

  return review;
}

export async function listReviewsByCompany(companyId: string) {
  return prisma.review.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}
