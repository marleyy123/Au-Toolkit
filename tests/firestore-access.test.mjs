import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createAccessStore, accountId, getStagingDb, accessView } from '../lib/staging-access-store.js';
import { createHandler as webhook } from '../api/lynk-webhook.js';
import { createHandler as verifyBuyer } from '../api/verify-buyer.js';
import { createHandler as sheetAdmin } from '../api/sheet-admin.js';

// Transactional fake commits atomically, serializes concurrent callers and rejects
// reads after writes, mirroring the constraints required by Firestore transactions.
class MemoryDb {
  rows = new Map();
  queue = Promise.resolve();
  collection(name) {
    let pageLimit = Infinity, cursor = '', orders = [], filters = [], positions = [];
    const query = { doc: id => ({ path: `${name}/${id}`, get: async () => this.snapshot(`${name}/${id}`),
      update: async patch => this.rows.set(`${name}/${id}`, { ...this.rows.get(`${name}/${id}`), ...patch }) }),
      where: (field, operator, value) => { filters.push({ field, operator, value }); return query; },
      orderBy: field => { orders.push(typeof field === 'string' ? field : '__name__'); return query; },
      limit: count => { pageLimit = count; return query; }, startAfter: (...values) => { if (values.length === 1) cursor = values[0]; else positions = values; return query; },
      get: async () => ({ docs: [...this.rows.keys()].filter(path => path.startsWith(name + '/') && path.slice(name.length + 1) > cursor)
        .filter(path => filters.every(({ field, operator, value }) => {
          const actual = this.rows.get(path)[field];
          return operator === '>=' ? actual >= value : actual <= value;
        }))
        .sort((a, b) => { const field = orders[0]; return field && field !== '__name__'
          ? String(this.rows.get(a)[field]).localeCompare(String(this.rows.get(b)[field])) || a.localeCompare(b) : a.localeCompare(b); })
        .filter(path => !positions.length || this.rows.get(path)[orders[0]] > positions[0] ||
          (this.rows.get(path)[orders[0]] === positions[0] && path.slice(name.length + 1) > positions[1]))
        .slice(0, pageLimit).map(path => ({ id: path.slice(name.length + 1), data: () => structuredClone(this.rows.get(path)) })) }),
    };
    return query;
  }
  snapshot(path) { return { exists: this.rows.has(path), data: () => structuredClone(this.rows.get(path)) }; }
  runTransaction(callback) {
    const operation = this.queue.then(async () => {
      const pending = new Map();
      const result = await callback({ get: async ref => { assert.equal(pending.size, 0, 'Read before writes'); return this.snapshot(ref.path); },
        set: (ref, value) => pending.set(ref.path, structuredClone(value)) });
      for (const [path, value] of pending) this.rows.set(path, value);
      return result;
    });
    this.queue = operation.catch(() => {});
    return operation;
  }
}
const db = new MemoryDb();
let clock = Date.parse('2026-10-10T03:00:00Z');
const now = () => clock;
const store = createAccessStore(db, now);
const purchase = { email: 'buyer@example.com', ref: 'order-1', name: 'Buyer', productId: 'product-test',
  purchasedAt: '2026-10-10T01:00:00.000Z', amount: 0, currency: 'IDR', quantity: 1, source: 'lynk' };
