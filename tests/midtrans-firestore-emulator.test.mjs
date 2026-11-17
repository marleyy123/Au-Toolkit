import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import admin from 'firebase-admin';
import { createMidtransHandler } from '../lib/midtrans.js';
import { createAccessStore } from '../lib/staging-access-store.js';

const projectId = 'demo-au-toolkit-review';
const emulatorHost = '127.0.0.1:8288';
const origin = 'https://staging.example';

if (!admin.apps.length) {
  process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
  admin.initializeApp({ projectId });
}

const db = admin.firestore();
db.settings({ host: emulatorHost, ssl: false });

const digest = value => createHash('sha256').update(String(value || '')).digest('hex');
const lockIdForEmail = email => digest(String(email || '').trim().toLowerCase());

async function clearCollection(name) {
  const snapshot = await db.collection(name).get();
  const writes = snapshot.docs.map(doc => doc.ref.delete());
  await Promise.all(writes);
}

async function clearAll() {
  await clearCollection('midtransOrders');
  await clearCollection('midtransActiveOrders');
  await clearCollection('midtransLimits');
  await clearCollection('billingAccounts');
  await clearCollection('billingPurchases');
  await clearCollection('billingAdminAudit');
  await clearCollection('workspaceAccess');
}

async function call(handler, payload, country = 'ID') {
  const request = {
    method: 'POST',
    headers: {
      origin,
      host: 'staging.example',
      'x-vercel-ip-country': country,
      'client-ip': '127.0.0.1',
    },
    body: JSON.stringify(payload),
    socket: { remoteAddress: '127.0.0.1' },
  };
  const response = {
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    end(raw) { this.raw = raw; },
  };
  await handler(request, response);
  return { code: response.statusCode, body: response.raw ? JSON.parse(response.raw) : {} };
}

(async () => {
  await clearAll();

  const env = {
    VITE_FIREBASE_PROJECT_ID: projectId,
    FIREBASE_PROJECT_ID: projectId,
    MIDTRANS_TEST_PROJECT_ID: projectId,
    FIREBASE_ADMIN_SERVICE_ACCOUNT: 'test-only',
    ACCESS_BACKEND: 'firestore',
    MIDTRANS_IS_PRODUCTION: 'false',
    MIDTRANS_SERVER_KEY: 'SB-Mid-server-test',
    MIDTRANS_CLIENT_KEY: 'SB-Mid-client-test',
    ALLOWED_ORIGINS: origin,
    APP_URL: origin,
    VERCEL: '1',
    NODE_ENV: 'test',
  };

  const providerCalls = [];
  const fetchImpl = async (url, options = {}) => {
    providerCalls.push({ url, method: options.method || 'GET', body: options.body ? JSON.parse(options.body) : null });
    if (url.includes('/snap/v1/transactions') && options.method === 'POST') {
      if (providerCalls.length === 1) {
        throw Object.assign(new Error('timeout'), { name: 'AbortError' });
      }
      return { ok: true, status: 201, json: async () => ({ token: 'snap-token-' + cryptoRandom() }) };
    }
    return { ok: true, status: 200, json: async () => ({ status_code: '200', transaction_status: 'pending' }) };
  };

  const store = createAccessStore(db, () => Date.now());
  const handlerA = createMidtransHandler({ env, fetchImpl, getDb: () => db, getStore: () => store });
  const handlerB = createMidtransHandler({ env, fetchImpl, getDb: () => db, getStore: () => store });

  const payload = { action: 'create', email: 'duplicate@example.com', planId: 'monthly', uid: 'user-1' };
  const firstResponse = await call(handlerA, payload);

  const lockRef = db.collection('midtransActiveOrders').doc(lockIdForEmail('duplicate@example.com'));
  const lockDoc = await lockRef.get();
  const ordersSnapshot = await db.collection('midtransOrders').get();

  console.log('FIRST_REQUEST', JSON.stringify({
    code: firstResponse.code,
    body: firstResponse.body,
    providerCount: providerCalls.length,
    lockExists: lockDoc.exists,
    orderCount: ordersSnapshot.size,
  }));

  const secondResponse = await call(handlerB, payload);
  const secondLockDoc = await lockRef.get();
  const secondOrdersSnapshot = await db.collection('midtransOrders').get();

  console.log('SECOND_REQUEST', JSON.stringify({
    code: secondResponse.code,
    body: secondResponse.body,
    providerCount: providerCalls.length,
    lockExists: secondLockDoc.exists,
    orderCount: secondOrdersSnapshot.size,
    lockData: secondLockDoc.exists ? secondLockDoc.data() : null,
    orderIds: secondOrdersSnapshot.docs.map(doc => doc.id),
  }));

  assert.ok(providerCalls.length >= 1, 'At least the first create request should reach the provider path.');
  assert.equal(providerCalls.length, 1, 'Second create request must not trigger a second provider transaction while first remains unresolved.');
  assert.ok(secondLockDoc.exists, 'The unresolved lock must remain stored after timeout.');
  assert.equal(secondOrdersSnapshot.size, 1, 'Only a single order document should remain unresolved in emulator Firestore.');
  assert.ok(
    secondResponse.body.success === true && secondResponse.body.code === 'PAYMENT_STATUS_UNKNOWN' ||
    !secondResponse.body.success ||
    secondResponse.body.reason === 'CHECKOUT_RATE_LIMIT' ||
    secondResponse.body.reason === 'ACTIVE_ORDER_EXISTS',
    'Second create must not create a new provider transaction; it must either reuse the unresolved state or be blocked by the active lock.'
  );

  await clearAll();
  console.log('EMULATOR_TEST_PASS');
})().catch(error => {
  console.error('EMULATOR_TEST_FAILED', error);
  process.exitCode = 1;
}).finally(async () => {
  await clearAll().catch(() => {});
  if (admin.apps.length) {
    await admin.app().delete().catch(() => {});
  }
});

function cryptoRandom() {
  return Array.from({ length: 10 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}
