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

export const bulkDeleteClientsSchema = z.object({
  ids: z
    .array(z.string().trim().min(1, { message: 'ID do cliente e obrigatorio' }))
    .min(1, { message: 'Informe ao menos um cliente para excluir' })
    .max(500, { message: 'Voce pode excluir ate 500 clientes por vez' })
    .transform((ids) => Array.from(new Set(ids))),
});

export type BulkDeleteClientsDto = z.infer<typeof bulkDeleteClientsSchema>;

export const findAllClientsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  search: z.string().optional(),
});

export type FindAllClientsDto = z.infer<typeof findAllClientsSchema>;

export const getClientDirectorySchema = z.object({
  search: z.string().trim().min(1).optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export type GetClientDirectoryDto = z.infer<typeof getClientDirectorySchema>;

export const addPartialPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  notes: z.string().optional(),
});

export type AddPartialPaymentDto = z.infer<typeof addPartialPaymentSchema>;

export const getClientPaymentsSchema = z.object({
  status: z.enum(['UNUSED', 'USED']).optional(),
});

export type GetClientPaymentsDto = z.infer<typeof getClientPaymentsSchema>;
