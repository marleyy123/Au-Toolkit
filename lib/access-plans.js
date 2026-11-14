export const ACCESS_PLANS = [
  { id: 'monthly', title: 'Akses 1 Bulan', accessDays: 30, productEnv: 'LYNK_TEST_PRODUCT_UUID' },
  { id: 'quarterly', title: 'Akses 3 Bulan', accessDays: 90, productEnv: 'LYNK_TEST_PRODUCT_UUID_3_MONTHS', checkoutEnv: 'LYNK_TEST_CHECKOUT_URL_3_MONTHS' },
  { id: 'yearly', title: 'Akses 1 Tahun', accessDays: 365, productEnv: 'LYNK_TEST_PRODUCT_UUID_1_YEAR', checkoutEnv: 'LYNK_TEST_CHECKOUT_URL_1_YEAR' },
];

export function configuredProducts(env) {
  const plans = ACCESS_PLANS.map(plan => ({ ...plan, productId: String(env[plan.productEnv] || '').trim() }));
  const ids = plans.map(plan => plan.productId).filter(Boolean);
  if (ids.some(id => id.length > 200) || new Set(ids).size !== ids.length) throw new Error('INVALID_PLAN_CONFIG');
  return plans;
}
