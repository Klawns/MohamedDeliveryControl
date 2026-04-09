import { adminKeys, paymentKeys } from '../lib/query-keys';
import { paymentsService } from '../services/payments-service';

export const PAYMENT_PLANS_QUERY_STALE_TIME_MS = 1000 * 60 * 5;
export const PAYMENT_PLANS_QUERY_POLL_INTERVAL_MS = 1000 * 60 * 5;

interface PlanInvalidationClient {
  invalidateQueries(filters: { queryKey: readonly unknown[] }): Promise<unknown>;
}

export function buildPaymentPlansQueryOptions() {
  return {
    queryKey: paymentKeys.plans(),
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      paymentsService.getPlans(signal),
    staleTime: PAYMENT_PLANS_QUERY_STALE_TIME_MS,
    refetchInterval: PAYMENT_PLANS_QUERY_POLL_INTERVAL_MS,
    refetchOnWindowFocus: 'always' as const,
    refetchOnReconnect: 'always' as const,
  };
}

export async function invalidatePlanCachesAfterAdminUpdate(
  queryClient: PlanInvalidationClient,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: adminKeys.plans() }),
    queryClient.invalidateQueries({ queryKey: adminKeys.usersAll() }),
    queryClient.invalidateQueries({ queryKey: paymentKeys.plans() }),
  ]);
}
