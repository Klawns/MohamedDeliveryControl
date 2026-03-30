export const PAYMENT_PLAN_IDS = [
  'starter',
  'premium',
  'lifetime',
] as const;

export type PaymentPlanId = (typeof PAYMENT_PLAN_IDS)[number];

export interface StoredPricingPlan {
  id: string;
  name: string;
  price: number;
  interval: string | null;
  description: string;
  features: string;
  cta: string;
  highlight: boolean;
  updatedAt: Date;
}

export interface PricingPlan extends Omit<StoredPricingPlan, 'id'> {
  id: PaymentPlanId;
}

export type PricingPlanUpdate = Partial<
  Omit<PricingPlan, 'id' | 'updatedAt'>
>;

const PLAN_UUIDS: Record<PaymentPlanId, string> = {
  starter: '11111111-1111-1111-1111-111111111111',
  premium: '22222222-2222-2222-2222-222222222222',
  lifetime: '33333333-3333-3333-3333-333333333333',
};

const DEFAULT_PLAN_NAMES: Record<PaymentPlanId, string> = {
  starter: 'Starter',
  premium: 'Premium',
  lifetime: 'Lifetime',
};

const DEFAULT_PRICING_PLANS: Record<
  PaymentPlanId,
  Omit<StoredPricingPlan, 'updatedAt'>
> = {
  starter: {
    id: PLAN_UUIDS.starter,
    name: DEFAULT_PLAN_NAMES.starter,
    price: 0,
    interval: null,
    description: 'Ideal para comecar e testar a plataforma.',
    features: JSON.stringify([
      'Ate 50 corridas incluidas',
      'Controle de clientes basico',
      'Relatorios mensais',
      'Suporte via comunidade',
    ]),
    cta: 'Comecar Gratis',
    highlight: false,
  },
  premium: {
    id: PLAN_UUIDS.premium,
    name: DEFAULT_PLAN_NAMES.premium,
    price: 4990,
    interval: '/mes',
    description: '30 dias de acesso total com renovacao via Pix.',
    features: JSON.stringify([
      'Corridas ilimitadas',
      'Dashboard advanced',
      'Relatorios PDF customizados',
      'Suporte prioritario',
      'Integracao com pagamentos',
    ]),
    cta: 'Assinar Premium',
    highlight: true,
  },
  lifetime: {
    id: PLAN_UUIDS.lifetime,
    name: DEFAULT_PLAN_NAMES.lifetime,
    price: 49700,
    interval: null,
    description: 'Acesso vitalicio para quem nao quer mensalidade.',
    features: JSON.stringify([
      'Tudo do Premium',
      'Novas atualizacoes para sempre',
      'Acesso antecipado a recursos',
      'Badges exclusivos',
    ]),
    cta: 'Comprar Vitalicio',
    highlight: false,
  },
};

function normalize(value?: string | null) {
  return value?.trim().toLowerCase() ?? '';
}

function bindPlan(
  resolved: Map<PaymentPlanId, StoredPricingPlan>,
  remaining: StoredPricingPlan[],
  id: PaymentPlanId,
  predicate: (plan: StoredPricingPlan) => boolean,
) {
  if (resolved.has(id)) {
    return;
  }

  const index = remaining.findIndex(predicate);

  if (index === -1) {
    return;
  }

  resolved.set(id, remaining.splice(index, 1)[0]);
}

export function isPaymentPlanId(value: string): value is PaymentPlanId {
  return PAYMENT_PLAN_IDS.includes(value as PaymentPlanId);
}

export function resolveStoredPlans(plans: StoredPricingPlan[]) {
  const resolved = new Map<PaymentPlanId, StoredPricingPlan>();
  const remaining = [...plans];

  for (const id of PAYMENT_PLAN_IDS) {
    bindPlan(
      resolved,
      remaining,
      id,
      (plan) =>
        normalize(plan.id) === id ||
        plan.id === PLAN_UUIDS[id] ||
        normalize(plan.name) === normalize(DEFAULT_PLAN_NAMES[id]),
    );
  }

  bindPlan(resolved, remaining, 'starter', (plan) => plan.price === 0);
  bindPlan(
    resolved,
    remaining,
    'premium',
    (plan) => normalize(plan.interval) === '/mes' || plan.highlight,
  );

  if (!resolved.has('lifetime') && remaining.length === 1) {
    resolved.set('lifetime', remaining[0]);
  }

  return resolved;
}

export function getStoredPlanByPublicId(
  plans: StoredPricingPlan[],
  id: PaymentPlanId,
) {
  return resolveStoredPlans(plans).get(id);
}

export function listPublicPricingPlans(plans: StoredPricingPlan[]) {
  const resolved = resolveStoredPlans(plans);

  return PAYMENT_PLAN_IDS.flatMap((id) => {
    const plan = resolved.get(id);

    if (!plan) {
      return [];
    }

    return [{ ...plan, id }];
  });
}

export function getMissingDefaultPlans(plans: StoredPricingPlan[]) {
  const resolved = resolveStoredPlans(plans);

  return PAYMENT_PLAN_IDS.filter((id) => !resolved.has(id)).map(
    (id) => DEFAULT_PRICING_PLANS[id],
  );
}
