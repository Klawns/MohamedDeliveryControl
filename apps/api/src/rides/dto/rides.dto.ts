import { z } from 'zod';
import { controlledRidePhotoReferenceSchema } from './ride-photo-reference.schema';

export const createRideSchema = z.object({
  clientId: z.string().min(1, { message: 'ID do cliente é obrigatório' }),
  value: z.coerce.number().min(0, { message: 'O valor deve ser positivo' }),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  photo: controlledRidePhotoReferenceSchema.optional(),
  status: z
    .enum(['PENDING', 'COMPLETED', 'CANCELLED'])
    .optional()
    .default('COMPLETED'),
  paymentStatus: z.enum(['PENDING', 'PAID']).optional().default('PAID'),
  rideDate: z.string().optional().nullable(),
  useBalance: z.boolean().optional().default(false),
});

export type CreateRideDto = z.infer<typeof createRideSchema>;

export const updateRideSchema = z.object({
  clientId: z.string().min(1).optional(),
  value: z.coerce.number().min(0).optional(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  photo: controlledRidePhotoReferenceSchema.optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID']).optional(),
  rideDate: z.string().optional().nullable(),
});

export type UpdateRideDto = z.infer<typeof updateRideSchema>;

export const updateRideStatusSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID']).optional(),
});

export type UpdateRideStatusDto = z.infer<typeof updateRideStatusSchema>;

export const bulkDeleteRidesSchema = z.object({
  ids: z
    .array(z.string().trim().min(1, { message: 'ID da corrida e obrigatorio' }))
    .min(1, { message: 'Informe ao menos uma corrida para excluir' })
    .max(500, { message: 'Voce pode excluir ate 500 corridas por vez' })
    .transform((ids) => Array.from(new Set(ids))),
});

export type BulkDeleteRidesDto = z.infer<typeof bulkDeleteRidesSchema>;

export const findAllRidesSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID']).optional(),
  clientId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
});

export type FindAllRidesDto = z.infer<typeof findAllRidesSchema>;

export const getStatsSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'year', 'custom']),
  start: z.string().optional(),
  end: z.string().optional(),
  clientId: z.string().optional(),
});

export type GetStatsDto = z.infer<typeof getStatsSchema>;
