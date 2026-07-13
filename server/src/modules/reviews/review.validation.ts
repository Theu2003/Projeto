import { z } from 'zod';

export const createReviewSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  requestId: z.string().min(1, 'Request ID is required'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
