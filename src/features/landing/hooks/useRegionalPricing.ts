import { useEffect, useState } from 'react';
import { ACCESS_PLANS } from '../../../../lib/access-plans.js';

type PlanQuote = { id: string; accessDays: number; amount: number; checkout: string | null };
type Quote = { country: string; region: 'indonesia' | 'international'; amount: number; currency: 'IDR'; checkout: string | null; plans: PlanQuote[] };
type PricingState = { status: 'loading' | 'error'; quote?: never } | { status: 'ready'; quote: Quote };

function readQuote(value: unknown): Quote {
  const data = value as Quote & { success?: boolean };
  if (!data || data.success !== true || !/^[A-Z]{2}$/.test(data.country) || data.currency !== 'IDR' ||
      data.region !== (data.country === 'ID' ? 'indonesia' : 'international') ||
      data.amount !== (data.country === 'ID' ? 15000 : 30000)) throw new Error('Invalid quote');
  if (data.checkout !== null) {
    const url = new URL(data.checkout);
    if (typeof data.checkout !== 'string' || url.protocol !== 'https:' || url.hostname !== 'lynk.id' ||
        url.username || url.password || !url.pathname.endsWith('/checkout')) throw new Error('Invalid checkout');
  }
  const plans = ACCESS_PLANS.map(plan => ({ id: plan.id, accessDays: plan.accessDays,
    amount: plan.id === 'monthly' ? data.amount : 0, checkout: plan.id === 'monthly' ? data.checkout : null }));
  if (data.plans !== undefined) {
    if (!Array.isArray(data.plans) || data.plans.length !== plans.length) throw new Error('Invalid plans');
    for (const plan of plans) {
      const matches = data.plans.filter(item => item?.id === plan.id);
      if (matches.length !== 1 || matches[0].accessDays !== plan.accessDays || matches[0].amount !== plan.amount) throw new Error('Invalid plan');
      const checkout = matches[0].checkout;
      if (checkout !== null) {
        const url = new URL(checkout);
        if (typeof checkout !== 'string' || url.protocol !== 'https:' || url.hostname !== 'lynk.id' ||
            url.username || url.password || !url.pathname.endsWith('/checkout')) throw new Error('Invalid checkout');
      }
      if (plan.id === 'monthly' && checkout !== data.checkout) throw new Error('Invalid monthly checkout');
      plan.checkout = checkout;
    }
  }
  return { ...data, plans };
}

export function useRegionalPricing() {
  const [state, setState] = useState<PricingState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    setState({ status: 'loading' });
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    (async () => {
      try {
        const response = await fetch('/api/regional-pricing', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Region unavailable');
        const quote = readQuote(await response.json());
        if (!disposed) setState({ status: 'ready', quote });
      } catch {
        if (!disposed) setState({ status: 'error' });
      } finally { window.clearTimeout(timeout); }
    })();
    return () => { disposed = true; controller.abort(); window.clearTimeout(timeout); };
  }, [attempt]);
  return { ...state, retry: () => setAttempt(current => current + 1) };
}
