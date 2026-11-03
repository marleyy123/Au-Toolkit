// Development catalog. Keep legacy Lynk plans separate for existing purchases.
export const MIDTRANS_PLANS = [
  { id: 'monthly', title: 'Akses 1 Bulan', accessDays: 30, domesticAmount: 15000, internationalAmount: 39000 },
  { id: 'semiannual', title: 'Akses 6 Bulan', accessDays: 180, domesticAmount: 90000, internationalAmount: 234000 },
  { id: 'yearly', title: 'Akses 1 Tahun', accessDays: 365, domesticAmount: 180000, internationalAmount: 468000 },
];

export function midtransPlans(country, context) {
  const env = typeof context === 'object' && context !== null ? context : (typeof process !== 'undefined' ? process.env : {});
  const devPriceStr = env?.MIDTRANS_DEV_PRICE || env?.VITE_MIDTRANS_DEV_PRICE ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MIDTRANS_DEV_PRICE) ||
    (env?.production === false && env?.plans?.[0]?.amount ? String(env.plans[0].amount) : null);
  const isDev = env?.production === false || env?.MIDTRANS_IS_PRODUCTION === 'false' || env?.MIDTRANS_LOCAL_TEST === 'true' || Boolean(devPriceStr);
  const devPrice = (isDev && devPriceStr) ? Number(devPriceStr) : null;

  return MIDTRANS_PLANS.map(plan => {
    let amount = country === 'ID' ? plan.domesticAmount : plan.internationalAmount;
    if (devPrice !== null && plan.id === 'monthly') {
      amount = devPrice;
    }
    return {
      id: plan.id,
      title: plan.title,
      accessDays: plan.accessDays,
      amount,
      checkout: null,
      available: true
    };
  });
}