const first = await store.ingest(purchase);
for (const [planId, accessDays, expirationDate] of [['monthly', 30, '2026-11-09'], ['quarterly', 90, '2027-01-08'], ['yearly', 365, '2027-10-10']]) {
  const planStore = createAccessStore(new MemoryDb(), now);
  const order = { ...purchase, planId, accessDays };
  const saved = await planStore.ingest(order);
  assert.equal(saved.account.expirationDate, expirationDate);
  assert.equal(saved.purchase.accessDays, accessDays);
  assert.equal(saved.account.planId, planId);
  assert.equal((await planStore.ingest(order)).duplicate, true);
  assert.equal((await planStore.getAccount(purchase.email)).revision, 1, 'Duplicate cannot extend duration or revision');
  await assert.rejects(planStore.ingest({ ...order, planId: planId === 'monthly' ? 'yearly' : 'monthly', accessDays: planId === 'monthly' ? 365 : 30 }), /TRANSACTION_CONFLICT/);
  await assert.rejects(planStore.ingest({ ...order, accessDays: 9999 }), /INVALID_PURCHASE/);
}
const leapStore = createAccessStore(new MemoryDb(), now);
assert.equal((await leapStore.ingest({ ...purchase, planId: 'yearly', accessDays: 365, purchasedAt: '2024-02-29T01:00:00.000Z' })).account.expirationDate, '2025-02-28');
assert.equal(first.account.expirationDate, '2026-11-09');
assert.equal(accessView(first.account, clock).daysRemaining, 30);
const simultaneous = await Promise.all([store.ingest(purchase), store.ingest(purchase)]);
assert(simultaneous.every(result => result.duplicate));
assert.equal([...db.rows.keys()].filter(key => key.startsWith('billingPurchases/')).length, 1);
await assert.rejects(store.ingest({ ...purchase, email: 'other@example.com' }), /TRANSACTION_CONFLICT/);
await assert.rejects(store.ingest({ ...purchase, amount: 15000 }), /TRANSACTION_CONFLICT/);
const identity = { uid: 'buyer-uid' };
const desktop = { id: 'dev_desktop_hw_aabbccdd', type: 'desktop', label: 'Windows Laptop' };
const mobile = { id: 'dev_mobile_hw_aabbccdd', type: 'mobile', label: 'Android' };
const loginRace = await Promise.all([store.validate(purchase.email, identity, desktop),
  store.validate(purchase.email, identity, { ...desktop, id: 'dev_desktop_hw_11223344' })]);
assert.equal(loginRace[0].reason, 'ACCESS_GRANTED');
assert.equal(loginRace[1].reason, 'ACCESS_GRANTED', 'Multiple laptops can access the same verified buyer account');
assert.equal((await store.validate(purchase.email, identity, mobile)).reason, 'ACCESS_GRANTED');
assert.equal((await store.validate(purchase.email, identity)).reason, 'ACCESS_GRANTED', 'Device metadata is not required');
assert.equal(db.rows.get('workspaceAccess/buyer-uid').expiresAtMs, Date.parse('2026-11-08T17:00:00Z'));
assert.equal(db.rows.get('workspaceAccess/buyer-uid').active, true);
await assert.rejects(store.validate(purchase.email, { uid: 'another-uid' }, desktop), /ACCOUNT_IDENTITY_MISMATCH/);
let account = await store.getAccount(purchase.email);
assert.equal(account.revision, 2, 'Only initial identity binding changes the billing revision');
assert.equal(account.devices.desktop, null, 'Login does not allocate a billing device slot');
// Old imported slot data remains compatible but cannot block new devices.
db.rows.set(`billingAccounts/${accountId(purchase.email)}`, { ...account, devices: { desktop, mobile } });
assert.equal((await store.validate(purchase.email, identity, { ...desktop, id: 'dev_desktop_hw_99887766' })).reason, 'ACCESS_GRANTED');
const command = { email: purchase.email, expectedRevision: account.revision, commandId: 'admin-1',
  statusAccount: 'Inactive', expirationDate: account.expirationDate, resetDevice: null };
account = await store.administer(command);
assert.equal(db.rows.get('workspaceAccess/buyer-uid').active, false, 'Admin block revokes direct SDK access');
assert.equal((await store.validate(purchase.email, identity, desktop)).reason, 'ACCOUNT_INACTIVE');
assert.equal((await store.administer(command)).revision, account.revision, 'Admin retries are idempotent');
await assert.rejects(store.administer({ ...command, expirationDate: '2026-12-01' }), /ADMIN_COMMAND_CONFLICT/);
await assert.rejects(store.administer({ ...command, commandId: 'stale-command' }), /STALE_ADMIN_REVISION/);
await assert.rejects(store.administer({ ...command, expirationDate: '2026-02-30' }), /INVALID_ADMIN_COMMAND/);
const renewed = await store.ingest({ ...purchase, ref: 'renewal', purchasedAt: '2026-10-10T02:00:00.000Z' });
assert.equal(renewed.account.statusAccount, 'Inactive', 'Renewal cannot bypass an admin block');
assert.equal(db.rows.get('workspaceAccess/buyer-uid').active, false);
assert.equal(renewed.account.devices.desktop.id, desktop.id);
await store.ingest({ ...purchase, ref: 'old-delivery', purchasedAt: '2026-10-01T01:00:00.000Z' });
assert.equal((await store.getAccount(purchase.email)).ref, 'renewal', 'Old delivery does not replace newest subscription');
account = await store.getAccount(purchase.email);
account = await store.administer({ ...command, commandId: 'reset', expectedRevision: account.revision,
  statusAccount: 'Active', resetDevice: 'desktop', expirationDate: '2026-12-01' });
