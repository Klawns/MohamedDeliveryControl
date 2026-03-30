import { z } from 'zod';

export const createUserSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    role: z.enum(['admin', 'user']).default('user'),
  })
  .strict();

export type CreateUserDto = z.infer<typeof createUserSchema>;

export const adminEntityIdParamSchema = z.string().uuid('ID inválido');

export type AdminEntityIdParamDto = z.infer<typeof adminEntityIdParamSchema>;

export const recentUsersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .strict();

export type RecentUsersQueryDto = z.infer<typeof recentUsersQuerySchema>;

export const adminUpdateUserPlanSchema = z
  .object({
    plan: z.enum(['starter', 'premium', 'lifetime']),
  })
  .strict();

export type AdminUpdateUserPlanDto = z.infer<typeof adminUpdateUserPlanSchema>;

export const updatePricingPlanSchema = z
  .object({
    name: z.string().min(1).optional(),
    price: z.number().int().positive().optional(),
    interval: z.string().optional(),
    description: z.string().optional(),
    features: z.string().optional(),
    cta: z.string().optional(),
    highlight: z.boolean().optional(),
  })
  .strict();

export type UpdatePricingPlanDto = z.infer<typeof updatePricingPlanSchema>;

export const updateConfigSchema = z
  .object({
    key: z.string().min(1),
    value: z.string(),
    description: z.string().optional(),
  })
  .strict();

export type UpdateConfigDto = z.infer<typeof updateConfigSchema>;

export const createCouponSchema = z
  .object({
    code: z.string().min(1),
    percentOff: z.number().min(1).max(100).optional(),
    amountOff: z.number().positive().optional(),
    duration: z.enum(['once', 'repeating', 'forever']),
    durationInMonths: z.number().positive().optional(),
  })
  .strict();

export type CreateCouponDto = z.infer<typeof createCouponSchema>;
