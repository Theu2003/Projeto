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
  materialType: z.string().min(1, 'Material type is required'),
  quantityKg: z.number().positive('Quantity must be positive'),
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
  desiredDate: z.string().min(1, 'Date is required'),
  desiredTime: z.string().min(1, 'Time is required'),
});

export type RescheduleRequestInput = z.infer<typeof rescheduleRequestSchema>;

export const completeRequestSchema = z.object({
  realWeight: z.number().positive('Weight must be positive'),
});

export type CompleteRequestInput = z.infer<typeof completeRequestSchema>;
