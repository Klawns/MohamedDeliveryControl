import { z } from 'zod';

export const rideResponseSchema = z.object({
  id: z.string(),
  value: z.number(),
  location: z.string().nullable(),
  notes: z.string().nullable(),
  photo: z.string().nullable(),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']),
  paymentStatus: z.enum(['PENDING', 'PAID']),
  rideDate: z.date().nullable(),
  createdAt: z.date(),
  paidWithBalance: z.number(),
  debtValue: z.number(),
  client: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
});

export type RideResponseDto = z.infer<typeof rideResponseSchema>;