assert.equal(account.devices.desktop, null);
assert.equal(db.rows.get('workspaceAccess/buyer-uid').active, true);
assert.equal(db.rows.get('workspaceAccess/buyer-uid').expiresAtMs, Date.parse('2026-11-30T17:00:00Z'));
assert.equal(account.devices.mobile.id, mobile.id);
assert.equal((await store.validate(purchase.email, identity, { ...desktop, id: 'dev_desktop_hw_11223344' })).reason, 'ACCESS_GRANTED');
clock = Date.parse('2026-11-30T17:00:00Z');
assert.equal((await store.validate(purchase.email, identity, desktop)).reason, 'ACCOUNT_EXPIRED', 'Expiry boundary is Jakarta midnight');
clock = Date.parse('2026-10-10T03:00:00Z');
assert.throws(() => getStagingDb({ VITE_FIREBASE_PROJECT_ID: 'production' }), /STAGING_CONFIG_REQUIRED/);
assert.throws(() => getStagingDb({ VITE_FIREBASE_PROJECT_ID: 'au-toolkit-staging-20261005', FIREBASE_ADMIN_SERVICE_ACCOUNT: '{"project_id":"production"}' }), /FIREBASE_ADMIN_CONFIG_REQUIRED/);
assert.equal(db.rows.get(`billingAccounts/${accountId(purchase.email)}`).email, purchase.email);

