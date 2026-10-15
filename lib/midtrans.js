import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { ACCESS_PLANS } from './access-plans.js';
import { accessView, createAccessStore, getStagingDb, PROJECT_ID, normalizeEmail } from './staging-access-store.js';

export const usesMidtrans = env => env.VITE_FIREBASE_PROJECT_ID === PROJECT_ID && Boolean(env.MIDTRANS_SERVER_KEY);
export function midtransConfig(env) {
  if (env.VITE_FIREBASE_PROJECT_ID !== PROJECT_ID || env.MIDTRANS_IS_PRODUCTION !== 'false') throw new Error('SANDBOX_REQUIRED');
  // Sandbox dashboard keys can use Mid-* as well as the SB-Mid-* form.
  // The explicit mode and fixed Sandbox API URLs select the environment, not the prefix.
  if (!/^(?:SB-)?Mid-server-[A-Za-z0-9_-]+$/.test(env.MIDTRANS_SERVER_KEY || '') ||
      !/^(?:SB-)?Mid-client-[A-Za-z0-9_-]+$/.test(env.MIDTRANS_CLIENT_KEY || '')) throw new Error('SANDBOX_KEYS_REQUIRED');
  if (env.ACCESS_BACKEND !== 'firestore') throw new Error('FIRESTORE_ACCESS_REQUIRED');
  if (!env.FIREBASE_ADMIN_SERVICE_ACCOUNT) throw new Error('FIREBASE_ADMIN_CONFIG_REQUIRED');
  return { serverKey: env.MIDTRANS_SERVER_KEY, clientKey: env.MIDTRANS_CLIENT_KEY };
}
export function paymentCountry(req, env) {
  const value = env.VERCEL === '1' ? req.headers['x-vercel-ip-country'] :
    env.NODE_ENV !== 'production' && env.MIDTRANS_LOCAL_TEST === 'true' ? env.LANDING_DEV_COUNTRY || 'ID' : '';
  const country = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!/^[A-Z]{2}$/.test(country) || ['XX', 'ZZ'].includes(country)) throw new Error('REGION_UNAVAILABLE');
  return country;
}
export function midtransPlans(country) {
  return ACCESS_PLANS.map(plan => ({ id: plan.id, title: plan.title, accessDays: plan.accessDays,
    amount: plan.id === 'monthly' ? country === 'ID' ? 15000 : 30000 : 0,
    checkout: null, available: plan.id === 'monthly' }));
}
const digest = value => createHash('sha256').update(value).digest('hex');
export function validMidtransSignature(body, key) {
  if (!/^[a-f0-9]{128}$/i.test(body?.signature_key || '') ||
      !['order_id', 'status_code', 'gross_amount'].every(k => typeof body[k] === 'string')) return false;
  const expected = createHash('sha512').update(body.order_id + body.status_code + body.gross_amount + key).digest();
  return timingSafeEqual(expected, Buffer.from(body.signature_key, 'hex'));
}
function parseBody(req) {
  const raw = typeof req.body === 'string' || Buffer.isBuffer(req.body) ? String(req.body) : JSON.stringify(req.body);
  if (!raw || Buffer.byteLength(raw) > 16384) throw new Error('INVALID_REQUEST');
  const body = JSON.parse(raw);
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('INVALID_REQUEST');
  return body;
}

