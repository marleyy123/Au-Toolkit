import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createHandler, purchaseDate } from '../api/lynk-webhook.js';

const env = {
  VITE_FIREBASE_PROJECT_ID: 'au-toolkit-staging-20261005', LYNK_MERCHANT_KEY: 'test-merchant-key',
  LYNK_WEBHOOK_MODE: 'activate', LYNK_TEST_PRODUCT_UUID: 'test-product-uuid',
  APPS_SCRIPT_SHARED_SECRET: 's'.repeat(64),
  GOOGLE_SHEETS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbw4xs8YHS0r0jSXpqD8z0eg6jN25gTtziNOg18ILcy0bdBGR_NNIS_Vub4obYop__vd/exec',
};
const fixture = {
  event: 'payment.received', data: { message_action: 'SUCCESS', message_code: '0', message_id: 'message-1',
    message_data: { refId: 'order-1', createdAt: '2026-10-08T14:30:45',
      customer: { email: 'Buyer@Test.Example', name: 'Tester', phone: 'not-for-logs' },
      items: [{ uuid: env.LYNK_TEST_PRODUCT_UUID, title: 'AU Toolkit TEST', qty: 1, price: 15000 }],
      totals: { grandTotal: 14550 },
    },
  },
};
let forwarded = [];
const logs = [];
const handler = createHandler({ env, log: (...args) => logs.push(args), now: () => Date.parse('2026-10-08T12:00:00Z'),
  fetchImpl: async (url, options) => { forwarded.push({ url, body: JSON.parse(options.body) }); return { ok: true, json: async () => ({ success: true, status: 'PURCHASE_SYNCED', duplicate: false }) }; },
});
function sign(body) {
  const t = body.data.message_data;
  return createHash('sha256').update(String(t.totals.grandTotal) + t.refId + body.data.message_id + env.LYNK_MERCHANT_KEY).digest('hex');
}
async function call(body = fixture, { method = 'POST', signature = sign(body), target = handler } = {}) {
  let output;
  const res = { statusCode: 0, setHeader() {}, end(value) { output = JSON.parse(value); } };
  await target({ method, headers: { 'x-lynk-signature': signature }, body }, res);
  return { status: res.statusCode, ...output };
}
assert.equal((await call()).reason, 'PURCHASE_SYNCED');
assert.equal(forwarded[0].body.transaction.email, 'buyer@test.example');
assert.equal(forwarded[0].body.transaction.purchasedAt, '2026-10-08T07:30:45.000Z');
assert.equal(forwarded[0].body.action, 'ingestLynkPurchase');
assert(!JSON.stringify(forwarded).includes('not-for-logs'));
assert.equal((await call(fixture, { signature: '0'.repeat(64) })).status, 401);
assert.equal((await call(fixture, { method: 'PUT' })).status, 405);
assert.equal((await call('{bad', { signature: '' })).status, 400);
const oversized = JSON.stringify({ extra: 'x'.repeat(65536) });
assert.equal((await call(oversized, { signature: '' })).status, 413);
const wrongProject = createHandler({ env: { ...env, VITE_FIREBASE_PROJECT_ID: 'production' } });
assert.equal((await call(fixture, { target: wrongProject })).status, 503);
const noKey = createHandler({ env: { ...env, LYNK_MERCHANT_KEY: '' } });
assert.equal((await call(fixture, { target: noKey })).reason, 'MERCHANT_KEY_REQUIRED');
assert.equal((await call(fixture, { method: 'GET', target: noKey })).reason, 'WEBHOOK_HEALTH');
const wrongScript = createHandler({ env: { ...env, GOOGLE_SHEETS_SCRIPT_URL: 'https://production/exec' } });
assert.equal((await call(fixture, { target: wrongScript })).status, 503);
const inspect = createHandler({ env: { ...env, LYNK_WEBHOOK_MODE: 'inspect' }, log: (...args) => logs.push(args), fetchImpl: () => { throw new Error('Inspect must not write'); } });
assert.equal((await call(fixture, { target: inspect })).reason, 'INSPECTED_NO_ACCESS_GRANTED');
assert(!JSON.stringify(logs).includes('Buyer@Test.Example'));
assert(!JSON.stringify(logs).includes(env.LYNK_MERCHANT_KEY));
assert(JSON.stringify(logs).includes(env.LYNK_TEST_PRODUCT_UUID));
const clone = () => structuredClone(fixture);
const unrelated = clone(); unrelated.data.message_data.items[0].uuid = 'another-product';
assert.equal((await call(unrelated)).reason, 'IGNORED_PRODUCT');
const quantity = clone(); quantity.data.message_data.items[0].qty = 2;
assert.equal((await call(quantity)).status, 422);
const pending = clone(); pending.data.message_action = 'PENDING';
assert.equal((await call(pending)).reason, 'IGNORED_EVENT');
const free = clone(); free.data.message_data.totals.grandTotal = 0;
assert.equal((await call(free)).reason, 'PURCHASE_SYNCED');
const future = clone(); future.data.message_data.createdAt = '2027-10-08T14:30:45';
assert.equal((await call(future)).status, 422);
const failure = createHandler({ env, fetchImpl: async () => ({ ok: true, json: async () => ({ success: false }) }) });
assert.equal((await call(fixture, { target: failure })).status, 502);
const duplicate = createHandler({ env, fetchImpl: async () => ({ ok: true, json: async () => ({ success: true, status: 'PURCHASE_SYNCED', duplicate: true }) }) });
assert.equal((await call(fixture, { target: duplicate })).duplicate, true);
assert.equal(purchaseDate('2026-02-30T14:30:45'), null);
assert.equal(purchaseDate('2026-10-08T24:30:45'), null);
assert.equal(purchaseDate('2026-10-08T14:30:45Z'), '2026-10-08T14:30:45.000Z');
console.log('PASS Lynk staging webhook: signature, inspect isolation, product filter, dates, zero amount, errors and config guards');