async function invoke(handler, body, headers = {}, method = 'POST') {
  const res = { setHeader() {}, end(value) { this.body = value ? JSON.parse(value) : null; } };
  await handler({ body, method, headers }, res);
  return { ...res.body, httpStatus: res.statusCode };
}
const env = { VITE_FIREBASE_PROJECT_ID: 'au-toolkit-staging-20261005', ACCESS_BACKEND: 'firestore',
  LYNK_MERCHANT_KEY: 'test-only-key', LYNK_WEBHOOK_MODE: 'activate', LYNK_TEST_PRODUCT_UUID: purchase.productId,
  APPS_SCRIPT_SHARED_SECRET: 's'.repeat(64), GOOGLE_SHEETS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbw4xs8YHS0r0jSXpqD8z0eg6jN25gTtziNOg18ILcy0bdBGR_NNIS_Vub4obYop__vd/exec' };
const payload = { event: 'payment.received', data: { message_action: 'SUCCESS', message_code: '0', message_id: 'message-1',
  message_data: { refId: 'webhook-free-order', createdAt: purchase.purchasedAt, totals: { grandTotal: 0 },
    customer: { email: 'new-buyer@example.com', name: 'Buyer' }, items: [{ uuid: purchase.productId, title: 'TEST', qty: 1 }] } } };
const signature = createHash('sha256').update('0' + payload.data.message_data.refId + 'message-1' + env.LYNK_MERCHANT_KEY).digest('hex');
let reportSuccess = false;
const logs = [];
const hook = webhook({ env, now, getStore: () => store, log: (...args) => logs.push(args), fetchImpl: async (_, options) => {
  const body = JSON.parse(options.body);
  assert.equal(body.action, 'mirrorFirestorePurchase');
  assert.equal(body.account.email, 'new-buyer@example.com');
  return { ok: true, json: async () => ({ success: reportSuccess }) };
} });
assert.equal((await invoke(hook, payload, { 'x-lynk-signature': signature })).reason, 'SHEET_REPORT_PENDING');
assert(await store.getAccount('new-buyer@example.com'), 'Paid access survives report failure');
assert.equal(db.rows.get('billingPurchases/webhook-free-order').reportPending, true);
reportSuccess = true;
assert.equal((await invoke(hook, payload, { 'x-lynk-signature': signature })).duplicate, true);
assert.equal(db.rows.get('billingPurchases/webhook-free-order').reportPending, false);
assert(!JSON.stringify(logs).includes('new-buyer@example.com'));
const multiPlanEnv = { ...env, LYNK_TEST_PRODUCT_UUID_3_MONTHS: 'quarterly-test', LYNK_TEST_PRODUCT_UUID_1_YEAR: 'yearly-test' };
const multiPlanHook = webhook({ env: multiPlanEnv, now, getStore: () => store,
  fetchImpl: async () => ({ ok: true, json: async () => ({ success: true }) }) });
for (const [uuid, planId, accessDays] of [['quarterly-test', 'quarterly', 90], ['yearly-test', 'yearly', 365]]) {
  const order = structuredClone(payload);
  order.data.message_data.refId = `${planId}-zero-order`;
  order.data.message_data.customer.email = `${planId}@example.com`;
  order.data.message_data.items = [{ uuid, qty: 1, title: 'Misleading title: 30 days', accessDays: 9999 }];
  const signature = createHash('sha256').update('0' + order.data.message_data.refId + 'message-1' + env.LYNK_MERCHANT_KEY).digest('hex');
  assert.equal((await invoke(multiPlanHook, order, { 'x-lynk-signature': signature })).reason, 'PURCHASE_SYNCED');
  assert.equal((await store.getAccount(`${planId}@example.com`)).accessDays, accessDays, 'Duration comes only from trusted product UUID mapping');
  assert.equal((await invoke(multiPlanHook, order, { 'x-lynk-signature': signature })).duplicate, true);
}
const ambiguous = webhook({ env: { ...multiPlanEnv, LYNK_TEST_PRODUCT_UUID_3_MONTHS: env.LYNK_TEST_PRODUCT_UUID }, now });
assert.equal((await invoke(ambiguous, payload, { 'x-lynk-signature': signature })).reason, 'INVALID_PLAN_CONFIG');
const mixed = structuredClone(payload);
mixed.data.message_data.items.push({ uuid: 'quarterly-test', qty: 1 });
assert.equal((await invoke(multiPlanHook, mixed, { 'x-lynk-signature': signature })).reason, 'UNSUPPORTED_QUANTITY');

Object.assign(process.env, env);
delete process.env.GOOGLE_SHEETS_SCRIPT_URL;
delete process.env.APPS_SCRIPT_SHARED_SECRET;
const verify = verifyBuyer({ now, getStore: () => store, verifyToken: async token => {
  if (token !== 'valid') throw new Error();
  return { payload: { sub: 'new-uid', email: 'new-buyer@example.com', email_verified: true } };
}, fetchImpl: () => { throw new Error('Login must not read Sheets'); } });
assert.equal((await invoke(verify, {})).httpStatus, 401);
assert.equal((await invoke(verify, {}, { authorization: 'Bearer forged' })).httpStatus, 401);
assert.equal((await invoke(verify, { email: 'other@example.com' }, { authorization: 'Bearer valid' })).httpStatus, 403);
const precheck = await invoke(verify, { action: 'checkBuyerEmail', email: 'new-buyer@example.com' });
assert.equal(precheck.isValid, true);
assert.equal(precheck.laptopDeviceId, undefined, 'Public precheck must not disclose device IDs');
assert.equal((await invoke(verify, { deviceId: desktop.id, deviceType: 'desktop' }, { authorization: 'Bearer valid' })).reason, 'ACCESS_GRANTED');
assert.equal((await invoke(verify, {}, { authorization: 'Bearer valid' })).reason, 'ACCESS_GRANTED', 'Verified email works without a fingerprint');
assert.equal((await invoke(verify, { deviceId: 'different', deviceType: 'tablet' }, { authorization: 'Bearer valid' })).reason, 'ACCESS_GRANTED', 'Device fields do not determine access');
assert.equal((await invoke(verify, { action: 'healthCheck' })).backend, 'firestore');
const noDatabaseHealth = verifyBuyer({ getStore: () => { throw new Error('Health must not open Firestore'); } });
assert.equal((await invoke(noDatabaseHealth, { action: 'healthCheck' })).databaseChecked, false);
const unverified = verifyBuyer({ getStore: () => store, verifyToken: async () => ({ payload: { sub: 'new-uid', email: 'new-buyer@example.com', email_verified: false } }) });
assert.equal((await invoke(unverified, { deviceId: desktop.id }, { authorization: 'Bearer token' })).reason, 'INVALID_AUTH_TOKEN');
const unavailable = verifyBuyer({ getStore: () => { throw new Error('Firestore unavailable'); } });
assert.equal((await invoke(unavailable, { action: 'checkBuyerEmail', email: 'buyer@example.com' })).reason, 'FIRESTORE_UNAVAILABLE');
const admin = sheetAdmin({ env, getStore: () => store });
assert.equal((await invoke(admin, command)).httpStatus, 401);
assert.equal((await invoke(admin, command, { authorization: 'Bearer ' + '\u00e9'.repeat(64) })).httpStatus, 401);
const auth = { authorization: 'Bearer ' + env.APPS_SCRIPT_SHARED_SECRET };
assert.equal((await invoke(admin, { action: 'apply', ...command }, auth)).success, true);
assert.equal((await invoke(admin, { action: 'apply', ...command, commandId: 'stale-2' }, auth)).httpStatus, 409);
assert.equal((await invoke(admin, { action: 'list', collection: 'users' }, auth)).reason, 'INVALID_ACTION');
const pageDb = new MemoryDb();
for (let index = 0; index < 101; index++) pageDb.rows.set(`billingPurchases/order-${String(index).padStart(3, '0')}`, { ref: String(index) });
const pageAdmin = sheetAdmin({ env, getStore: () => createAccessStore(pageDb, now) });
const page = await invoke(pageAdmin, { action: 'list', collection: 'billingPurchases' }, auth);
assert.equal(page.rows.length, 100);
const lastPage = await invoke(pageAdmin, { action: 'list', collection: 'billingPurchases', cursor: page.cursor }, auth);
assert.equal(lastPage.rows.length, 1);
assert.equal(lastPage.cursor, null);
const changeDb = new MemoryDb();
const stamp = '2026-10-10T01:00:00.000Z';
for (let index = 0; index < 101; index++) changeDb.rows.set(`billingAccounts/row-${String(index).padStart(3, '0')}`, { updatedAt: stamp });
changeDb.rows.set('billingAccounts/old', { updatedAt: '2026-10-09T01:00:00.000Z' });
changeDb.rows.set('billingAccounts/future', { updatedAt: '2026-10-11T01:00:00.000Z' });
const changeStore = createAccessStore(changeDb, now);
const firstChanges = await changeStore.listChanges('billingAccounts', stamp, '2026-10-10T02:00:00.000Z');
assert.equal(firstChanges.rows.length, 100);
const remainingChanges = await changeStore.listChanges('billingAccounts', stamp, firstChanges.until, firstChanges.cursor);
assert.equal(remainingChanges.rows.length, 1, 'Timestamp ties must not skip rows across pages');
assert.equal(remainingChanges.cursor, null);
assert.equal((await changeStore.listChanges('billingAccounts', '2026-10-10T02:00:00.000Z', '2026-10-10T03:00:00.000Z')).rows.length, 0);
const changeAdmin = sheetAdmin({ env, getStore: () => changeStore });
assert.equal((await invoke(changeAdmin, { action: 'changes', collection: 'billingAccounts', since: 'bad-date' }, auth)).reason, 'INVALID_CURSOR');
const importStore = createAccessStore(new MemoryDb(), now);
const importer = sheetAdmin({ env: { ...env, FIRESTORE_IMPORT_ENABLED: 'true' }, getStore: () => importStore });
const imported = { email: 'legacy@example.com', ref: 'legacy-ref', buyerName: 'Legacy', purchaseDate: '2026-10-10',
  expirationDate: '2026-11-20', statusAccount: 'Inactive', devices: { mobile: null, desktop }, revision: 1, uid: null };
const importBody = { action: 'import', account: imported, purchase: { ...purchase, ref: imported.ref, email: imported.email, source: 'staging-import' } };
assert.equal((await invoke(admin, importBody, auth)).reason, 'INVALID_ACTION', 'Import disabled by default');
assert.equal((await invoke(importer, importBody, auth)).success, true);
assert.equal((await importStore.getAccount(imported.email)).expirationDate, imported.expirationDate);
assert.equal((await invoke(importer, importBody, auth)).duplicate, true);
const history = { action: 'importHistory', purchase: { ...importBody.purchase, ref: 'legacy-old', purchasedAt: '2026-10-01T01:00:00.000Z' } };
assert.equal((await invoke(importer, history, auth)).success, true);
assert.equal((await importStore.getAccount(imported.email)).ref, 'legacy-ref');
assert.equal((await invoke(importer, { ...history, purchase: { ...history.purchase, purchasedAt: '2026-10-10T02:00:00.000Z' } }, auth)).reason, 'IMPORT_ACCOUNT_REQUIRED');
assert.equal((await invoke(importer, { ...importBody, account: { ...imported, extra: 'bad' } }, auth)).reason, 'INVALID_IMPORT');
console.log('PASS Firestore staging: purchase deduplication, email-based multi-device access, renewals, Jakarta expiry, admin block/expiry/reset/audit/revision, migration, webhook report repair, authenticated login without Sheets.');
