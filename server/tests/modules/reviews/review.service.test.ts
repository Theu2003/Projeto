import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/config/database';

describe('ReviewService', () => {
  let residentId: string;
  let companyId: string;
  let completedRequestId: string;

  beforeAll(async () => {
    await prisma.review.deleteMany();
    await prisma.collectionRequest.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.material.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    const user = await prisma.user.create({
      data: {
        name: 'Review Test Resident',
        cpf: '88888888881',
        phone: '11999999999',
        email: 'review-svc-test@email.com',
        passwordHash: 'hashedpassword',
        role: 'resident',
      },
    });
    residentId = user.id;

    const company = await prisma.company.create({
      data: {
        name: 'Review Test Company',
        cnpj: '88888888000195',
        responsible: 'Carlos Lima',
        phone: '11999999999',
        email: 'review-company-svc-test@email.com',
        passwordHash: 'hashedpassword',
        approved: true,
        rating: 0,
      },
    });
    companyId = company.id;

    const request = await prisma.collectionRequest.create({
      data: {
        userId: residentId,
        companyId,
        status: 'completed',
        materialType: 'plastic',
        quantityKg: 5,
      },
    });
    completedRequestId = request.id;
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

  describe('createReview', () => {
    it('should create a review with valid data', async () => {
      const { createReview } = await import('@/modules/reviews/review.service');

      const result = await createReview(residentId, {
        companyId,
        requestId: completedRequestId,
        rating: 5,
        comment: 'Great service!',
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('rating', 5);
      expect(result).toHaveProperty('comment', 'Great service!');
      expect(result).toHaveProperty('userId', residentId);
      expect(result).toHaveProperty('companyId', companyId);
      expect(result).toHaveProperty('requestId', completedRequestId);
    });

    it('should update company average rating after review', async () => {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      expect(company!.rating).toBe(5);
    });

    it('should throw for duplicate review on same request', async () => {
      const { createReview } = await import('@/modules/reviews/review.service');

      await expect(
        createReview(residentId, {
          companyId,
          requestId: completedRequestId,
          rating: 4,
        })
      ).rejects.toThrow();
    });

    it('should throw for rating outside 1-5 range', async () => {
      const { createReview } = await import('@/modules/reviews/review.service');

      const extraRequest = await prisma.collectionRequest.create({
        data: {
          userId: residentId,
          companyId,
          status: 'completed',
          materialType: 'paper',
          quantityKg: 3,
        },
      });

      await expect(
        createReview(residentId, {
          companyId,
          requestId: extraRequest.id,
          rating: 6,
        })
      ).rejects.toThrow();
    });
  });

  describe('listReviewsByCompany', () => {
    it('should list reviews for a company', async () => {
      const { listReviewsByCompany } = await import('@/modules/reviews/review.service');

      const result = await listReviewsByCompany(companyId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0]).toHaveProperty('companyId', companyId);
      expect(result[0]).toHaveProperty('user');
    });

    it('should return empty array for company with no reviews', async () => {
      const { listReviewsByCompany } = await import('@/modules/reviews/review.service');

      const result = await listReviewsByCompany('non-existent-company');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
});
