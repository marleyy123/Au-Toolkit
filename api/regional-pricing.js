import { configuredProducts } from '../lib/access-plans.js';

const DOMESTIC_CHECKOUT = 'https://lynk.id/sempiternal/l755mjy6y4v5/checkout';
const INTERNATIONAL_CHECKOUT = 'https://lynk.id/sempiternal/6qnn7x36v3xq/checkout';

function checkoutUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'lynk.id' && !url.username && !url.password &&
      url.pathname.endsWith('/checkout') ? url.href : null;
  } catch { return null; }
}

export function createHandler({ env = process.env } = {}) {
  return (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // Never share a country-specific quote across visitors at the CDN or browser.
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    res.setHeader('Vary', 'x-vercel-ip-country');
    const reply = (status, data) => { res.statusCode = status; res.end(JSON.stringify(data)); };
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return reply(405, { success: false, reason: 'METHOD_NOT_ALLOWED' });
    }
    // Only use Vercel's IP-derived header. Ignore query, cookies, language and client body.
    const header = req.headers['x-vercel-ip-country'];
    const country = typeof header === 'string' ? header.trim().toUpperCase() : '';
    if (env.VERCEL !== '1' || !/^[A-Z]{2}$/.test(country) || ['XX', 'ZZ'].includes(country)) {
      return reply(503, { success: false, reason: 'REGION_UNAVAILABLE' });
    }
    const domestic = country === 'ID';
    const configuredUrl = domestic ? env.LYNK_DOMESTIC_CHECKOUT_URL || DOMESTIC_CHECKOUT : env.LYNK_INTERNATIONAL_CHECKOUT_URL || INTERNATIONAL_CHECKOUT;
    const checkout = configuredUrl ? checkoutUrl(configuredUrl) : null;
    if (configuredUrl && !checkout) return reply(503, { success: false, reason: 'CHECKOUT_CONFIG_ERROR' });
    let configured;
    try { configured = configuredProducts(env); } catch { return reply(503, { success: false, reason: 'INVALID_PLAN_CONFIG' }); }
    const plans = configured.map(plan => {
      const url = plan.checkoutEnv ? String(env[plan.checkoutEnv] || '').trim() : '';
      const planCheckout = url ? checkoutUrl(url) : null;
      return { id: plan.id, title: plan.title, accessDays: plan.accessDays,
        amount: plan.id === 'monthly' ? domestic ? 15000 : 30000 : 0,
        checkout: plan.id === 'monthly' ? checkout :
          env.ACCESS_BACKEND === 'firestore' && env.VITE_FIREBASE_PROJECT_ID === 'au-toolkit-staging-20261005' && plan.productId ? planCheckout : null };
    });
    if (configured.some(plan => plan.checkoutEnv && env[plan.checkoutEnv] && !checkoutUrl(env[plan.checkoutEnv]))) {
      return reply(503, { success: false, reason: 'CHECKOUT_CONFIG_ERROR' });
    }
    return reply(200, {
      success: true, country, region: domestic ? 'indonesia' : 'international',
      amount: domestic ? 15000 : 30000, currency: 'IDR', checkout, plans,
    });
  };
}

export default createHandler();
