import { z } from 'zod';

export const checkoutSchema = z.object({
  plan: z.enum(['starter', 'premium', 'lifetime']),
  couponCode: z.string().optional(),
});

export type CheckoutDto = z.infer<typeof checkoutSchema>;