export function createMidtransHandler({ env = process.env, fetchImpl = fetch, now = () => Date.now(),
  getDb = () => getStagingDb(env), getStore = db => createAccessStore(db, now), webhook = false } = {}) {
  return async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    const reply = (code, data) => { res.statusCode = code; res.end(JSON.stringify(data)); };
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return reply(405, { success: false, reason: 'METHOD_NOT_ALLOWED' }); }
    let config;
    try { config = midtransConfig(env); } catch (e) { return reply(503, { success: false, reason: e.message }); }
    let body;
    try { body = parseBody(req); } catch { return reply(400, { success: false, reason: 'INVALID_REQUEST' }); }
    // Browser requests cannot be relayed from another site. Webhooks authenticate by signature.
    if (!webhook && req.headers.origin) {
      const allowed = String(env.ALLOWED_ORIGINS || env.APP_URL || '').split(',').map(v => v.trim());
      // Vercel binds Host to this deployment. Local tests accept only a matching loopback origin.
      const host = String(req.headers.host || '');
      if (env.VERCEL === '1' && /^[a-zA-Z0-9.-]+(?::\d+)?$/.test(host)) allowed.push('https://' + host);
      if (env.NODE_ENV !== 'production' && env.MIDTRANS_LOCAL_TEST === 'true' && /^(localhost|127\.0\.0\.1)(?::\d+)?$/.test(host)) allowed.push('http://' + host);
      if (!allowed.includes(req.headers.origin)) return reply(403, { success: false, reason: 'ORIGIN_BLOCKED' });
    }
    if (webhook && !validMidtransSignature(body, config.serverKey)) return reply(401, { success: false, reason: 'INVALID_SIGNATURE' });
    const provider = async (path, payload) => {
      const response = await fetchImpl(path, { method: payload ? 'POST' : 'GET', signal: AbortSignal.timeout(12000),
        headers: { Authorization: 'Basic ' + Buffer.from(config.serverKey + ':').toString('base64'), 'Content-Type': 'application/json', Accept: 'application/json' },
        ...(payload ? { body: JSON.stringify(payload) } : {}) });
      const data = await response.json();
      if (response.status === 401 || String(data.status_code) === '401') throw new Error('SANDBOX_AUTH_FAILED');
      if (response.status === 404 || data.status_code === '404') return null;
      if (!response.ok) throw new Error('PAYMENT_PROVIDER_ERROR');
      return data;
    };
    try {
      const db = getDb();
      const orders = db.collection('midtransOrders');
      if (!webhook && body.action === 'create') {
        const email = normalizeEmail(body.email);
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(400, { success: false, reason: 'EMAIL_REQUIRED' });
        const country = paymentCountry(req, env);
        const plan = midtransPlans(country).find(p => p.id === body.planId && p.available);
        if (!plan) return reply(400, { success: false, reason: 'PLAN_UNAVAILABLE' });
        // Reserve before the provider call; concurrent requests cannot bypass the limits.
        const ip = String(env.VERCEL === '1' ? req.headers['x-forwarded-for'] || req.headers['x-vercel-forwarded-for'] || 'unknown' : req.socket?.remoteAddress || 'local').split(',')[0].trim();
        const limits = [db.collection('midtransLimits').doc('email_' + digest(email)), db.collection('midtransLimits').doc('ip_' + digest(ip))];
        await db.runTransaction(async tx => {
          const snapshots = await Promise.all(limits.map(ref => tx.get(ref)));
          if (snapshots.some(s => s.exists && s.data().nextAt > now())) throw new Error('CHECKOUT_RATE_LIMIT');
          limits.forEach((ref, i) => tx.set(ref, { nextAt: now() + (i === 0 ? 30000 : 10000), expiresAt: new Date(now() + 86400000) }));
        });
        const orderId = 'au_sb_' + randomUUID().replaceAll('-', '');
        const token = randomBytes(32).toString('hex');
        const order = { orderId, email, planId: plan.id, amount: plan.amount, country,
          accessDays: plan.accessDays, createdAt: new Date(now()).toISOString(), tokenHash: digest(token), state: 'created' };
        await orders.doc(orderId).set(order);
        // No enabled_payments whitelist: Snap shows every active channel for this merchant.
        const data = await provider('https://app.sandbox.midtrans.com/snap/v1/transactions', {
          transaction_details: { order_id: orderId, gross_amount: plan.amount },
          item_details: [{ id: 'au-' + plan.id, price: plan.amount, quantity: 1, name: plan.title }],
          customer_details: { email }, credit_card: { secure: true },
          expiry: { unit: 'hours', duration: 24 },
        });
        if (typeof data?.token !== 'string' || !data.token) throw new Error('PAYMENT_PROVIDER_ERROR');
        await orders.doc(orderId).update({ snapToken: data.token, state: 'pending' });
        return reply(200, { success: true, orderId, statusToken: token, snapToken: data.token, clientKey: config.clientKey, sandbox: true, amount: plan.amount });
      }
      const orderId = webhook ? body.order_id : body.orderId;
      if ((!webhook && body.action !== 'status') || !/^au_sb_[a-f0-9]{32}$/.test(orderId || '')) return reply(400, { success: false, reason: 'INVALID_ORDER' });
      const ref = orders.doc(orderId);
      const snapshot = await ref.get();
      const order = snapshot.exists ? snapshot.data() : null;
      if (!order || (!webhook && (typeof body.statusToken !== 'string' || body.statusToken.length !== 64 || digest(body.statusToken) !== order.tokenHash))) {
        return reply(404, { success: false, reason: 'ORDER_NOT_FOUND' });
      }
      if (order.state === 'paid') {
        const access = accessView(await getStore(db).getAccount(order.email), now());
        return reply(200, { success: true, status: 'paid', accessActivated: access.accessGranted, reason: access.reason });
      }
      const data = await provider(`https://api.sandbox.midtrans.com/v2/${orderId}/status`);
      if (!data) return reply(200, { success: true, status: 'pending', accessActivated: false });
      if (data.order_id !== orderId || Number(data.gross_amount) !== order.amount || data.currency !== 'IDR') throw new Error('PAYMENT_VERIFICATION_FAILED');
      const paid = data.transaction_status === 'settlement' && (!data.fraud_status || data.fraud_status === 'accept') ||
        data.transaction_status === 'capture' && data.fraud_status === 'accept';
      if (paid) {
        if (!data.transaction_id || !['200'].includes(String(data.status_code))) throw new Error('PAYMENT_VERIFICATION_FAILED');
        const date = data.settlement_time || data.transaction_time;
        const purchasedAt = typeof date === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(date)
          ? new Date(date.replace(' ', 'T') + '+07:00').toISOString() : order.createdAt;
        const saved = await getStore(db).ingest({ ref: orderId, email: order.email, name: '', productId: 'midtrans-' + order.planId,
          planId: order.planId, accessDays: order.accessDays, amount: order.amount, currency: 'IDR', quantity: 1,
          purchasedAt, source: 'midtrans-sandbox' });
        await ref.update({ state: 'paid', transactionId: data.transaction_id });
        const access = accessView(saved.account, now());
        return reply(200, { success: true, status: 'paid', accessActivated: access.accessGranted, reason: access.reason });
      }
      const status = ['deny', 'cancel', 'expire', 'failure', 'refund', 'partial_refund'].includes(data.transaction_status) ? data.transaction_status : 'pending';
      return reply(200, { success: true, status, accessActivated: false });
    } catch (error) {
      const known = ['REGION_UNAVAILABLE', 'CHECKOUT_RATE_LIMIT', 'PAYMENT_VERIFICATION_FAILED', 'PAYMENT_PROVIDER_ERROR', 'SANDBOX_AUTH_FAILED', 'FIREBASE_ADMIN_CONFIG_REQUIRED', 'STAGING_CONFIG_REQUIRED'];
      const reason = known.includes(error.message) ? error.message : 'PAYMENT_SERVICE_UNAVAILABLE';
      return reply(reason === 'CHECKOUT_RATE_LIMIT' ? 429 : 503, { success: false, reason });
    }
  };
}
