// Development catalog. Keep legacy Lynk plans separate for existing purchases.
export const MIDTRANS_PLANS = [
  { id: 'monthly', title: 'Akses 1 Bulan', accessDays: 30, domesticAmount: 15000, internationalAmount: 39000 },
  { id: 'semiannual', title: 'Akses 6 Bulan', accessDays: 180, domesticAmount: 90000, internationalAmount: 234000 },
  { id: 'yearly', title: 'Akses 1 Tahun', accessDays: 365, domesticAmount: 180000, internationalAmount: 468000 },
];

export function midtransPlans(country) {
  return MIDTRANS_PLANS.map(plan => ({ id: plan.id, title: plan.title, accessDays: plan.accessDays,
    amount: country === 'ID' ? plan.domesticAmount : plan.internationalAmount,
    checkout: null, available: true }));
}
