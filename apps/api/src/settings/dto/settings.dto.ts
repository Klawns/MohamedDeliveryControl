import { z } from 'zod';

export const ridePresetIdParamSchema = z.string().uuid('ID de preset inválido');

export const createRidePresetSchema = z
  .object({
    label: z.string().trim().min(1).max(120),
    value: z.coerce.number().min(0),
    location: z.string().trim().min(1).max(200),
  })
  .strict();

export type CreateRidePresetDto = z.infer<typeof createRidePresetSchema>;

export const updateRidePresetSchema = z
  .object({
    label: z.string().trim().min(1).max(120).optional(),
    value: z.coerce.number().min(0).optional(),
    location: z.string().trim().min(1).max(200).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe pelo menos um campo para atualização.',
  });

export type UpdateRidePresetDto = z.infer<typeof updateRidePresetSchema>;
