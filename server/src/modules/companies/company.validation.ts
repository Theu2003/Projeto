import { z } from 'zod';

export const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  responsible: z.string().min(1).optional(),
  phone: z.string().min(10).optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  serviceAreaRadius: z.number().positive().optional(),
  materials: z.string().optional(),
});

export const nearbySearchSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().default(10),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
