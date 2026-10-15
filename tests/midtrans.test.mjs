import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createMidtransHandler, midtransConfig } from '../lib/midtrans.js';
import { createHandler as pricing } from '../api/regional-pricing.js';
import { createAccessStore } from '../lib/staging-access-store.js';

// Atomic transactional double; no credentials, external APIs or deployed data used.
class Db {
  rows = new Map(); queue = Promise.resolve();
  snapshot(path) { return { exists: this.rows.has(path), data: () => this.rows.get(path) }; }
  collection(name) { return { doc: id => { const path = name + '/' + id; return { path,
    get: async () => this.snapshot(path), set: async data => this.rows.set(path, data),
    update: async data => this.rows.set(path, { ...this.rows.get(path), ...data }) }; } }; }
  runTransaction(fn) {
    const operation = this.queue.then(async () => { const writes = []; let writing = false;
      const result = await fn({ get: async ref => { assert(!writing, 'Reads must precede writes'); return this.snapshot(ref.path); },
        set: (ref, data) => { writing = true; writes.push([ref.path, data]); } });
      writes.forEach(([path, data]) => this.rows.set(path, data)); return result;
    }); this.queue = operation.catch(() => {}); return operation;
  }
}
const env = { VITE_FIREBASE_PROJECT_ID: 'au-toolkit-staging-20261005', ACCESS_BACKEND: 'firestore',
  FIREBASE_ADMIN_SERVICE_ACCOUNT: 'test-only', MIDTRANS_IS_PRODUCTION: 'false',
  MIDTRANS_SERVER_KEY: 'SB-Mid-server-test', MIDTRANS_CLIENT_KEY: 'SB-Mid-client-test', VERCEL: '1', ALLOWED_ORIGINS: 'https://staging.example' };
