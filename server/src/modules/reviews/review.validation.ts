import { z } from 'zod';

export const createReviewSchema = z.object({
  companyId: z.string().optional(),
  requestId: z.string().min(1, 'ID da solicitação é obrigatório'),
  rating: z
    .number()
    .int()
    .min(1, 'Avaliação deve ser no mínimo 1')
    .max(5, 'Avaliação deve ser no máximo 5'),
  comment: z.string().optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
