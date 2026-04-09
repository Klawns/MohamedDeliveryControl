'use client';

import { useQuery } from '@tanstack/react-query';
import { buildPaymentPlansQueryOptions } from './payment-plans-query-options';

export function usePaymentPlans() {
  return useQuery(buildPaymentPlansQueryOptions());
}