let clock = Date.parse('2026-10-15T05:00:00Z');
const db = new Db();
const store = createAccessStore(db, () => clock);
let providerStatus = null, payload, requests = 0;
const fetchImpl = async (url, options) => {
  requests++;
  assert(url.startsWith('https://app.sandbox.midtrans.com/') || url.startsWith('https://api.sandbox.midtrans.com/'));
  assert.equal(options.headers.Authorization, 'Basic ' + Buffer.from(env.MIDTRANS_SERVER_KEY + ':').toString('base64'));
  if (options.method === 'POST') { payload = JSON.parse(options.body); return { ok: true, status: 201, json: async () => ({ token: 'sandbox-token' }) }; }
  return { ok: true, status: providerStatus ? 200 : 404, json: async () => providerStatus || { status_code: '404' } };
};
const handler = createMidtransHandler({ env, fetchImpl, now: () => clock, getDb: () => db, getStore: () => store });
const webhook = createMidtransHandler({ env, fetchImpl, now: () => clock, getDb: () => db, getStore: () => store, webhook: true });
async function call(body, { method = 'POST', country = 'ID', origin, target = handler } = {}) {
  let data; const headers = {};
  const res = { setHeader: (k,v) => headers[k] = v, end: raw => data = JSON.parse(raw) };
  await target({ method, headers: { 'x-vercel-ip-country': country, ...(origin ? { origin } : {}) }, body }, res);
  assert.match(headers['Cache-Control'], /no-store/);
  return { code: res.statusCode, ...data };
}
assert.equal(midtransConfig({ ...env, MIDTRANS_SERVER_KEY: 'Mid-server-test', MIDTRANS_CLIENT_KEY: 'Mid-client-test' }).serverKey, 'Mid-server-test');
assert.throws(() => midtransConfig({ ...env, MIDTRANS_SERVER_KEY: 'invalid-key' }), /SANDBOX_KEYS_REQUIRED/);
assert.throws(() => midtransConfig({ ...env, MIDTRANS_IS_PRODUCTION: 'true' }), /SANDBOX_REQUIRED/);
assert.throws(() => midtransConfig({ ...env, VITE_FIREBASE_PROJECT_ID: 'production' }), /SANDBOX_REQUIRED/);
assert.throws(() => midtransConfig({ ...env, ACCESS_BACKEND: 'sheets' }), /FIRESTORE_ACCESS_REQUIRED/);
assert.equal((await call({}, { method: 'GET' })).code, 405);
assert.equal((await call({ action: 'create' }, { origin: 'https://evil.example' })).code, 403);
assert.equal((await call({ action: 'create', email: 'nope', planId: 'monthly' })).code, 400);
assert.equal((await call({ action: 'create', email: 'buyer@example.com', planId: 'quarterly' })).code, 400);
assert.equal((await call({ action: 'create', email: 'buyer@example.com', planId: 'monthly' }, { country: undefined })).code, 200); // default country
clock += 31000;
const input = { action: 'create', email: 'BUYER@example.com', planId: 'monthly', amount: 1, accessDays: 99999, country: 'US' };
const parallel = await Promise.all([call(input), call(input)]);
assert.deepEqual(parallel.map(r => r.code).sort(), [200, 429]);
const order = parallel.find(r => r.code === 200);
assert.equal(order.amount, 15000);
assert.equal(payload.transaction_details.gross_amount, 15000);
assert.equal(payload.customer_details.email, 'buyer@example.com');
assert(!('enabled_payments' in payload), 'All active payment channels must remain available');
assert.equal(payload.item_details[0].quantity, 1);
assert(!JSON.stringify(order).includes(env.MIDTRANS_SERVER_KEY));
const status = { action: 'status', orderId: order.orderId, statusToken: order.statusToken };
assert.equal((await call({ ...status, statusToken: '0'.repeat(64) })).code, 404);
assert.equal((await call(status)).status, 'pending');
assert.equal(await store.getAccount(input.email), null);
providerStatus = { order_id: order.orderId, gross_amount: '15000.00', currency: 'IDR', transaction_id: 'sandbox-tx', status_code: '200', transaction_status: 'pending' };
for (const state of ['pending', 'deny', 'cancel', 'expire', 'failure', 'refund', 'partial_refund', 'authorize']) {
  providerStatus.transaction_status = state;
  assert.equal((await call(status)).accessActivated, false);
  assert.equal(await store.getAccount(input.email), null);
}
providerStatus.transaction_status = 'capture'; providerStatus.fraud_status = 'challenge';
assert.equal((await call(status)).accessActivated, false);
providerStatus.transaction_status = 'settlement'; providerStatus.fraud_status = 'deny';
assert.equal((await call(status)).accessActivated, false);
providerStatus.fraud_status = 'accept'; providerStatus.gross_amount = '1.00';
assert.equal((await call(status)).reason, 'PAYMENT_VERIFICATION_FAILED');
providerStatus.gross_amount = '15000.00'; providerStatus.currency = 'USD';
assert.equal((await call(status)).reason, 'PAYMENT_VERIFICATION_FAILED');
providerStatus.currency = 'IDR';
const notification = { order_id: order.orderId, status_code: '200', gross_amount: '15000.00', transaction_status: 'settlement' };
assert.equal((await call(notification, { target: webhook })).code, 401);
notification.signature_key = createHash('sha512').update(notification.order_id + notification.status_code + notification.gross_amount + env.MIDTRANS_SERVER_KEY).digest('hex');
// A signed success notification is insufficient when the provider still says pending.
providerStatus.transaction_status = 'pending';
assert.equal((await call(notification, { target: webhook })).accessActivated, false);
providerStatus.transaction_status = 'settlement'; providerStatus.settlement_time = '2026-10-15 11:59:00';
const deliveries = await Promise.all([call(notification, { target: webhook }), call(status)]);
assert(deliveries.every(result => result.accessActivated === true));
assert.equal((await store.getAccount(input.email)).expirationDate, '2026-11-14');
await Promise.all([call(status), call(notification, { target: webhook })]);
assert.equal((await store.getAccount(input.email)).revision, 1, 'Repeated delivery cannot renew access');
const accountEntry = [...db.rows.keys()].find(path => path.startsWith('billingAccounts/'));
db.rows.set(accountEntry, { ...db.rows.get(accountEntry), statusAccount: 'Inactive' });
const inactive = await call(status);
assert.equal(inactive.status, 'paid'); assert.equal(inactive.accessActivated, false);
assert.equal(inactive.reason, 'ACCOUNT_INACTIVE', 'Payment cannot override an admin block');
clock += 31000;
const intl = await call({ ...input, email: 'international@example.com' }, { country: 'US' });
assert.equal(intl.amount, 30000);
assert.equal((await call(input, { country: 'ZZ' })).reason, 'REGION_UNAVAILABLE');
const quote = await call(null, { method: 'GET', target: pricing({ env }) });
assert.equal(quote.provider, 'midtrans'); assert.equal(quote.ready, true);
assert.equal(quote.plans[0].available, true); assert.equal(quote.plans[1].available, false);
const broken = await call(null, { method: 'GET', target: pricing({ env: { ...env, MIDTRANS_CLIENT_KEY: 'invalid-key' } }) });
assert.equal(broken.ready, false); assert.equal(broken.reason, 'SANDBOX_KEYS_REQUIRED');
const rejectedDb = new Db();
const rejected = createMidtransHandler({ env: { ...env, MIDTRANS_SERVER_KEY: 'Mid-server-wrong-environment', MIDTRANS_CLIENT_KEY: 'Mid-client-test' },
  getDb: () => rejectedDb, fetchImpl: async url => {
    assert(url.startsWith('https://app.sandbox.midtrans.com/'), 'Never fall back to Production for rejected credentials');
    return { ok: false, status: 401, json: async () => ({ status_code: '401' }) };
  } });
assert.equal((await call({ action: 'create', email: 'rejected@example.com', planId: 'monthly' }, { target: rejected })).reason, 'SANDBOX_AUTH_FAILED');
assert(![...rejectedDb.rows.keys()].some(path => path.startsWith('billingAccounts/')));
console.log('PASS Midtrans sandbox: key guards, trusted region/price, all channels, concurrent rate limits, private order status, provider verification, signed webhook, paid activation and idempotency. Provider calls:', requests);
