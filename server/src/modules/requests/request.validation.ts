import { z } from 'zod';

export const REQUEST_STATUSES = [
  'pending',
  'accepted',
  'on_the_way',
  'completed',
  'cancelled',
  'rescheduled',
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const createRequestSchema = z.object({
  materialType: z.string().min(1, 'Tipo de material é obrigatório'),
  quantityKg: z.number().positive('Quantidade deve ser positiva'),
  observations: z.string().optional(),
  photos: z.array(z.string()).optional(),
  desiredDate: z.string().optional(),
  desiredTime: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().optional(),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;

export const rescheduleRequestSchema = z.object({
  desiredDate: z.string().min(1, 'Data é obrigatória'),
  desiredTime: z.string().min(1, 'Horário é obrigatório'),
});

export type RescheduleRequestInput = z.infer<typeof rescheduleRequestSchema>;

export const updateRequestSchema = z.object({
  materialType: z.string().min(1, 'Tipo de material é obrigatório').optional(),
  quantityKg: z.number().positive('Quantidade deve ser positiva').optional(),
  observations: z.string().optional(),
  desiredDate: z.string().optional(),
});

export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;

export const completeRequestSchema = z.object({
  realWeight: z.number().positive('Peso deve ser positivo'),
});

export type CompleteRequestInput = z.infer<typeof completeRequestSchema>;
