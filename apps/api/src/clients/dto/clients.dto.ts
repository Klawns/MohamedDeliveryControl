import { z } from 'zod';

export const createClientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'O nome do cliente é obrigatório' }),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export type CreateClientBodyDto = z.infer<typeof createClientSchema>;

export const updateClientSchema = z.object({
  name: z.string().trim().min(1).optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  isPinned: z.boolean().optional(),
});

export type UpdateClientBodyDto = z.infer<typeof updateClientSchema>;

export const findAllClientsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  search: z.string().optional(),
});

export type FindAllClientsDto = z.infer<typeof findAllClientsSchema>;

export const addPartialPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  notes: z.string().optional(),
});

export type AddPartialPaymentDto = z.infer<typeof addPartialPaymentSchema>;

export const getClientPaymentsSchema = z.object({
  status: z.enum(['UNUSED', 'USED']).optional(),
});

export type GetClientPaymentsDto = z.infer<typeof getClientPaymentsSchema>;
