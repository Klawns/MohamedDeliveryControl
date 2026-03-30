import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z
    .string()
    .min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }),
  password: z
    .string()
    .min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
});

export type RegisterDto = z.infer<typeof registerSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z
      .string()
      .min(6, 'A nova senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

const googleOAuthCellphoneSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ''))
  .refine((value) => /^(?:55)?[1-9]{2}9\d{8}$/.test(value), {
    message: 'Celular inválido',
  });

export const googleOAuthStartQuerySchema = z.object({
  plan: z.enum(['starter', 'premium', 'lifetime']).optional(),
  cellphone: z.preprocess(
    (value) => {
      if (typeof value !== 'string') {
        return undefined;
      }

      const trimmedValue = value.trim();
      return trimmedValue.length > 0 ? trimmedValue : undefined;
    },
    googleOAuthCellphoneSchema.optional(),
  ),
});

export type GoogleOAuthStartQueryDto = z.infer<
  typeof googleOAuthStartQuerySchema
>;
export const profileSchema = z.object({
  name: z.string().min(2).optional(),
  taxId: z.string().min(11, 'CPF/CNPJ inválido').optional(),
  cellphone: z.string().min(10, 'Celular inválido').optional(),
});

export type ProfileDto = z.infer<typeof profileSchema>;

export const userSubscriptionResponseSchema = z.object({
  plan: z.enum(['starter', 'premium', 'lifetime']),
  status: z.enum([
    'active',
    'inactive',
    'canceled',
    'trial',
    'expired',
    'invalid',
  ]),
  trialStartedAt: z.date().or(z.string()).nullable().optional(),
  trialEndsAt: z.date().or(z.string()).nullable().optional(),
  trialDaysRemaining: z.number().int().nonnegative().optional(),
  isTrialExpiringSoon: z.boolean().optional(),
  validUntil: z.date().or(z.string()).nullable(),
  rideCount: z.number().int().nonnegative().optional(),
});

export const userResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
  taxId: z.string().optional().nullable(),
  cellphone: z.string().optional().nullable(),
  hasSeenTutorial: z.boolean().default(false),
  subscription: userSubscriptionResponseSchema.optional().nullable(),
  createdAt: z.date().or(z.string()).optional(),
});

export type UserResponseDto = z.infer<typeof userResponseSchema>;
