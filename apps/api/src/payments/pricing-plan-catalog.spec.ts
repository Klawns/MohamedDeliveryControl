import {
  getMissingDefaultPlans,
  getStoredPlanByPublicId,
  listPublicPricingPlans,
  resolveStoredPlans,
  type StoredPricingPlan,
} from './pricing-plan-catalog';

function createPlan(overrides: Partial<StoredPricingPlan>): StoredPricingPlan {
  return {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Starter',
    price: 0,
    interval: null,
    description: 'desc',
    features: '[]',
    cta: 'cta',
    highlight: false,
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('pricing-plan-catalog', () => {
  it('returns the default catalog for an empty database', () => {
    const missingPlans = getMissingDefaultPlans([]);

    expect(missingPlans).toHaveLength(3);
    expect(missingPlans.map((plan) => plan.id)).toEqual([
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
    ]);
  });

  it('recognizes legacy sqlite ids without inserting duplicates', () => {
    const plans = [
      createPlan({ id: 'starter', name: 'Plano Gratis', price: 0 }),
      createPlan({
        id: 'premium',
        name: 'Plano Premium',
        price: 4990,
        interval: '/mes',
        highlight: true,
      }),
      createPlan({ id: 'lifetime', name: 'Vitalicio', price: 49700 }),
    ];

    expect(getMissingDefaultPlans(plans)).toEqual([]);
    expect(listPublicPricingPlans(plans).map((plan) => plan.id)).toEqual([
      'starter',
      'premium',
      'lifetime',
    ]);
  });

  it('resolves legacy postgres rows by business characteristics', () => {
    const starter = createPlan({
      id: 'ae3f6a4f-56d1-4ca5-8bc0-11ff1b3c08a1',
      name: 'Plano Inicial',
      price: 0,
    });
    const premium = createPlan({
      id: '13ec32d6-55be-4ca2-9160-0fca0d7c6d91',
      name: 'Plano Mensal',
      price: 4990,
      interval: '/mes',
      highlight: true,
    });
    const lifetime = createPlan({
      id: '21b997c3-f2aa-4d48-8135-b6de1fd86b6b',
      name: 'Acesso definitivo',
      price: 49700,
    });

    const resolved = resolveStoredPlans([premium, lifetime, starter]);

    expect(resolved.get('starter')).toBe(starter);
    expect(resolved.get('premium')).toBe(premium);
    expect(resolved.get('lifetime')).toBe(lifetime);
    expect(
      getStoredPlanByPublicId([premium, lifetime, starter], 'premium'),
    ).toBe(premium);
  });
});
